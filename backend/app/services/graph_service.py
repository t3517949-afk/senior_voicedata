from __future__ import annotations

from collections import Counter

import igraph as ig

from app.schemas import GraphBuildResponse, GraphEdge, GraphNode, GraphSummary
from app.services.fasttext_service import tokenize_text


def build_cooccurrence_graph(text: str, window_size: int = 2, directed: bool = False) -> GraphBuildResponse:
    tokens = tokenize_text(text)
    frequencies = Counter(tokens)
    edge_weights: Counter[tuple[str, str]] = Counter()

    for index, source in enumerate(tokens):
        upper_bound = min(len(tokens), index + window_size + 1)
        for next_index in range(index + 1, upper_bound):
            target = tokens[next_index]
            key = (source, target) if directed else tuple(sorted((source, target)))
            edge_weights[key] += 1

    unique_nodes = list(dict.fromkeys(tokens))
    graph = ig.Graph(directed=directed)
    graph.add_vertices(unique_nodes)

    if edge_weights:
        graph.add_edges(list(edge_weights.keys()))
        graph.es["weight"] = list(edge_weights.values())

    degree_values = graph.degree() if graph.vcount() else []
    nodes = [
        GraphNode(
            id=vertex["name"],
            label=vertex["name"],
            frequency=frequencies[vertex["name"]],
            degree=float(degree_values[index]) if degree_values else 0.0,
        )
        for index, vertex in enumerate(graph.vs)
    ]
    edges = [
        GraphEdge(
            source=graph.vs[edge.tuple[0]]["name"],
            target=graph.vs[edge.tuple[1]]["name"],
            weight=int(graph.es[index]["weight"]),
        )
        for index, edge in enumerate(graph.es)
    ]

    average_degree = (sum(degree_values) / len(degree_values)) if degree_values else 0.0
    summary = GraphSummary(
        node_count=graph.vcount(),
        edge_count=graph.ecount(),
        density=float(graph.density()) if graph.vcount() > 1 else 0.0,
        average_degree=float(average_degree),
        is_directed=directed,
    )

    return GraphBuildResponse(
        tokens=tokens,
        nodes=nodes,
        edges=edges,
        summary=summary,
        metadata={
            "window_size": window_size,
            "backend": "python-igraph",
        },
    )
