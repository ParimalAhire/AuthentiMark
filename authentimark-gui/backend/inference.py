import os
import io
import torch
import numpy as np
import torchvision.transforms as T
from PIL import Image, ImageFilter, ImageEnhance
from .models import AEEncoder, AEDecoder, VAEEncoder, VAEDecoder, WatermarkDetector, prepare_for_vit

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

def check_model_exists(filename):
    path = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Required model checkpoint '{filename}' was not found in "
            f"'{MODELS_DIR}'. Please copy it from Google Drive before starting."
        )
    return path

def load_ae():
    ae_path = check_model_exists("ae_latest.pt")
    encoder = AEEncoder()
    decoder = AEDecoder()
    checkpoint = torch.load(ae_path, map_location="cpu")
    encoder.load_state_dict(checkpoint["encoder"])
    decoder.load_state_dict(checkpoint["decoder"])
    encoder.eval()
    decoder.eval()
    return encoder, decoder

def load_vae():
    vae_path = check_model_exists("vae_latest.pt")
    encoder = VAEEncoder()
    decoder = VAEDecoder()
    checkpoint = torch.load(vae_path, map_location="cpu")
    encoder.load_state_dict(checkpoint["encoder"])
    decoder.load_state_dict(checkpoint["decoder"])
    encoder.eval()
    decoder.eval()
    return encoder, decoder

def load_detector():
    det_path = check_model_exists("detector_latest.pt")
    detector = WatermarkDetector()
    checkpoint = torch.load(det_path, map_location="cpu")
    detector.load_state_dict(checkpoint["model"])
    detector.eval()
    return detector

try:
    AE_ENCODER, AE_DECODER = load_ae()
    VAE_ENCODER, VAE_DECODER = load_vae()
    DETECTOR = load_detector()
    MODELS_LOADED = True
    ERROR_MSG = ""
except Exception as e:
    AE_ENCODER, AE_DECODER = None, None
    VAE_ENCODER, VAE_DECODER = None, None
    DETECTOR = None
    MODELS_LOADED = False
    ERROR_MSG = str(e)

def watermark_image(image, method):
    if method == "ae":
        encoder = AE_ENCODER
    elif method == "vae":
        encoder = VAE_ENCODER
    else:
        raise ValueError(f"Unknown method {method}")
        
    if encoder is None:
        raise RuntimeError(f"Encoder model for {method} is not loaded.")
        
    transform = T.Compose([
        T.Resize((128, 128)),
        T.ToTensor()
    ])
    img_tensor = transform(image).unsqueeze(0)
    msg = np.random.randint(0, 2, size=32)
    msg_tensor = torch.tensor(msg, dtype=torch.float32).unsqueeze(0)
    
    with torch.no_grad():
        wm_tensor = encoder(img_tensor, msg_tensor)
        
    img_tensor_out = torch.clamp(wm_tensor.squeeze(0), 0.0, 1.0)
    wm_image = T.ToPILImage()(img_tensor_out.cpu())
    return wm_image, msg.tolist()

def detect_watermark(image):
    if DETECTOR is None:
        raise RuntimeError("Detector model is not loaded.")
        
    img_tensor = prepare_for_vit(image)
    with torch.no_grad():
        logits = DETECTOR(img_tensor)
        probs = torch.softmax(logits, dim=-1)
        
    prediction = probs.argmax(dim=-1).item()
    confidence = probs[0, prediction].item()
    return prediction, confidence

def verdict_from_confidence(prediction, confidence, threshold=0.75):
    if confidence < threshold:
        return "Uncertain -- do not treat as definitive proof"
    if prediction == 1:
        return "Likely watermarked"
    return "Likely not watermarked"

def attack_crop(image, crop_ratio):
    w, h = image.size
    new_w, new_h = int(w * crop_ratio), int(h * crop_ratio)
    left = (w - new_w) // 2
    top = (h - new_h) // 2
    right = left + new_w
    bottom = top + new_h
    cropped = image.crop((left, top, right, bottom))
    return cropped.resize((w, h), resample=Image.BICUBIC)

def attack_rotate(image, angle):
    return image.rotate(angle, resample=Image.BICUBIC, expand=False)

def attack_noise(image, std):
    arr = np.array(image).astype(np.float32) / 255.0
    noise = np.random.normal(0, std, arr.shape)
    noisy = np.clip(arr + noise, 0.0, 1.0)
    return Image.fromarray((noisy * 255.0).astype(np.uint8))

def attack_blur(image, radius):
    return image.filter(ImageFilter.GaussianBlur(radius))

def attack_jpeg(image, quality):
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG", quality=int(quality))
    buffered.seek(0)
    return Image.open(buffered).convert("RGB")

def attack_brightness(image, factor):
    # factor 1.0 = unchanged; <1 darker, >1 brighter
    return ImageEnhance.Brightness(image).enhance(float(factor))

def attack_downscale(image, scale_ratio):
    # shrink to scale_ratio then restore size -> real detail loss
    w, h = image.size
    scale_ratio = max(0.1, min(1.0, float(scale_ratio)))
    small = image.resize(
        (max(1, int(w * scale_ratio)), max(1, int(h * scale_ratio))),
        resample=Image.BICUBIC,
    )
    return small.resize((w, h), resample=Image.BICUBIC)

def attack_screenshot(image, severity):
    # approximates capturing an image off a screen:
    # slight downscale + mild recompression + faint blur + tiny brightness lift
    severity = max(0.0, min(1.0, float(severity)))
    out = attack_downscale(image, 1.0 - 0.18 * severity)
    out = attack_blur(out, 0.4 + 0.8 * severity)
    out = attack_brightness(out, 1.0 + 0.05 * severity)
    quality = int(92 - 40 * severity)
    return attack_jpeg(out, quality)

def decode_message(image, method):
    if method == "ae":
        decoder = AE_DECODER
    elif method == "vae":
        decoder = VAE_DECODER
    else:
        raise ValueError(f"Unknown method {method}")
        
    if decoder is None:
        raise RuntimeError(f"Decoder model for {method} is not loaded.")
        
    transform = T.Compose([
        T.Resize((128, 128)),
        T.ToTensor()
    ])
    img_tensor = transform(image).unsqueeze(0)
    
    with torch.no_grad():
        logits = decoder(img_tensor)
        
    decoded_bits = (logits >= 0.0).int().squeeze(0).cpu().tolist()
    return decoded_bits
