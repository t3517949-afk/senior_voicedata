from __future__ import annotations

from datetime import datetime, timezone
import json
import re
import shutil
import threading
from pathlib import Path
from typing import Dict, List
from urllib.parse import urlparse
from uuid import uuid4


CACHE_DIR = Path(__file__).resolve().parents[2] / "cache"
CACHE_PATH = CACHE_DIR / "research_resources.json"
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "research_resources"
ALLOWED_FILE_EXTS = {".pdf", ".doc", ".docx"}
_LOCK = threading.Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_items() -> List[Dict[str, object]]:
    if not CACHE_PATH.exists():
        return []
    try:
        data = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
        return []
    except Exception:
        return []


def _write_items(items: List[Dict[str, object]]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


def _sanitize_filename(filename: str) -> str:
    name = filename.strip() or "resource"
    name = name.replace("\\", "/").split("/")[-1]
    stem = Path(name).stem
    ext = Path(name).suffix.lower()
    safe_stem = re.sub(r"[^\w\-.一-龥]", "_", stem).strip("._")
    safe_stem = safe_stem or "resource"
    return f"{safe_stem}{ext}"


def _validate_ext(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_FILE_EXTS:
        allowed = ", ".join(sorted(ALLOWED_FILE_EXTS))
        raise ValueError(f"Unsupported file type: {ext or '(none)'}; allowed: {allowed}")
    return ext


def _build_storage_name(filename: str) -> str:
    safe_name = _sanitize_filename(filename)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"{timestamp}_{uuid4().hex[:8]}_{safe_name}"


def _normalize_items(items: List[Dict[str, object]]) -> List[Dict[str, object]]:
    return sorted(
        items,
        key=lambda item: str(item.get("created_at", "")),
        reverse=True,
    )


def list_resources() -> List[Dict[str, object]]:
    with _LOCK:
        return _normalize_items(_read_items())


def create_link_resource(title: str, url: str, description: str | None = None) -> Dict[str, object]:
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Invalid URL. Please provide a full http(s) link.")

    item: Dict[str, object] = {
        "id": uuid4().hex,
        "type": "link",
        "title": title.strip(),
        "url": url.strip(),
        "description": (description or "").strip() or None,
        "created_at": _now_iso(),
    }
    with _LOCK:
        items = _read_items()
        items.append(item)
        _write_items(_normalize_items(items))
    return item


def create_uploaded_file_resource(
    *,
    filename: str,
    file_bytes: bytes,
    title: str | None = None,
    description: str | None = None,
) -> Dict[str, object]:
    if not file_bytes:
        raise ValueError("Uploaded file is empty.")
    ext = _validate_ext(filename)
    storage_name = _build_storage_name(filename)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    destination = (UPLOAD_DIR / storage_name).resolve()
    destination.write_bytes(file_bytes)

    item: Dict[str, object] = {
        "id": uuid4().hex,
        "type": "file",
        "title": (title or Path(filename).stem).strip() or Path(filename).stem,
        "url": f"/api/research-resources/file/{storage_name}",
        "description": (description or "").strip() or None,
        "file_name": Path(filename).name,
        "file_ext": ext,
        "size_bytes": len(file_bytes),
        "storage_name": storage_name,
        "created_at": _now_iso(),
    }
    with _LOCK:
        items = _read_items()
        items.append(item)
        _write_items(_normalize_items(items))
    return item


def import_local_file_resource(
    *,
    local_path: Path,
    title: str | None = None,
    description: str | None = None,
) -> Dict[str, object]:
    candidate = local_path.expanduser().resolve()
    if not candidate.exists() or not candidate.is_file():
        raise FileNotFoundError(f"Local file not found: {candidate}")
    ext = _validate_ext(candidate.name)
    storage_name = _build_storage_name(candidate.name)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    destination = (UPLOAD_DIR / storage_name).resolve()
    shutil.copy2(candidate, destination)
    size_bytes = destination.stat().st_size

    item: Dict[str, object] = {
        "id": uuid4().hex,
        "type": "file",
        "title": (title or candidate.stem).strip() or candidate.stem,
        "url": f"/api/research-resources/file/{storage_name}",
        "description": (description or "").strip() or None,
        "file_name": candidate.name,
        "file_ext": ext,
        "size_bytes": size_bytes,
        "storage_name": storage_name,
        "created_at": _now_iso(),
    }
    with _LOCK:
        items = _read_items()
        # De-duplicate same source file title + name by replacing previous newest entry.
        items = [
            old
            for old in items
            if not (
                old.get("type") == "file"
                and old.get("file_name") == candidate.name
                and old.get("title") == item["title"]
            )
        ]
        items.append(item)
        _write_items(_normalize_items(items))
    return item


def find_file_item(storage_name: str) -> Dict[str, object] | None:
    with _LOCK:
        for item in _read_items():
            if item.get("type") == "file" and item.get("storage_name") == storage_name:
                return item
    return None


def resolve_file_path(storage_name: str) -> Path:
    candidate = (UPLOAD_DIR / storage_name).resolve()
    if not str(candidate).startswith(str(UPLOAD_DIR.resolve())):
        raise FileNotFoundError("Resource path is invalid.")
    if not candidate.exists():
        raise FileNotFoundError("Resource file does not exist.")
    return candidate
