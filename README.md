# AuthentiMark: Robust Invisible Watermarking for AI-Generated Images

B.Tech Generative AI Mega Project, Department of Computer Engineering,
MIT Academy of Engineering, Alandi (D), Pune (Academic Year 2026–2027)

## Team

| Name | PRN |
|---|---|
| Parimal Ahire | 202301040067 |
| Lucky Sharma | 202301040253 |
| Laksh Pacholy | 202301040263 |
| Atharva Suryawanshi | 202301040283 |

**Project Guide:** Dr. Savita Mane

## Overview

AuthentiMark hides an invisible 32-bit message in an image so that its origin can be
checked later, even after the image has been compressed, cropped or blurred.

The project compares five watermarking architectures under one dataset split, one
decoder, one training recipe and one test protocol. A Vision Transformer (ViT)
detector checks whether an image carries a watermark. A web application lets you
embed watermarks, attack the images and run the detector.

## Models

| Model | Approach |
|---|---|
| Autoencoder (AE) | Adds a residual that carries the message (baseline) |
| Variational Autoencoder (VAE) | Residual encoder with a stochastic latent |
| GAN-Residual | AE trained against a PatchGAN discriminator |
| GAN-Rebuild | U-Net that rebuilds the whole image with the message |
| Latent-Residual | Embeds the message in the latent space of TAESD |
| Detector | ViT-B/16 classifier: watermarked or clean |

## Results

Measured on 9,771 held-out images from DiffusionDB, as given in the project report.

| Model | Bit accuracy | Exact match | PSNR (dB) | SSIM | ΔE (lower is better) | Final score |
|---|---|---|---|---|---|---|
| GAN-Residual | 0.9997 | 0.9937 | 29.78 | 0.8949 | 3.28 | **0.9529** |
| GAN-Rebuild | 0.9993 | 0.9830 | 25.64 | 0.8529 | 9.25 | 0.9328 |
| VAE | 1.0000 | 1.0000 | 24.88 | 0.6674 | 11.20 | 0.9111 |
| Latent-Residual | 0.9996 | 0.9896 | 21.00 | 0.6443 | 12.05 | 0.8945 |
| AE | 0.9996 | 0.9919 | 23.17 | 0.5766 | 13.40 | 0.8933 |

The detector reaches a balanced accuracy of 99.97% on unattacked images and 99.80%
averaged over four attacks (JPEG 90, JPEG 30, crop and blur).

> The web application ships with checkpoints from earlier training runs, so the
> numbers you see in the app differ from this table.

## Web Application

| Section | What it does |
|---|---|
| **Embed** | Upload an image, pick a sample or generate one from a text prompt, then watermark it. Shows PSNR and SSIM and lets you download the result. |
| **Examine** | Check whether an image is watermarked. |
| **Attack** | Combine JPEG compression, crop, blur, downscale, brightness, noise, rotation and screenshot attacks, then compare how the models hold up. |
| **Model Details** | Training curves, sample outputs and comparison charts. |

## Tech Stack

- **Training:** Python, PyTorch, Google Colab (NVIDIA L4 GPU)
- **Backend:** FastAPI, PyTorch (CPU), Pillow, NumPy, scikit-image
- **Frontend:** React, Vite, Tailwind CSS

## Project Structure

```text
AuthentiMark/
├── README.md
├── ProjectV3_Final.ipynb                 training notebook (AE, VAE, ViT detector)
├── DEPLOYMENT_GUIDE.md
└── authentimark-gui/
    ├── backend/
    │   ├── main.py                       API endpoints
    │   ├── inference.py                  model loading, watermarking, attacks
    │   ├── models.py                     model architectures
    │   └── requirements.txt
    ├── frontend/                         React web application
    └── models/                           trained checkpoints
```

## Installation

### Prerequisites

- Python 3.10 or later (tested with 3.11)
- Node.js 18 or later (tested with 22) and npm
- Git

A GPU is not required to run the web application.

### 1. Clone the repository

```bash
git clone https://github.com/ParimalAhire/AuthentiMark.git
cd AuthentiMark/authentimark-gui
```

### 2. Install backend dependencies

```bash
python -m venv .venv
```

Activate the virtual environment:

```bash
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate
```

Install the packages:

```bash
pip install -r backend/requirements.txt
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Running the Application

The backend and the frontend must both be running, each in its own terminal.

### Terminal 1: backend

From `authentimark-gui/`, with the virtual environment activated:

```bash
uvicorn backend.main:app --port 8000
```

- Health check: http://localhost:8000/health
- Interactive API documentation: http://localhost:8000/docs

### Terminal 2: frontend

From `authentimark-gui/frontend/`:

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

## How to Use

1. In **Embed**, load an image, choose a model and embed the watermark.
2. In **Examine**, run the detector on the watermarked image.
3. In **Attack**, apply one or more attacks and see how the detection changes.
4. Turn on **Compare Models** after embedding with at least two models.
5. In **Model Details**, review the training and comparison charts.

## API Endpoints

| Method | Endpoint | Input | Output |
|---|---|---|---|
| GET | `/health` | none | Model status |
| POST | `/watermark` | `file`, `method` | Watermarked image, PSNR, SSIM, 32-bit message |
| POST | `/decode` | `file`, `method` | 32 decoded bits |
| POST | `/detect` | `file` | Prediction, confidence, verdict |
| POST | `/simulate-attack` | `file`, `attackType`, `intensity` | Attacked image |
| POST | `/simulate-attack-chain` | `file`, `chain` (JSON list) | Image after all attacks |
| POST | `/generate-image` | `prompt` | Generated image |

`method` is one of `ae`, `vae`, `gan` or `latent_residual`.

## Notes and Troubleshooting

- **Latent-Residual in the app:** its checkpoint (`latent_residual_app.pt`) is not in
  the repository. Without it in `authentimark-gui/models/`, this option and the
  ready-made sample button in **Attack** show an error. AE, VAE and GAN work without
  it, so start from **Embed**.
- **Image generation** uses the external Pollinations AI service. It needs an internet
  connection and sends your prompt to that service. If the service is unavailable, a
  placeholder image is returned.
- **PowerShell blocks activation:** run `Set-ExecutionPolicy -Scope Process RemoteSigned`
  and activate again.
- **Frontend shows "backend offline":** check that the backend is running on port 8000.
- **Old code still being served on Windows:** run `uvicorn` without `--reload` and close
  any leftover Python processes.

## Ethical Considerations and Limitations

- A detection with confidence below 75% is reported as "Uncertain" and must not be
  treated as proof.
- The detector only says whether a watermark is present. It does not read the message
  and is not a general test for AI-generated images.
- The bundled detector was trained on AE, VAE and GAN-Residual watermarks, so its
  results on other methods are not reliable.
- The reported results come from a single training run per model, on 128×128 images.
- Robustness was tested against JPEG, crop and blur. Generative editing attacks were
  not tested.

## Acknowledgements

We thank our guide, Dr. Savita Mane, and the Department of Computer Engineering,
MIT Academy of Engineering. This project uses
[DiffusionDB](https://github.com/poloclub/diffusiondb),
[TAESD](https://github.com/madebyollin/taesd) and
[PyTorch](https://pytorch.org/).
