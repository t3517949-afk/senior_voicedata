from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional
import subprocess

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.config import (
    FASTTEXT_MODEL_PATH,
    FASTTEXT_SOURCE_PATH,
    FZSPEAK_SOURCE_PATH,
    HANLP_HOME,
    HANLP_SOURCE_PATH,
    IGRAPH_SOURCE_PATH,
    XFYUN_APP_ID,
    XFYUN_API_KEY,
    XFYUN_API_SECRET,
)
from app.schemas import (
    GraphBuildRequest,
    GraphBuildResponse,
    HanlpProcessRequest,
    HanlpProcessResponse,
    IntegrationStatus,
    MachineScoreRequest,
    MachineScoreResponse,
    ResearchResourceItem,
    ResearchResourceLinkCreateRequest,
    SemanticNetworkRequest,
    SemanticNetworkResponse,
    TokenVector,
    VectorizeRequest,
    VectorizeResponse,
)
from app.services.fasttext_service import (
    load_fasttext_model,
    sentence_vector,
    token_vectors,
    tokenize_text,
)
from app.services.hanlp_service import tokenize_text as hanlp_tokenize_text
from app.services.graph_service import build_cooccurrence_graph
from app.services.research_resource_service import (
    create_link_resource,
    create_uploaded_file_resource,
    find_file_item,
    import_local_file_resource,
    list_resources,
    resolve_file_path,
)
from app.services.semantic_network_service import build_semantic_network
from app.services.semantic_corpus_service import load_semantic_corpus
from app.services.xfyun_ise_service import score_audio_by_code_with_xfyun


app = FastAPI(
    title="LingXi Backend",
    description="HanLP preprocessing, fastText vectorization and igraph graph modeling backend for the website project.",
    version="0.1.0",
)


@app.get("/health")
def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/integrations/status", response_model=IntegrationStatus)
def integration_status() -> IntegrationStatus:
    model_present = FASTTEXT_MODEL_PATH.exists()
    xfyun_configured = bool(XFYUN_APP_ID and XFYUN_API_KEY and XFYUN_API_SECRET)
    runtime_ready = (
        FASTTEXT_SOURCE_PATH.exists()
        and IGRAPH_SOURCE_PATH.exists()
        and HANLP_SOURCE_PATH.exists()
        and FZSPEAK_SOURCE_PATH.exists()
        and xfyun_configured
        and model_present
    )
    return IntegrationStatus(
        fasttext_source_linked=FASTTEXT_SOURCE_PATH.exists(),
        fasttext_model_present=model_present,
        fasttext_model_path=str(FASTTEXT_MODEL_PATH),
        igraph_source_linked=IGRAPH_SOURCE_PATH.exists(),
        hanlp_source_linked=HANLP_SOURCE_PATH.exists(),
        fzspeak_source_linked=FZSPEAK_SOURCE_PATH.exists(),
        xfyun_ise_configured=xfyun_configured,
        hanlp_home=str(HANLP_HOME),
        runtime_ready=runtime_ready,
    )


@app.post("/api/nlp/hanlp", response_model=HanlpProcessResponse)
def process_text_with_hanlp(request: HanlpProcessRequest) -> HanlpProcessResponse:
    try:
        sentences, tokens, flat_tokens = hanlp_tokenize_text(
            request.text,
            split_into_sentences=request.split_sentences,
        )
        return HanlpProcessResponse(
            text=request.text,
            sentences=sentences,
            tokens=tokens,
            flat_tokens=flat_tokens,
            token_count=len(flat_tokens),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"HanLP processing failed: {exc}") from exc


@app.post("/api/vectorize", response_model=VectorizeResponse)
def vectorize_text(request: VectorizeRequest) -> VectorizeResponse:
    try:
        sentence = sentence_vector(request.text, normalize=request.normalize)
        token_level_vectors = token_vectors(request.text, normalize=request.normalize) if request.include_tokens else []
        return VectorizeResponse(
            text=request.text,
            dimension=len(sentence),
            sentence_vector=sentence,
            tokens=tokenize_text(request.text),
            token_vectors=[
                TokenVector(token=token, dimension=len(vector), vector=vector)
                for token, vector in token_level_vectors
            ],
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Vectorization failed: {exc}") from exc


@app.post("/api/graph/cooccurrence", response_model=GraphBuildResponse)
def build_graph(request: GraphBuildRequest) -> GraphBuildResponse:
    try:
        return build_cooccurrence_graph(
            text=request.text,
            window_size=request.window_size,
            directed=request.directed,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Graph build failed: {exc}") from exc


@app.post("/api/semantic-network", response_model=SemanticNetworkResponse)
def semantic_network(request: SemanticNetworkRequest) -> SemanticNetworkResponse:
    try:
        return build_semantic_network(
            text=request.text,
            min_frequency=request.min_frequency,
            similarity_threshold=request.similarity_threshold,
            max_nodes=request.max_nodes,
            split_sentences=request.split_sentences,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Semantic network build failed: {exc}") from exc


@app.get("/api/semantic-network/corpus")
def semantic_network_corpus() -> Dict[str, Any]:
    return load_semantic_corpus()


@app.post("/api/audio/machine-score", response_model=MachineScoreResponse)
async def audio_machine_score(request: MachineScoreRequest) -> MachineScoreResponse:
    try:
        result = await score_audio_by_code_with_xfyun(
            code=request.code,
            reference_text=request.reference_text,
        )
        return MachineScoreResponse(**result)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except subprocess.CalledProcessError as exc:
        raise HTTPException(status_code=500, detail=f"Audio decode failed: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Machine score failed: {exc}") from exc


@app.get("/api/research-resources", response_model=List[ResearchResourceItem])
def get_research_resources() -> List[ResearchResourceItem]:
    return [ResearchResourceItem(**item) for item in list_resources()]


@app.post("/api/research-resources/link", response_model=ResearchResourceItem)
def create_research_link(request: ResearchResourceLinkCreateRequest) -> ResearchResourceItem:
    try:
        item = create_link_resource(
            title=request.title,
            url=request.url,
            description=request.description,
        )
        return ResearchResourceItem(**item)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/research-resources/upload", response_model=ResearchResourceItem)
async def upload_research_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
) -> ResearchResourceItem:
    try:
        file_bytes = await file.read()
        item = create_uploaded_file_resource(
            filename=file.filename or "resource",
            file_bytes=file_bytes,
            title=title,
            description=description,
        )
        return ResearchResourceItem(**item)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/research-resources/import-local", response_model=ResearchResourceItem)
def import_research_file_from_local_path(
    local_path: str = Form(...),
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
) -> ResearchResourceItem:
    try:
        item = import_local_file_resource(
            local_path=Path(local_path),
            title=title,
            description=description,
        )
        return ResearchResourceItem(**item)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/research-resources/file/{storage_name}")
def download_research_file(storage_name: str) -> FileResponse:
    try:
        file_path = resolve_file_path(storage_name)
        file_item = find_file_item(storage_name)
        return FileResponse(
            path=file_path,
            filename=str(file_item.get("file_name")) if file_item else file_path.name,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
