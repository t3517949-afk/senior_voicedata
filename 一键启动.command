#!/bin/zsh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
BACKEND_VENV_DIR="$BACKEND_DIR/.venv"
BACKEND_PYTHON="$BACKEND_VENV_DIR/bin/python3"
FRONTEND_LOG_FILE="${TMPDIR:-/tmp}/lingxi-site-vite.log"
BACKEND_LOG_FILE="${TMPDIR:-/tmp}/lingxi-site-backend.log"
EXPECTED_TITLE="聆夕 / 聆伴老年人认知健康与情感陪伴平台"
BACKEND_PORT=8011
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"
PORT=""
FOUND_EXISTING_SERVER=0
STARTED_FRONTEND=0
STARTED_BACKEND=0

cd "$SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required to open this website."
  echo "Please install Node.js first, then run this launcher again."
  read -k 1 "?Press any key to exit..."
  echo
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required to start the semantic network backend."
  read -k 1 "?Press any key to exit..."
  echo
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing project dependencies for the first launch..."
  npm install
fi

if ! curl -sf "${BACKEND_URL}/health" >/dev/null 2>&1; then
  echo "Starting semantic network backend..."
  export HANLP_HOME="$SCRIPT_DIR/vendor/models/hanlp"
  cd "$BACKEND_DIR"

  if [ -f "$BACKEND_ENV_FILE" ]; then
    set -a
    source "$BACKEND_ENV_FILE"
    set +a
  fi

  if [ ! -d "$BACKEND_VENV_DIR" ]; then
    python3 -m venv "$BACKEND_VENV_DIR"
  fi

  "$BACKEND_PYTHON" -m pip install --upgrade pip >/dev/null
  "$BACKEND_PYTHON" -m pip install -r requirements.txt >/dev/null
  "$BACKEND_PYTHON" -m uvicorn app.main:app --reload --host 127.0.0.1 --port "${BACKEND_PORT}" >"${BACKEND_LOG_FILE}" 2>&1 &
  BACKEND_PID=$!
  STARTED_BACKEND=1
  cd "$SCRIPT_DIR"
else
  echo "Backend already running at ${BACKEND_URL}"
fi

for CANDIDATE_PORT in 4173 4174 4175 4328 5173; do
  CANDIDATE_URL="http://127.0.0.1:${CANDIDATE_PORT}"
  if lsof -iTCP:${CANDIDATE_PORT} -sTCP:LISTEN >/dev/null 2>&1; then
    if curl -sf "${CANDIDATE_URL}" | grep -q "${EXPECTED_TITLE}"; then
      PORT="${CANDIDATE_PORT}"
      FOUND_EXISTING_SERVER=1
      break
    fi
    continue
  fi

  PORT="${CANDIDATE_PORT}"
  break
done

if [ -z "${PORT}" ]; then
  echo "No available local port was found for the website."
  read -k 1 "?Press any key to exit..."
  echo
  exit 1
fi

URL="http://127.0.0.1:${PORT}"

if [ "${FOUND_EXISTING_SERVER}" -eq 0 ]; then
  echo "Starting website frontend..."
  npm run start -- --port "${PORT}" --strictPort >"${FRONTEND_LOG_FILE}" 2>&1 &
  SERVER_PID=$!
  STARTED_FRONTEND=1
else
  echo "Frontend already running at ${URL}"
fi

cleanup() {
  if [ "${STARTED_FRONTEND}" -eq 1 ] && kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
  if [ "${STARTED_BACKEND}" -eq 1 ] && kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
    kill "${BACKEND_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup INT TERM EXIT

for _ in {1..30}; do
  FRONTEND_READY=0
  BACKEND_READY=0

  if curl -sf "${URL}" >/dev/null 2>&1; then
    FRONTEND_READY=1
  fi

  if curl -sf "${BACKEND_URL}/health" >/dev/null 2>&1; then
    BACKEND_READY=1
  fi

  if [ "${FRONTEND_READY}" -eq 1 ] && [ "${BACKEND_READY}" -eq 1 ]; then
    open "${URL}"
    echo "Opened in your browser: ${URL}"
    echo "Frontend + backend are running in unified mode."
    echo "Keep this terminal window open while using the website."
    if [ "${STARTED_FRONTEND}" -eq 1 ]; then
      wait "${SERVER_PID}"
      exit $?
    fi
    if [ "${STARTED_BACKEND}" -eq 1 ]; then
      wait "${BACKEND_PID}"
      exit $?
    fi
    exit 0
  fi
  sleep 1
done

echo "The website or backend did not start within 30 seconds."
echo "Recent log output:"
tail -n 40 "${FRONTEND_LOG_FILE}" || true
tail -n 40 "${BACKEND_LOG_FILE}" || true
read -k 1 "?Press any key to exit..."
echo
