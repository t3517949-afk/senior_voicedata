from __future__ import annotations

import hashlib
import subprocess
from functools import lru_cache
from pathlib import Path
from typing import Dict, Tuple

import numpy as np

from app.config import AUDIO_CORPUS_DIR


def _clamp_score(value: float) -> float:
    return float(np.clip(value, 1.0, 5.0))


def _resolve_audio_path(code: str) -> Path:
    if not code:
        raise FileNotFoundError("Audio code is empty.")

    candidate = (AUDIO_CORPUS_DIR / code).resolve()
    if not str(candidate).startswith(str(AUDIO_CORPUS_DIR)):
        raise FileNotFoundError("Audio path is outside the configured corpus directory.")
    if not candidate.exists():
        raise FileNotFoundError(f"Audio file not found: {candidate}")
    return candidate


def _decode_audio_to_mono_16k(audio_path: Path) -> Tuple[np.ndarray, int]:
    command = [
        "ffmpeg",
        "-v",
        "error",
        "-i",
        str(audio_path),
        "-f",
        "s16le",
        "-acodec",
        "pcm_s16le",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-",
    ]
    result = subprocess.run(command, capture_output=True, check=True)
    if not result.stdout:
        raise RuntimeError("Failed to decode audio with ffmpeg.")

    samples = np.frombuffer(result.stdout, dtype=np.int16).astype(np.float32) / 32768.0
    if samples.size == 0:
        raise RuntimeError("Decoded audio is empty.")
    return samples, 16000


def _frame_signal(samples: np.ndarray, frame_length: int, hop_length: int) -> np.ndarray:
    if samples.size < frame_length:
        pad_width = frame_length - samples.size
        samples = np.pad(samples, (0, pad_width), mode="constant")

    remainder = (samples.size - frame_length) % hop_length
    if remainder != 0:
        samples = np.pad(samples, (0, hop_length - remainder), mode="constant")

    return np.lib.stride_tricks.sliding_window_view(samples, frame_length)[::hop_length]


def _extract_features(samples: np.ndarray, sr: int) -> Dict[str, float]:
    frame_length = int(0.025 * sr)
    hop_length = int(0.01 * sr)
    duration_sec = float(samples.size / sr)

    frames = _frame_signal(samples, frame_length=frame_length, hop_length=hop_length)
    rms = np.sqrt(np.mean(frames * frames, axis=1) + 1e-10)
    silence_threshold = max(0.01, float(np.percentile(rms, 35) * 0.8))
    voiced = rms > silence_threshold

    voiced_ratio = float(np.mean(voiced))
    pause_ratio = float(1.0 - voiced_ratio)
    voiced_rms = rms[voiced]
    unvoiced_rms = rms[~voiced]

    starts = int(np.sum((~voiced[:-1]) & voiced[1:])) + (1 if voiced[0] else 0)
    segments_per_second = float(starts / max(duration_sec, 1e-6))

    zcr = np.mean(np.abs(np.diff(np.signbit(frames), axis=1)), axis=1)
    voiced_zcr = zcr[voiced] if voiced.any() else zcr

    long_pause_frames = 0
    run = 0
    for flag in (~voiced):
        if flag:
            run += 1
        elif run:
            if run * hop_length / sr >= 0.35:
                long_pause_frames += run
            run = 0
    if run and run * hop_length / sr >= 0.35:
        long_pause_frames += run
    long_pause_ratio = float(long_pause_frames / max(len(voiced), 1))

    voiced_power = float(np.mean(voiced_rms * voiced_rms)) if voiced_rms.size else 1e-8
    noise_power = float(np.mean(unvoiced_rms * unvoiced_rms)) if unvoiced_rms.size else voiced_power * 0.2
    snr_db = float(10.0 * np.log10((voiced_power + 1e-10) / (noise_power + 1e-10)))

    sample_frames = frames[::3]
    window = np.hanning(frame_length).astype(np.float32)
    fft_mag = np.abs(np.fft.rfft(sample_frames * window, axis=1)) + 1e-9
    freqs = np.fft.rfftfreq(frame_length, d=1 / sr)
    centroid = np.sum(fft_mag * freqs[None, :], axis=1) / np.sum(fft_mag, axis=1)

    return {
        "duration_sec": duration_sec,
        "pause_ratio": pause_ratio,
        "segments_per_second": segments_per_second,
        "energy_cv": float(np.std(voiced_rms) / (np.mean(voiced_rms) + 1e-8)) if voiced_rms.size else 1.0,
        "long_pause_ratio": long_pause_ratio,
        "zcr_mean": float(np.mean(voiced_zcr)),
        "snr_db": snr_db,
        "centroid_mean": float(np.mean(centroid)),
        "centroid_std": float(np.std(centroid)),
        "rms_std": float(np.std(rms)),
    }


