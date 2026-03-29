from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import ssl
import subprocess
import threading
import xml.etree.ElementTree as ET
from email.utils import formatdate
from pathlib import Path
from typing import Dict, Tuple
from urllib.parse import quote

import websockets
import certifi

from app.config import (
    AUDIO_CORPUS_DIR,
    XFYUN_API_KEY,
    XFYUN_API_SECRET,
    XFYUN_APP_ID,
    XFYUN_ISE_HOST,
    XFYUN_ISE_PATH,
)

CACHE_DIR = Path(__file__).resolve().parents[2] / "cache"
CACHE_PATH = CACHE_DIR / "xfyun_ise_scores.json"
_CACHE_LOCK = threading.Lock()


def _resolve_audio_path(code: str) -> Path:
    if not code:
        raise FileNotFoundError("Audio code is empty.")
    candidate = (AUDIO_CORPUS_DIR / code).resolve()
    if not str(candidate).startswith(str(AUDIO_CORPUS_DIR)):
        raise FileNotFoundError("Audio path is outside the configured corpus directory.")
    if not candidate.exists():
        raise FileNotFoundError(f"Audio file not found: {candidate}")
    return candidate


def _decode_to_pcm(audio_path: Path) -> Tuple[bytes, float]:
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
    pcm_bytes = result.stdout
    if not pcm_bytes:
        raise RuntimeError("Failed to decode audio with ffmpeg.")
    duration_sec = len(pcm_bytes) / (16000 * 2)
    return pcm_bytes, duration_sec


def _build_ws_url() -> str:
    if not XFYUN_APP_ID or not XFYUN_API_KEY or not XFYUN_API_SECRET:
        raise RuntimeError("Missing XFYUN credentials. Please set XFYUN_APPID, XFYUN_API_KEY, XFYUN_API_SECRET.")

    date = formatdate(timeval=None, localtime=False, usegmt=True)
    signature_origin = f"host: {XFYUN_ISE_HOST}\ndate: {date}\nGET {XFYUN_ISE_PATH} HTTP/1.1"
    digest = hmac.new(
        XFYUN_API_SECRET.encode("utf-8"),
        signature_origin.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    signature = base64.b64encode(digest).decode("utf-8")

    authorization_origin = (
        f'api_key="{XFYUN_API_KEY}", algorithm="hmac-sha256", '
        f'headers="host date request-line", signature="{signature}"'
    )
    authorization = base64.b64encode(authorization_origin.encode("utf-8")).decode("utf-8")

    return (
        f"wss://{XFYUN_ISE_HOST}{XFYUN_ISE_PATH}"
        f"?authorization={quote(authorization)}&date={quote(date)}&host={quote(XFYUN_ISE_HOST)}"
    )


def _parse_ise_xml(xml_text: str, fallback_text: str, duration_sec: float, category_hint: str) -> Dict[str, object]:
    xml_text = (xml_text or "").strip()
    if not xml_text:
        raise RuntimeError("XFYUN response did not contain XML result.")

    root = ET.fromstring(xml_text)
    category = category_hint
    language = "zh_cn"
    content = fallback_text
    total_score = 0.0
    official_scores: Dict[str, float] = {}

    if root.tag == "FinalResult":
        for child in root:
            if child.tag == "total_score":
                total_score = float(child.attrib.get("value", "0") or "0")
        official_scores["total_score"] = round(total_score, 2)
    else:
        candidate = None
        for tag_name in ("read_chapter", "read_sentence", "read_word", "read_syllable"):
            elem = root.find(f".//{tag_name}")
            if elem is not None and "total_score" in elem.attrib:
                candidate = elem
                category = tag_name
                break

        if candidate is None:
            for elem in root.iter():
                if "total_score" in elem.attrib:
                    candidate = elem
                    break

        if candidate is None:
            raise RuntimeError("Failed to parse official ISE score fields from XML.")

        attrs = candidate.attrib
        total_score = float(attrs.get("total_score", "0") or "0")
        content = attrs.get("content", fallback_text)
        lan = attrs.get("lan")
        if lan:
            language = "zh_cn" if lan.startswith("cn") else lan

        for key, value in attrs.items():
            if not key.endswith("_score"):
                continue
            try:
                official_scores[key] = round(float(value), 2)
            except ValueError:
                continue

        if "total_score" not in official_scores:
            official_scores["total_score"] = round(total_score, 2)

    return {
        "category": category,
        "language": language,
        "content": content,
        "duration_sec": round(duration_sec, 2),
        "total_score": round(total_score, 2),
        "official_scores": official_scores,
    }


def _normalize_reference_text(text: str) -> str:
    normalized = " ".join(text.replace("\r", " ").replace("\n", " ").split()).strip()
    # Keep as much transcript as possible to match the full recording content.
    return normalized[:1800]


def _select_category(reference_text: str) -> str:
    # Long transcripts should be evaluated as chapter-level content.
    return "read_chapter" if len(reference_text) > 140 else "read_sentence"


def _read_cache_map() -> Dict[str, object]:
    if not CACHE_PATH.exists():
        return {}
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _write_cache_map(cache_map: Dict[str, object]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache_map, ensure_ascii=False), encoding="utf-8")


