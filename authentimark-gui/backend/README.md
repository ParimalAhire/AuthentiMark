---
title: AuthentiMark Backend
emoji: 🔏
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# AuthentiMark Backend

FastAPI + PyTorch inference service for the AuthentiMark Neural Watermarking Studio.
It loads three trained checkpoints at startup (an AutoEncoder watermarker, a Variational
AutoEncoder watermarker, and a Vision Transformer watermark detector) and exposes a small
REST API. Model weights are pulled from a Hugging Face model repo on first boot when the
`HF_MODEL_REPO` environment variable is set, and cached into `models/`.

## Endpoints

| Method | Path               | Description |
|--------|--------------------|-------------|
| GET    | `/health`          | Reports whether all three models loaded, or the real error message. |
| POST   | `/watermark`       | `file` (image) + `method` (`ae` or `vae`) → watermarked image (base64 PNG), PSNR, SSIM, and the 32-bit message. |
| POST   | `/detect`          | `file` (image) → `{prediction, confidence, verdict}` with the 75% ethics-aware confidence threshold applied. |
| POST   | `/simulate-attack` | `file` (image) + `attackType` + `intensity` → attacked image (base64 PNG). |
| POST   | `/generate-image`  | `prompt` → a generated 512×512 image (base64 PNG). |

## Environment variables

| Variable          | Required | Description |
|-------------------|----------|-------------|
| `HF_MODEL_REPO`   | no       | Hugging Face model repo holding `ae_latest.pt`, `vae_latest.pt`, `detector_latest.pt` (e.g. `yourusername/authentimark-models`). If unset, the service expects the files to already exist in `models/`. |
| `HF_TOKEN`        | no       | Access token, only needed if `HF_MODEL_REPO` is private. |
| `ALLOWED_ORIGINS` | no       | Comma-separated list of allowed CORS origins. Defaults to `http://localhost:5173`. |

## Running locally

```bash
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 7860
```

Run the command from the directory that contains this `backend/` folder so the package
imports (`from .inference import ...`) resolve.
