# Backend

This backend prepares the website project for later:

- HanLP segmentation and basic text preprocessing
- fastText word and sentence vector computation
- graph modeling with `python-igraph`

## Source links

- fastText local source: `../vendor/fasttext-source`
- HanLP local source: `../vendor/hanlp-source`
- igraph local source: `../vendor/igraph-source`

## Endpoints

- `GET /health`
- `GET /integrations/status`
- `POST /api/nlp/hanlp`
- `POST /api/vectorize`
- `POST /api/graph/cooccurrence`

## Model file

The backend expects a fastText `.bin` model file.

Default path:

- `../vendor/models/fasttext.bin`

You can override it with:

- `FASTTEXT_MODEL_PATH=/absolute/path/to/model.bin`

HanLP will use:

- `../vendor/models/hanlp`

as its default model cache directory, unless `HANLP_HOME` is set.

## Local run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8011
```
