#!/usr/bin/env sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_ROOT"

PYTHON_BIN=${PPE_BOOTSTRAP_PYTHON:-python3}
command -v node >/dev/null 2>&1 || { echo "Node.js 20 or newer is required" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required" >&2; exit 1; }
command -v "$PYTHON_BIN" >/dev/null 2>&1 || { echo "Python 3.10 or newer is required" >&2; exit 1; }

[ -x .venv/bin/python ] || "$PYTHON_BIN" -m venv .venv
.venv/bin/python -m pip install --upgrade pip
if [ -n "${PPE_TORCH_INDEX_URL:-}" ]; then
  .venv/bin/python -m pip install torch torchvision --index-url "$PPE_TORCH_INDEX_URL"
fi
.venv/bin/python -m pip install -r requirements.txt
npm install

printf '\nSetup complete.\nWeb mode: npm start\nDesktop mode: npm run desktop\n'
