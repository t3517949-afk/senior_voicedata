from pathlib import Path
import os


BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent
VENDOR_ROOT = PROJECT_ROOT / "vendor"
RESOURCES_ROOT = BACKEND_ROOT / "app" / "resources"

FASTTEXT_SOURCE_PATH = VENDOR_ROOT / "fasttext-source"
IGRAPH_SOURCE_PATH = VENDOR_ROOT / "igraph-source"
HANLP_SOURCE_PATH = VENDOR_ROOT / "hanlp-source"
FZSPEAK_SOURCE_PATH = VENDOR_ROOT / "fzspeak-source"
HANLP_HOME = Path(
    os.environ.get("HANLP_HOME", str(VENDOR_ROOT / "models" / "hanlp"))
).resolve()
FASTTEXT_MODEL_PATH = Path(
    os.environ.get("FASTTEXT_MODEL_PATH", str(VENDOR_ROOT / "models" / "fasttext.bin"))
).resolve()
STOPWORDS_PATH = RESOURCES_ROOT / "stopwords_zh.txt"
SYNONYMS_PATH = RESOURCES_ROOT / "synonyms_zh.json"
AUDIO_CORPUS_DIR = Path(
    os.environ.get("AUDIO_CORPUS_DIR", str(PROJECT_ROOT / "public" / "audio"))
).resolve()

XFYUN_ISE_HOST = os.environ.get("XFYUN_ISE_HOST", "ise-api.xfyun.cn").strip()
XFYUN_ISE_PATH = os.environ.get("XFYUN_ISE_PATH", "/v2/open-ise").strip()
XFYUN_APP_ID = os.environ.get("XFYUN_APPID", "").strip()
XFYUN_API_KEY = os.environ.get("XFYUN_API_KEY", "").strip()
XFYUN_API_SECRET = os.environ.get("XFYUN_API_SECRET", "").strip()