def _lexical_features(reference_text: str | None) -> Dict[str, float]:
    if not reference_text:
        return {"token_count": 0.0, "lexical_diversity": 0.0}

    normalized = reference_text
    for char in "，。！？、；：,.!?;:\n\r\t":
        normalized = normalized.replace(char, " ")
    tokens = [token for token in normalized.split(" ") if token]
    if not tokens:
        return {"token_count": 0.0, "lexical_diversity": 0.0}
    return {
        "token_count": float(len(tokens)),
        "lexical_diversity": float(len(set(tokens)) / len(tokens)),
    }


def _compute_scores(features: Dict[str, float], lexical: Dict[str, float]) -> Dict[str, float]:
    fluency = _clamp_score(
        5.2
        - 3.2 * features["pause_ratio"]
        - 0.9 * abs(features["segments_per_second"] - 1.4)
    )
    tonal = _clamp_score(
        4.8
        - 2.0 * abs(features["energy_cv"] - 0.55)
        - 1.3 * features["long_pause_ratio"]
    )
    clarity = _clamp_score(
        1.4
        + 0.22 * features["snr_db"]
        + 1.1 * np.clip(features["centroid_mean"] / 4000.0, 0.0, 1.0)
        - 0.8 * max(features["zcr_mean"] - 0.18, 0.0)
    )
    richness = _clamp_score(
        2.0
        + 3.0 * np.clip(features["centroid_std"] / 900.0, 0.0, 1.2)
        + 1.2 * np.clip(features["rms_std"], 0.0, 0.2)
    )
    organization = _clamp_score(
        5.0
        - 2.2 * features["long_pause_ratio"]
        - 1.1 * abs(features["pause_ratio"] - 0.28)
    )

    if lexical["token_count"] > 0:
        richness = _clamp_score(richness + (lexical["lexical_diversity"] - 0.42) * 1.2)
        organization = _clamp_score(organization + (lexical["lexical_diversity"] - 0.42) * 1.0)

    return {
        "fluency": round(fluency, 1),
        "tonal": round(tonal, 1),
        "rate": round(clarity, 1),
        "naturalness": round(richness, 1),
        "pause": round(organization, 1),
    }


@lru_cache(maxsize=128)
def _score_audio_cached(path_str: str, mtime_ns: int, reference_text: str) -> Dict[str, object]:
    del mtime_ns
    audio_path = Path(path_str)
    samples, sr = _decode_audio_to_mono_16k(audio_path)
    features = _extract_features(samples, sr)
    lexical = _lexical_features(reference_text)
    scores = _compute_scores(features, lexical)
    total_score = round(float(np.mean(list(scores.values())) * 20.0), 1)

    return {
        "total_score": total_score,
        "features": {
            "duration_sec": round(features["duration_sec"], 2),
            "pause_ratio": round(features["pause_ratio"], 3),
            "long_pause_ratio": round(features["long_pause_ratio"], 3),
            "snr_db": round(features["snr_db"], 2),
            "segments_per_second": round(features["segments_per_second"], 3),
        },
    }


def score_audio_by_code(code: str, reference_text: str | None = None) -> Dict[str, object]:
    audio_path = _resolve_audio_path(code)
    text = (reference_text or "").strip()
    cached_result = _score_audio_cached(str(audio_path), audio_path.stat().st_mtime_ns, text)

    return {
        "code": code,
        "audio_path": str(audio_path),
        "source": "FZSpeak indicator-compatible machine scoring",
        "total_score": cached_result["total_score"],
        "indicators": {
            "category": "read_sentence",
            "language": "zh_cn",
            "content": text,
            "duration_sec": cached_result["features"]["duration_sec"],
            "total_score": cached_result["total_score"],
        },
        "debug_features": cached_result["features"],
        "text_fingerprint": hashlib.sha1(text.encode("utf-8")).hexdigest() if text else None,
    }
