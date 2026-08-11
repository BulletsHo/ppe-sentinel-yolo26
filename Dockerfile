FROM node:22-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PPE_HOST=0.0.0.0 \
    PPE_PUBLIC=1 \
    PPE_PYTHON=/opt/ppe-venv/bin/python \
    PPE_MODEL=/app/outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt \
    PPE_LOG_DIR=/app/logs \
    PPE_DATASETS_DIR=/app/datasets

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN python3 -m venv /opt/ppe-venv \
    && /opt/ppe-venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/ppe-venv/bin/pip install --no-cache-dir -r requirements.txt
COPY package.json server.cjs app.js index.html ./
COPY src ./src
COPY scripts ./scripts
COPY outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt ./outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt
RUN python3 scripts/audit_release_privacy.py
RUN mkdir -p /app/logs /app/datasets
EXPOSE 4175
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4175/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.cjs"]
