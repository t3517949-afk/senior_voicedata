from __future__ import annotations

from functools import lru_cache
import math
import re
from typing import Iterable, List, Tuple

import fasttext

from app.config import FASTTEXT_MODEL_PATH


TOKEN_PATTERN = re.compile(r"[\u4e00-\u9fffA-Za-z0-9_]+")


def tokenize_text(text: str) -> List[str]:
    return TOKEN_PATTERN.findall(text)


def _normalize_vector(values: Iterable[float]) -> List[float]:
    vector = [float(value) for value in values]
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


@lru_cache(maxsize=1)
def load_fasttext_model():
    if not FASTTEXT_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"fastText model file not found at {FASTTEXT_MODEL_PATH}. "
            "Set FASTTEXT_MODEL_PATH to a valid .bin model before using vector endpoints."
        )
    return fasttext.load_model(str(FASTTEXT_MODEL_PATH))


def sentence_vector(text: str, normalize: bool = True) -> List[float]:
    model = load_fasttext_model()
    vector = model.get_sentence_vector(text)
    values = [float(value) for value in vector.tolist()]
    return _normalize_vector(values) if normalize else values


def token_vectors(text: str, normalize: bool = True) -> List[Tuple[str, List[float]]]:
    model = load_fasttext_model()
    tokens = tokenize_text(text)
    result: List[Tuple[str, List[float]]] = []
    for token in tokens:
        vector = [float(value) for value in model.get_word_vector(token).tolist()]
        result.append((token, _normalize_vector(vector) if normalize else vector))
    return result
