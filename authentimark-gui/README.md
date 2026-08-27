# AuthentiMark GUI

A web application that allows users to upload an image, watermark it using a trained AutoEncoder (AE) or Variational AutoEncoder (VAE) model, and detect watermarks using a Vision Transformer (ViT) detector.

## Project Structure

```text
authentimark-gui/
├── models/
│   ├── ae_latest.pt
│   ├── vae_latest.pt
│   └── detector_latest.pt
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── inference.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── WatermarkPanel.jsx
    │   │   ├── DetectPanel.jsx
    │   │   ├── ImageUploader.jsx
    │   │   └── VerdictBadge.jsx
    │   ├── api.js
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

## Setup Instructions

### 1. Prerequisites (Model Checkpoints)
Make sure that your three trained model checkpoints are located inside the `models/` folder:
- `ae_latest.pt`
- `vae_latest.pt`
- `detector_latest.pt`

If these files are missing, copy them from your Google Drive into the `models/` directory.

### 2. Backend Installation and Execution
Open a terminal, navigate to the `authentimark-gui/` directory, and install requirements:
```bash
pip install -r backend/requirements.txt
```

Start the FastAPI backend server:
```bash
uvicorn backend.main:app --reload --port 8000
```
The server will run on `http://localhost:8000`. You can inspect the health check at `http://localhost:8000/health`.

### 3. Frontend Installation and Execution
Open another terminal, navigate to the `authentimark-gui/frontend/` directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`. Open this URL in your web browser to use the application.

*Note: Both backend and frontend servers must be running simultaneously.*

## Ethical Considerations & Safeguards

To prevent misinformation and misuse:
- **Ethics-Aware Confidence Threshold**: The system enforces a confidence threshold of **75%** on detections.
- **Uncertainty Warning**: If the detector outputs a confidence score lower than 75%, it displays an amber **"Uncertain -- do not treat as definitive proof"** warning. This ensures users do not make false positive or false negative assertions based on uncertain predictions.

