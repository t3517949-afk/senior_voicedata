from __future__ import annotations

from functools import lru_cache
import os
from typing import List, Tuple

from app.config import HANLP_HOME


HANLP_HOME.mkdir(parents=True, exist_ok=True)
os.environ["HANLP_HOME"] = str(HANLP_HOME)

import hanlp


@lru_cache(maxsize=1)
def load_tokenizer():
    return hanlp.load(hanlp.pretrained.tok.FINE_ELECTRA_SMALL_ZH)


@lru_cache(maxsize=1)
def load_pos_tagger():
    return hanlp.load(hanlp.pretrained.pos.CTB9_POS_ELECTRA_SMALL)


def split_sentences(text: str) -> List[str]:
    try:
        from hanlp.utils.rules import split_sentence

        return [sentence.strip() for sentence in split_sentence(text) if sentence.strip()]
    except Exception:
        return [text]


def tokenize_text(text: str, split_into_sentences: bool = True) -> tuple[List[str], List[List[str]], List[str]]:
    tokenizer = load_tokenizer()
    sentences = split_sentences(text) if split_into_sentences else [text]
    sentences = [sentence for sentence in sentences if sentence.strip()]

    tokenized = [list(tokenizer(sentence)) for sentence in sentences]
    flat_tokens = [token for sentence in tokenized for token in sentence]
    return sentences, tokenized, flat_tokens


def analyze_text(text: str, split_into_sentences: bool = True) -> Tuple[List[str], List[List[str]], List[List[str]]]:
    tokenizer = load_tokenizer()
    pos_tagger = load_pos_tagger()
    sentences = split_sentences(text) if split_into_sentences else [text]
    sentences = [sentence for sentence in sentences if sentence.strip()]
    tokenized = [list(tokenizer(sentence)) for sentence in sentences]
    pos_tags = [list(pos_tagger(tokens)) for tokens in tokenized]
    return sentences, tokenized, pos_tags
