# ─────────────────────────────────────────────────────────────
# AuthentiMark — Production Dockerfile (Render / Cloud Run)
# ─────────────────────────────────────────────────────────────
FROM python:3.10-slim

WORKDIR /app

# Install minimal OS dependencies for image processing (libgl1, libglib)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code and pretrained models
COPY backend/ backend/
COPY models/ models/

# Expose default port
EXPOSE 8000

# Start Uvicorn ASGI server with dynamic port support ($PORT)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
