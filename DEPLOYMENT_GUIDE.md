# AuthentiMark — Complete Production Deployment Guide

This guide walks you through deploying **AuthentiMark** 100% free using the industry-standard decoupled architecture:
* **Frontend (React + Vite)**: Deployed on **Vercel** (Free Global Edge CDN, automated Git CI/CD, free SSL).
* **Backend (FastAPI + PyTorch)**: Deployed on **Render** (Free Web Service running our lightweight **85 MB quantized model**).

---

## Architecture Overview

```
   ┌────────────────────────────────────────────────────────┐
   │                  FRONTEND (Vercel)                     │
   │  • React Single Page App (SPA) with Vite & Tailwind    │
   │  • Hosted on Vercel Global Edge Network                │
   │  • Live URL: https://authentimark.vercel.app           │
   └────────────────────────────────────────────────────────┘
                               │
                      HTTPS REST API Requests
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                  BACKEND (Render)                      │
   │  • FastAPI + PyTorch Docker Container                  │
   │  • Lightweight ~150 MB RAM total footprint             │
   │  • Quantized ViT Detector (85 MB) + AE (35 MB) + VAE   │
   │  • Live URL: https://authentimark-api.onrender.com     │
   └────────────────────────────────────────────────────────┘
```

---

## Phase 1: Deploy Backend to Render (Free Web Service)

### Step 1: Push Quantized Checkpoint to GitHub
Ensure your newly generated quantized detector model is committed to GitHub so Render can build it:
```powershell
cd "d:\Engineering\FiY-SEM-1\GenAI\GenAI_Project_V2\AuthentiMark"
git add .
git commit -m "Add quantized detector (85MB) and production Docker configuration"
git push origin main
```

---

### Step 2: Create Web Service on Render
1. Go to [render.com](https://render.com) and log in with your GitHub account.
2. In your Render Dashboard, click **New +** → **Web Service**.
3. Select **"Build and deploy from a Git repository"** and choose your `AuthentiMark` repository.
4. Configure the deployment settings:
   * **Name**: `authentimark-api` (or any name you choose).
   * **Region**: Choose the closest region to you (e.g. *Singapore*, *Oregon*, or *Frankfurt*).
   * **Branch**: `main`
   * **Root Directory**: `authentimark-gui`
   * **Runtime**: **Docker**
   * **Instance Type**: **Free** *(512 MB RAM)*.
5. Click **Create Web Service**.

---

### Step 3: Verify the Live Backend API
1. Render will automatically build the Docker container using CPU-only PyTorch and start Uvicorn.
2. Once the deploy status says **Live**, click your Render URL:
   * Format: `https://authentimark-api.onrender.com`
3. Test your health endpoint in your browser:
   * Open: `https://authentimark-api.onrender.com/health`
   * Expected Response: `{"status": "ok", "message": "All models loaded successfully."}`
4. Test Swagger UI:
   * Open: `https://authentimark-api.onrender.com/docs`
5. **Copy your Render URL** (e.g. `https://authentimark-api.onrender.com`).

---

## Phase 2: Deploy Frontend to Vercel (Free Global CDN)

### Step 1: Import Project on Vercel
1. Log in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** → **Project**.
3. Locate your **`AuthentiMark`** repository and click **Import**.

---

### Step 2: Configure Build & Environment Variables
In the Vercel project configuration screen:

1. **Root Directory**:
   * Click **Edit** next to Root Directory.
   * Select: `authentimark-gui/frontend`
2. **Framework Preset**:
   * Automatically detected as **Vite** (leave as default).
3. **Environment Variables**:
   * Expand the **Environment Variables** section.
   * Add the following variable:
     * **Key**: `VITE_API_URL`
     * **Value**: `https://authentimark-api.onrender.com` *(Your Render backend URL from Phase 1)*
4. Click **Deploy**.

---

## Phase 3: Live Verification & Testing

Once Vercel finishes building (30–60 seconds), open your live Vercel URL (e.g., `https://authentimark.vercel.app`):

1. **Embed Section**:
   * Generate an image with the AI Prompt dropzone or upload an original image.
   * Embed both **AE** and **VAE** watermarks.
   * Verify high PSNR/SSIM metrics and sharp, high-resolution rendering.
2. **Examine Section**:
   * Run the **Vision Transformer (ViT)** detection.
   * Verify detection confidence score and classification verdict.
3. **Attack Bench Section**:
   * Apply Gaussian blur, JPEG recompression, rotation, or noise.
   * Observe the real-time detection robustness timeline.

---

## Alternative Free Backend Options

If you ever need an alternative backend host:

### Option B: Google Cloud Run (Free 2 GB – 4 GB RAM Tier)
* **Free Quota**: 2 million requests/month on GCP Free Tier.
* **How to deploy**:
  1. Go to [console.cloud.google.com/run](https://console.cloud.google.com/run).
  2. Click **Create Service** → Connect your GitHub repo.
  3. Under **Capacity**, select **`2 GiB Memory`**.
  4. Copy the generated `*.a.run.app` URL to your Vercel `VITE_API_URL`.

### Option C: Google Colab + Cloudflare Tunnel (Free T4 GPU)
* For live demos / thesis presentations with ultra-fast GPU acceleration:
  1. Run FastAPI in a Google Colab notebook.
  2. Expose via Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:8000`).
  3. Paste the tunnel URL into your Vercel `VITE_API_URL`.

---

## Troubleshooting & FAQs

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **First request takes ~30 seconds** | Render Free Tier Spin-Down | Render puts free instances to sleep after 15 minutes of inactivity. The first visitor will wake the container automatically. |
| **API returns 503 "Models not loaded"** | Checkpoint files missing | Ensure `ae_latest.pt`, `vae_latest.pt`, and `detector_quantized.pt` are in `authentimark-gui/models/`. |
| **CORS blocked on Vercel** | Origin misconfiguration | `backend/main.py` is configured to automatically allow all origins (`*`) by default. |
| **Build fails on Vercel** | Wrong root directory | Ensure Vercel's Root Directory is set to `authentimark-gui/frontend`. |
