import io
import json
import base64
import numpy as np
from PIL import Image, ImageDraw
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from skimage.metrics import peak_signal_noise_ratio as psnr_metric
from skimage.metrics import structural_similarity as ssim_metric
from .inference import (
    MODELS_LOADED,
    ERROR_MSG,
    watermark_image,
    detect_watermark,
    verdict_from_confidence,
    attack_crop,
    attack_rotate,
    attack_noise,
    attack_blur,
    attack_jpeg,
    decode_message
)

app = FastAPI(title="AuthentiMark API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    if MODELS_LOADED:
        return {"status": "ok", "message": "All models loaded successfully."}
    else:
        return {"status": "error", "message": ERROR_MSG}

@app.post("/watermark")
async def watermark(file: UploadFile = File(...), method: str = Form(...)):
    if not MODELS_LOADED:
        raise HTTPException(status_code=503, detail="Models not loaded. " + ERROR_MSG)
    if method not in ("ae", "vae"):
        raise HTTPException(status_code=400, detail="Invalid watermarking method.")
        
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    try:
        wm_image, msg = watermark_image(image, method)
        
        orig_resized = image.resize((128, 128))
        orig_arr = np.array(orig_resized)
        wm_arr = np.array(wm_image)
        
        psnr_val = float(psnr_metric(orig_arr, wm_arr, data_range=255))
        try:
            ssim_val = float(ssim_metric(orig_arr, wm_arr, channel_axis=2, data_range=255))
        except TypeError:
            ssim_val = float(ssim_metric(orig_arr, wm_arr, multichannel=True, data_range=255))
            
        buffered = io.BytesIO()
        wm_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        image_url = f"data:image/png;base64,{img_str}"
        
        return {
            "watermarkedImageUrl": image_url,
            "psnr": psnr_val,
            "ssim": ssim_val,
            "message": msg
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if not MODELS_LOADED:
        raise HTTPException(status_code=503, detail="Models not loaded. " + ERROR_MSG)
        
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    try:
        prediction, confidence = detect_watermark(image)
        verdict = verdict_from_confidence(prediction, confidence)
        return {
            "prediction": prediction,
            "confidence": confidence,
            "verdict": verdict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
async def generate_image(prompt: str = Form(...)):
    try:
        import urllib.parse
        import requests
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=512&height=512&nologo=true"
        r = requests.get(url, timeout=12)
        if r.status_code == 200:
            img_bytes = r.content
            img_str = base64.b64encode(img_bytes).decode("utf-8")
            return {"imageUrl": f"data:image/png;base64,{img_str}"}
    except Exception:
        pass
        
    img = Image.new("RGB", (512, 512))
    draw = ImageDraw.Draw(img)
    for y in range(512):
        r = int(30 + (y / 512) * 50)
        g = int(40 + (y / 512) * 80)
        b = int(100 + (y / 512) * 120)
        draw.line([(0, y), (512, y)], fill=(r, g, b))
    draw.text((40, 240), f"Generated image for prompt:\n{prompt[:40]}", fill=(255, 255, 255))
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return {"imageUrl": f"data:image/png;base64,{img_str}"}

@app.post("/simulate-attack")
async def simulate_attack(
    file: UploadFile = File(...),
    attackType: str = Form(...),
    intensity: float = Form(...)
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")
        
    try:
        if attackType == "crop":
            attacked_image = attack_crop(image, intensity)
        elif attackType == "rotate":
            attacked_image = attack_rotate(image, intensity)
        elif attackType == "noise":
            attacked_image = attack_noise(image, intensity)
        elif attackType == "blur":
            attacked_image = attack_blur(image, intensity)
        elif attackType == "jpeg":
            attacked_image = attack_jpeg(image, intensity)
        else:
            attacked_image = image
            
        buffered = io.BytesIO()
        attacked_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        image_url = f"data:image/png;base64,{img_str}"
        
        return {
            "attackedImageUrl": image_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
