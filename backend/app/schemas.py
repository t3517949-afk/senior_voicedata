from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class IntegrationStatus(BaseModel):
    fasttext_source_linked: bool
    fasttext_model_present: bool
    fasttext_model_path: str
    igraph_source_linked: bool
    hanlp_source_linked: bool
    fzspeak_source_linked: bool
    xfyun_ise_configured: bool
    hanlp_home: str
    runtime_ready: bool


class HanlpProcessRequest(BaseModel):
    text: str = Field(..., min_length=1)
    split_sentences: bool = True


class HanlpProcessResponse(BaseModel):
    text: str
    sentences: List[str]
    tokens: List[List[str]]
    flat_tokens: List[str]
    token_count: int


class VectorizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    include_tokens: bool = False
    normalize: bool = True


class TokenVector(BaseModel):
    token: str
    dimension: int
    vector: List[float]


class VectorizeResponse(BaseModel):
    text: str
    dimension: int
    sentence_vector: List[float]
    tokens: List[str]
    token_vectors: List[TokenVector] = Field(default_factory=list)


class GraphBuildRequest(BaseModel):
    text: str = Field(..., min_length=1)
    window_size: int = Field(default=2, ge=1, le=20)
    directed: bool = False


class GraphNode(BaseModel):
    id: str
    label: str
    frequency: int
    degree: Optional[float] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    weight: int


class GraphSummary(BaseModel):
    node_count: int
    edge_count: int
    density: Optional[float] = None
    average_degree: Optional[float] = None
    is_directed: bool


class GraphBuildResponse(BaseModel):
    tokens: List[str]
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    summary: GraphSummary
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SemanticNetworkRequest(BaseModel):
    text: str = Field(..., min_length=1)
    min_frequency: int = Field(default=1, ge=1, le=10)
    similarity_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    max_nodes: int = Field(default=40, ge=5, le=200)
    split_sentences: bool = True


class SemanticNetworkNode(BaseModel):
    id: str
    label: str
    pos: str
    frequency: int
    degree: float
    weighted_degree: float
    betweenness: float
    closeness: float
    eigenvector: float
    x: float
    y: float


class SemanticNetworkEdge(BaseModel):
    source: str
    target: str
    weight: float


class SemanticNetworkMetrics(BaseModel):
    network_scale: int
    network_density: float
    network_diameter: float
    average_shortest_path_length: float
    global_clustering_coefficient: float
    small_world_index: float
    modularity: float
    edge_count: int


class SemanticNetworkKeyword(BaseModel):
    token: str
    pos: str
    frequency: int
    weighted_degree: float
    betweenness: float


class SemanticNetworkResponse(BaseModel):
    original_text: str
    normalized_text: str
    sentences: List[str]
    raw_tokens: List[str]
    cleaned_tokens: List[str]
    removed_tokens: List[str]
    missing_vectors: List[str]
    nodes: List[SemanticNetworkNode]
    edges: List[SemanticNetworkEdge]
    metrics: SemanticNetworkMetrics
    keywords: List[SemanticNetworkKeyword]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MachineScoreRequest(BaseModel):
    code: str = Field(..., min_length=1)
    reference_text: Optional[str] = None


class MachineScoreIndicators(BaseModel):
    category: str
    language: str
    content: str
    duration_sec: float
    total_score: float
    official_scores: Dict[str, float] = Field(default_factory=dict)


class MachineScoreResponse(BaseModel):
    code: str
    audio_path: str
    source: str
    total_score: float
    indicators: MachineScoreIndicators
    sid: Optional[str] = None
    text_fingerprint: Optional[str] = None


class ResearchResourceItem(BaseModel):
    id: str
    type: Literal["file", "link"]
    title: str
    url: str
    description: Optional[str] = None
    file_name: Optional[str] = None
    file_ext: Optional[str] = None
    size_bytes: Optional[int] = None
    created_at: str


class ResearchResourceLinkCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    url: str = Field(..., min_length=1, max_length=2000)
    description: Optional[str] = Field(default=None, max_length=1000)
