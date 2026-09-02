# ─────────────────────────────────────────────────────────────
# AuthentiMark — Production Dockerfile (Render / Cloud Run / Hugging Face)
# ─────────────────────────────────────────────────────────────
FROM python:3.10-slim

WORKDIR /app

# Install minimal OS dependencies for image processing and compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only build (keeps container size under 900MB instead of 5GB+)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy and install backend Python dependencies
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and model checkpoints (including the 85MB quantized detector)
COPY backend/ backend/
COPY models/ models/

# Expose default port
EXPOSE 8000

# Start Uvicorn ASGI server with dynamic port support ($PORT for Render/Cloud Run, default 8000)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