def _build_cache_key(code: str, audio_path: Path, category: str, text_fingerprint: str) -> str:
    return f"{code}|{audio_path.stat().st_mtime_ns}|{category}|{text_fingerprint}"


async def score_audio_by_code_with_xfyun(
    code: str,
    reference_text: str | None = None,
    category: str | None = None,
) -> Dict[str, object]:
    audio_path = _resolve_audio_path(code)
    text = _normalize_reference_text((reference_text or "").strip())
    if not text:
        raise RuntimeError("XFYUN ISE requires reference_text for official evaluation.")
    text_fingerprint = hashlib.sha1(text.encode("utf-8")).hexdigest()
    category_to_use = category or _select_category(text)
    cache_key = _build_cache_key(code, audio_path, category_to_use, text_fingerprint)

    with _CACHE_LOCK:
        cache_map = _read_cache_map()
        cached = cache_map.get(cache_key)
        if isinstance(cached, dict):
            return cached

    pcm_audio, duration_sec = _decode_to_pcm(audio_path)
    ws_url = _build_ws_url()
    sid = None
    result_xml = ""

    first_frame = {
        "common": {"app_id": XFYUN_APP_ID},
        "business": {
            "sub": "ise",
            "ent": "cn_vip",
            "category": category_to_use,
            "cmd": "ssb",
            "tte": "utf-8",
            "text": "\ufeff" + text,
            "aue": "raw",
            "auf": "audio/L16;rate=16000",
            "rstcd": "utf8",
            "group": "adult",
            "extra_ability": "multi_dimension",
            "ise_unite": "1",
        },
        "data": {"status": 0},
    }

    frame_size = 8000
    chunks = [pcm_audio[i:i + frame_size] for i in range(0, len(pcm_audio), frame_size)]

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    async with websockets.connect(
        ws_url,
        ssl=ssl_context,
        ping_interval=None,
        max_size=8 * 1024 * 1024,
    ) as ws:
        await ws.send(json.dumps(first_frame, ensure_ascii=False))

        for idx, chunk in enumerate(chunks):
            is_last = idx == len(chunks) - 1
            aus = 4 if is_last else (1 if idx == 0 else 2)
            frame = {
                "business": {
                    "cmd": "auw",
                    "aus": aus,
                    "aue": "raw",
                },
                "data": {
                    "status": 2 if is_last else 1,
                    "data": base64.b64encode(chunk).decode("utf-8"),
                },
            }
            await ws.send(json.dumps(frame, ensure_ascii=False))

        while True:
            message = await asyncio.wait_for(ws.recv(), timeout=30)
            payload = json.loads(message)
            sid = payload.get("sid", sid)

            code_value = int(payload.get("code", 0))
            if code_value != 0:
                raise RuntimeError(f"XFYUN ISE error {code_value}: {payload.get('message', 'unknown error')}")

            data = payload.get("data") or {}
            result_base64 = data.get("data", "")
            status = int(data.get("status", -1))

            if result_base64:
                try:
                    result_xml = base64.b64decode(result_base64).decode("utf-8", errors="ignore")
                except Exception:
                    pass

            if status == 2:
                break

    indicators = _parse_ise_xml(
        result_xml,
        fallback_text=text,
        duration_sec=duration_sec,
        category_hint=category_to_use,
    )

    result = {
        "code": code,
        "audio_path": str(audio_path),
        "source": "XFYUN ISE official API (WebSocket)",
        "total_score": indicators["total_score"],
        "indicators": indicators,
        "sid": sid,
        "text_fingerprint": text_fingerprint,
    }
    with _CACHE_LOCK:
        cache_map = _read_cache_map()
        cache_map[cache_key] = result
        _write_cache_map(cache_map)
    return result
