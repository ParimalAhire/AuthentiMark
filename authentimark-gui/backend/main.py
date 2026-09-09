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
    attack_brightness,
    attack_downscale,
    attack_screenshot,
    decode_message
)

app = FastAPI(title="AuthentiMark API")

# Single source of truth for attack dispatch, shared by the single-shot
# /simulate-attack endpoint and the batched /simulate-attack-chain endpoint.
_ATTACK_FNS = {
    "crop": attack_crop,
    "rotate": attack_rotate,
    "noise": attack_noise,
    "blur": attack_blur,
    "jpeg": attack_jpeg,
    "brightness": attack_brightness,
    "downscale": attack_downscale,
    "screenshot": attack_screenshot,
}


def apply_attack(image, attack_type, intensity):
    fn = _ATTACK_FNS.get(attack_type)
    if fn is None:
        return image
    return fn(image, float(intensity))


def encode_png_data_url(image):
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
        wm_resized = wm_image.resize((128, 128))
        wm_arr = np.array(wm_resized)
        
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
        import urllib.request
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=512&height=512&nologo=true"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        with urllib.request.urlopen(req, timeout=15) as r:
            if r.status == 200:
                img_bytes = r.read()
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
        attacked_image = apply_attack(image, attackType, intensity)
        return {"attackedImageUrl": encode_png_data_url(attacked_image)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate-attack-chain")
async def simulate_attack_chain(
    file: UploadFile = File(...),
    chain: str = Form(...)
):
    """Apply an ordered list of attacks in a single in-memory pass.

    `chain` is a JSON array of {"type": <attack>, "intensity": <float>}.
    Equivalent to calling /simulate-attack repeatedly and feeding each
    result into the next, but without the intermediate encode/decode and
    network round-trips. Output is lossless PNG, so image quality and the
    detector verdict are identical to the step-by-step path.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    try:
        steps = json.loads(chain)
        if not isinstance(steps, list):
            raise ValueError("chain must be a JSON array")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid attack chain.")

    try:
        for step in steps:
            image = apply_attack(image, step["type"], step["intensity"])
        return {"attackedImageUrl": encode_png_data_url(image)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
