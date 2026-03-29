from __future__ import annotations

from collections import Counter, defaultdict
import json
import math
from pathlib import Path
import re
import statistics
from typing import Dict, List, Optional, Set, Tuple

import igraph as ig

from app.config import STOPWORDS_PATH, SYNONYMS_PATH
from app.schemas import (
    SemanticNetworkEdge,
    SemanticNetworkKeyword,
    SemanticNetworkMetrics,
    SemanticNetworkNode,
    SemanticNetworkResponse,
)
from app.services.fasttext_service import load_fasttext_model
from app.services.hanlp_service import analyze_text


LOWERCASE_CONTENT_POS = {
    "n",
    "nr",
    "ns",
    "nt",
    "nz",
    "vn",
    "v",
    "vd",
    "vi",
    "vl",
    "vg",
    "a",
    "an",
    "ag",
}
CONTENT_POS_TAGS = {
    "NN",
    "NR",
    "NT",
    "VV",
    "VA",
    "VE",
    "VC",
    "JJ",
}
SPECIAL_TOKEN_PATTERN = re.compile(r"[^\w\u4e00-\u9fff]+", re.UNICODE)
DIGIT_PATTERN = re.compile(r"\d+(?:[.:：/-]\d+)*")
PUNCTUATION_PATTERN = re.compile(r"[，。！？；：、“”‘’（）()【】《》〈〉,.!?;:\"'、]+")
WHITESPACE_PATTERN = re.compile(r"\s+")


def _load_stopwords(path: Path) -> Set[str]:
    return {line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}


def _load_synonyms(path: Path) -> Dict[str, str]:
    return json.loads(path.read_text(encoding="utf-8"))


STOPWORDS = _load_stopwords(STOPWORDS_PATH)
SYNONYMS = _load_synonyms(SYNONYMS_PATH)


def normalize_text(text: str) -> str:
    normalized = text.strip()
    normalized = WHITESPACE_PATTERN.sub(" ", normalized)
    normalized = DIGIT_PATTERN.sub(" ", normalized)
    normalized = normalized.replace("\u3000", " ")
    normalized = re.sub(r"[“”]", "\"", normalized)
    normalized = re.sub(r"[‘’]", "'", normalized)
    normalized = re.sub(r"[—–-]{2,}", " ", normalized)
    normalized = SPECIAL_TOKEN_PATTERN.sub(lambda match: " " if not PUNCTUATION_PATTERN.fullmatch(match.group(0)) else match.group(0), normalized)
    normalized = WHITESPACE_PATTERN.sub(" ", normalized)
    return normalized.strip()


def is_content_pos(pos: str) -> bool:
    normalized = pos.strip()
    lowered = normalized.lower()
    return normalized in CONTENT_POS_TAGS or lowered in LOWERCASE_CONTENT_POS


def safe_float(value: float) -> float:
    numeric = float(value)
    if not math.isfinite(numeric):
        return 0.0
    return numeric


def canonicalize_token(token: str) -> str:
    lowered = token.strip()
    return SYNONYMS.get(lowered, lowered)


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _largest_component(graph: ig.Graph) -> ig.Graph:
    if graph.vcount() == 0:
        return graph
    if graph.is_connected():
        return graph
    clusters = graph.connected_components()
    return clusters.giant()


def _average_shortest_path_length(graph: ig.Graph) -> float:
    if graph.vcount() < 2 or graph.ecount() == 0:
        return 0.0
    giant = _largest_component(graph)
    if giant.vcount() < 2 or giant.ecount() == 0:
        return 0.0
    return safe_float(giant.average_path_length())


def _global_clustering(graph: ig.Graph) -> float:
    if graph.vcount() < 3 or graph.ecount() == 0:
        return 0.0
    return safe_float(graph.transitivity_undirected())


def _safe_mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return safe_float(statistics.fmean(values))


def _build_random_reference_graph(observed: ig.Graph) -> ig.Graph:
    """
    Build a random reference graph that better matches the observed topology.
    Priority: degree-preserving rewiring; fallback: G(n, m) random graph.
    """
    random_graph = observed.copy()
    rewire_trials = max(100, observed.ecount() * 10)
    try:
        random_graph.rewire(n=rewire_trials, mode="simple")
        return random_graph
    except Exception:
        return ig.Graph.Erdos_Renyi(
            n=observed.vcount(),
            m=observed.ecount(),
            directed=False,
            loops=False,
        )


def _build_lattice_reference_graph(observed: ig.Graph) -> Optional[ig.Graph]:
    if observed.vcount() < 4 or observed.ecount() < 3:
        return None

    n = observed.vcount()
    average_degree = max(2, int(round((2 * observed.ecount()) / n)))
    nei = max(1, average_degree // 2)
    try:
        return ig.Graph.Watts_Strogatz(
            dim=1,
            size=n,
            nei=nei,
            p=0.0,
            loops=False,
            multiple=False,
        )
    except Exception:
        return None


def _estimate_small_world_indicators(graph: ig.Graph, nrand: int = 24) -> Dict[str, float]:
    """
    Compute small-world indicators:
    gamma = C / Cr
    lambda = L / Lr
    sigma = gamma / lambda
    omega = (Lr / L) - (C / Cl)
    where:
      C,L  -> observed graph (largest component)
      Cr,Lr -> random reference (degree-preserving rewired)
      Cl -> lattice reference clustering
    """
    indicators = {
        "sigma": 0.0,
        "gamma": 0.0,
        "lambda": 0.0,
        "omega": 0.0,
        "observed_clustering": 0.0,
        "observed_path_length": 0.0,
        "reference_clustering": 0.0,
        "reference_path_length": 0.0,
        "lattice_clustering": 0.0,
        "lattice_path_length": 0.0,
    }

    if graph.vcount() < 4 or graph.ecount() < 3:
        return indicators

    observed = _largest_component(graph)
    if observed.vcount() < 4 or observed.ecount() < 3:
        return indicators

    c_obs = _global_clustering(observed)
    l_obs = _average_shortest_path_length(observed)
    indicators["observed_clustering"] = c_obs
    indicators["observed_path_length"] = l_obs
    if c_obs <= 0 or l_obs <= 0:
        return indicators

    random_clusterings: List[float] = []
    random_path_lengths: List[float] = []
    for _ in range(nrand):
        random_graph = _build_random_reference_graph(observed)
        random_graph = _largest_component(random_graph)
        c_rand = _global_clustering(random_graph)
        l_rand = _average_shortest_path_length(random_graph)
        if c_rand > 0 and l_rand > 0:
            random_clusterings.append(c_rand)
            random_path_lengths.append(l_rand)

    if not random_clusterings or not random_path_lengths:
        return indicators

    c_ref = _safe_mean(random_clusterings)
    l_ref = _safe_mean(random_path_lengths)
    indicators["reference_clustering"] = c_ref
    indicators["reference_path_length"] = l_ref
    if c_ref <= 0 or l_ref <= 0:
        return indicators

    gamma = c_obs / c_ref
    lambda_ratio = l_obs / l_ref
    sigma = (gamma / lambda_ratio) if lambda_ratio > 0 else 0.0
    indicators["gamma"] = safe_float(gamma)
    indicators["lambda"] = safe_float(lambda_ratio)
    indicators["sigma"] = safe_float(sigma)

    lattice_graph = _build_lattice_reference_graph(observed)
    if lattice_graph is not None:
        lattice_graph = _largest_component(lattice_graph)
        c_lattice = _global_clustering(lattice_graph)
        l_lattice = _average_shortest_path_length(lattice_graph)
        indicators["lattice_clustering"] = c_lattice
        indicators["lattice_path_length"] = l_lattice
        if c_lattice > 0:
            omega = (l_ref / l_obs) - (c_obs / c_lattice)
            indicators["omega"] = safe_float(omega)

    return indicators


def build_semantic_network(
    text: str,
    min_frequency: int = 1,
    similarity_threshold: float = 0.5,
    max_nodes: int = 40,
    split_sentences: bool = True,
) -> SemanticNetworkResponse:
    normalized_text = normalize_text(text)
    sentences, sentence_tokens, sentence_pos = analyze_text(normalized_text, split_into_sentences=split_sentences)
    raw_tokens = [token for sentence in sentence_tokens for token in sentence]

    token_pos_map: Dict[str, Counter] = defaultdict(Counter)
    cleaned_tokens: List[str] = []
    removed_tokens: List[str] = []

    for tokens, pos_tags in zip(sentence_tokens, sentence_pos):
        for token, pos in zip(tokens, pos_tags):
            canonical = canonicalize_token(token)
            if not canonical or canonical in STOPWORDS or len(canonical) < 2:
                removed_tokens.append(token)
                continue
            if canonical.isdigit():
                removed_tokens.append(token)
                continue
            if PUNCTUATION_PATTERN.fullmatch(canonical):
                removed_tokens.append(token)
                continue
            if not is_content_pos(pos):
                removed_tokens.append(token)
                continue
            cleaned_tokens.append(canonical)
            token_pos_map[canonical][pos] += 1

    frequency = Counter(cleaned_tokens)
    candidate_tokens = [
        token
        for token, freq in frequency.most_common()
        if freq >= min_frequency
    ][:max_nodes]

    model = load_fasttext_model()
    vectors: Dict[str, List[float]] = {}
    missing_vectors: List[str] = []

    for token in candidate_tokens:
        try:
            vector = [float(value) for value in model.get_word_vector(token).tolist()]
            if any(abs(value) > 0 for value in vector):
                vectors[token] = vector
            else:
                missing_vectors.append(token)
        except Exception:
            missing_vectors.append(token)

    usable_tokens = [token for token in candidate_tokens if token in vectors]
    graph = ig.Graph()
    graph.add_vertices(usable_tokens)

    edge_list: List[Tuple[str, str]] = []
    weights: List[float] = []
    for index, source in enumerate(usable_tokens):
        for target in usable_tokens[index + 1:]:
            score = cosine_similarity(vectors[source], vectors[target])
            if score > similarity_threshold:
                edge_list.append((source, target))
                weights.append(float(score))

    if edge_list:
        graph.add_edges(edge_list)
        graph.es["weight"] = weights

    if graph.vcount() > 0:
        layout = graph.layout_fruchterman_reingold(weights=weights if weights else None, niter=500)
        weighted_degree = graph.strength(weights=weights if weights else None)
        betweenness = graph.betweenness(weights=None)
        closeness = graph.closeness()
        eigenvector = graph.eigenvector_centrality(weights=weights if weights else None)
        degrees = graph.degree()
        communities = graph.community_multilevel(weights=weights if weights else None) if graph.ecount() else None
    else:
        layout = []
        weighted_degree = []
        betweenness = []
        closeness = []
        eigenvector = []
        degrees = []
        communities = None

    nodes: List[SemanticNetworkNode] = []
    for index, token in enumerate(usable_tokens):
        pos_counter = token_pos_map[token]
        dominant_pos = pos_counter.most_common(1)[0][0] if pos_counter else "x"
        x, y = layout[index] if layout else (0.0, 0.0)
        nodes.append(
            SemanticNetworkNode(
                id=token,
                label=token,
                pos=dominant_pos,
                frequency=frequency[token],
                degree=safe_float(degrees[index]) if degrees else 0.0,
                weighted_degree=safe_float(weighted_degree[index]) if weighted_degree else 0.0,
                betweenness=safe_float(betweenness[index]) if betweenness else 0.0,
                closeness=safe_float(closeness[index]) if closeness else 0.0,
                eigenvector=safe_float(eigenvector[index]) if eigenvector else 0.0,
                x=safe_float(x),
                y=safe_float(y),
            )
        )

    edges = [
        SemanticNetworkEdge(
            source=graph.vs[source]["name"],
            target=graph.vs[target]["name"],
            weight=float(graph.es[index]["weight"]),
        )
        for index, (source, target) in enumerate(graph.get_edgelist())
    ]

    giant = _largest_component(graph) if graph.vcount() else graph
    density = safe_float(graph.density()) if graph.vcount() > 1 else 0.0
    diameter = safe_float(giant.diameter()) if giant.vcount() > 1 and giant.ecount() > 0 else 0.0
    avg_path = _average_shortest_path_length(graph)
    clustering = _global_clustering(graph)
    small_world_indicators = _estimate_small_world_indicators(graph, nrand=24)
    small_world = small_world_indicators["sigma"]
    modularity = safe_float(communities.modularity) if communities and graph.ecount() > 0 else 0.0

    keyword_nodes = sorted(
        nodes,
        key=lambda item: (item.weighted_degree, item.betweenness, item.frequency),
        reverse=True,
    )[:12]
    keywords = [
        SemanticNetworkKeyword(
            token=node.label,
            pos=node.pos,
            frequency=node.frequency,
            weighted_degree=node.weighted_degree,
            betweenness=node.betweenness,
        )
        for node in keyword_nodes
    ]

    metrics = SemanticNetworkMetrics(
        network_scale=graph.vcount(),
        network_density=density,
        network_diameter=diameter,
        average_shortest_path_length=avg_path,
        global_clustering_coefficient=clustering,
        small_world_index=small_world,
        modularity=modularity,
        edge_count=graph.ecount(),
    )

    return SemanticNetworkResponse(
        original_text=text,
        normalized_text=normalized_text,
        sentences=sentences,
        raw_tokens=raw_tokens,
        cleaned_tokens=cleaned_tokens,
        removed_tokens=sorted(set(removed_tokens)),
        missing_vectors=sorted(set(missing_vectors)),
        nodes=nodes,
        edges=edges,
        metrics=metrics,
        keywords=keywords,
        metadata={
            "min_frequency": min_frequency,
            "similarity_threshold": similarity_threshold,
            "max_nodes": max_nodes,
            "pos_filter": sorted(CONTENT_POS_TAGS | LOWERCASE_CONTENT_POS),
            "backend": "hanlp-fasttext-igraph",
            "small_world_method": "sigma_degree_preserving_rewire",
            "small_world_rule": "sigma > 1 and gamma > 1 indicates small-world tendency",
            "small_world_indicators": {
                "sigma": small_world_indicators["sigma"],
                "gamma": small_world_indicators["gamma"],
                "lambda": small_world_indicators["lambda"],
                "omega": small_world_indicators["omega"],
            },
        },
    )
