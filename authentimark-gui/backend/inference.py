import os
import io
import torch
import numpy as np
import torchvision.transforms as T
from PIL import Image, ImageFilter, ImageEnhance
from .models import AEEncoder, AEDecoder, VAEEncoder, VAEDecoder, WatermarkDetector, prepare_for_vit

# Limit PyTorch CPU thread pools to 1 to reduce baseline RAM in 512MB containers
torch.set_num_threads(1)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Global model cache (lazy-loaded on demand to keep startup RAM < 50MB)
_AE_ENCODER, _AE_DECODER = None, None
_VAE_ENCODER, _VAE_DECODER = None, None
_DETECTOR = None

def get_ae():
    global _AE_ENCODER, _AE_DECODER
    if _AE_ENCODER is None or _AE_DECODER is None:
        ae_path = os.path.join(MODELS_DIR, "ae_latest.pt")
        if not os.path.exists(ae_path):
            raise FileNotFoundError(f"AE model checkpoint not found at {ae_path}")
        encoder = AEEncoder()
        decoder = AEDecoder()
        checkpoint = torch.load(ae_path, map_location="cpu")
        encoder.load_state_dict(checkpoint["encoder"])
        decoder.load_state_dict(checkpoint["decoder"])
        encoder.eval()
        decoder.eval()
        _AE_ENCODER, _AE_DECODER = encoder, decoder
    return _AE_ENCODER, _AE_DECODER

def get_vae():
    global _VAE_ENCODER, _VAE_DECODER
    if _VAE_ENCODER is None or _VAE_DECODER is None:
        vae_path = os.path.join(MODELS_DIR, "vae_latest.pt")
        if not os.path.exists(vae_path):
            raise FileNotFoundError(f"VAE model checkpoint not found at {vae_path}")
        encoder = VAEEncoder()
        decoder = VAEDecoder()
        checkpoint = torch.load(vae_path, map_location="cpu")
        encoder.load_state_dict(checkpoint["encoder"])
        decoder.load_state_dict(checkpoint["decoder"])
        encoder.eval()
        decoder.eval()
        _VAE_ENCODER, _VAE_DECODER = encoder, decoder
    return _VAE_ENCODER, _VAE_DECODER

def get_detector():
    global _DETECTOR
    if _DETECTOR is None:
        quant_path = os.path.join(MODELS_DIR, "detector_quantized.pt")
        orig_path = os.path.join(MODELS_DIR, "detector_latest.pt")
        
        if os.path.exists(quant_path):
            base_model = WatermarkDetector()
            detector = torch.quantization.quantize_dynamic(
                base_model, {torch.nn.Linear}, dtype=torch.qint8
            )
            checkpoint = torch.load(quant_path, map_location="cpu")
            detector.load_state_dict(checkpoint["model"])
            detector.eval()
            _DETECTOR = detector
        elif os.path.exists(orig_path):
            detector = WatermarkDetector()
            checkpoint = torch.load(orig_path, map_location="cpu")
            detector.load_state_dict(checkpoint["model"])
            detector.eval()
            _DETECTOR = detector
        else:
            raise FileNotFoundError(f"Detector checkpoint ('detector_quantized.pt' or 'detector_latest.pt') was not found in '{MODELS_DIR}'.")
    return _DETECTOR

def check_models_ready():
    ae_ok = os.path.exists(os.path.join(MODELS_DIR, "ae_latest.pt"))
    vae_ok = os.path.exists(os.path.join(MODELS_DIR, "vae_latest.pt"))
    det_ok = os.path.exists(os.path.join(MODELS_DIR, "detector_quantized.pt")) or os.path.exists(os.path.join(MODELS_DIR, "detector_latest.pt"))
    return ae_ok and vae_ok and det_ok

# For backward compatibility
MODELS_LOADED = check_models_ready()
ERROR_MSG = "" if MODELS_LOADED else "Model checkpoints missing on disk."

def watermark_image(image, method):
    if method == "ae":
        encoder, _ = get_ae()
    elif method == "vae":
        encoder, _ = get_vae()
    else:
        raise ValueError(f"Unknown watermarking method: {method}")
        
    W, H = image.size
        
    transform = T.Compose([
        T.Resize((128, 128)),
        T.ToTensor()
    ])
    img_tensor = transform(image).unsqueeze(0)
    msg = np.random.randint(0, 2, size=32)
    msg_tensor = torch.tensor(msg, dtype=torch.float32).unsqueeze(0)
    
    with torch.no_grad():
        wm_tensor = encoder(img_tensor, msg_tensor)
        
    residual = wm_tensor - img_tensor
    residual_highres = torch.nn.functional.interpolate(
        residual, size=(H, W), mode='bilinear', align_corners=False
    )
    
    orig_tensor = T.ToTensor()(image).unsqueeze(0)
    wm_tensor_highres = torch.clamp(orig_tensor + residual_highres, 0.0, 1.0)
    
    wm_image = T.ToPILImage()(wm_tensor_highres.squeeze(0).cpu())
    return wm_image, msg.tolist()

def detect_watermark(image):
    detector = get_detector()
    img_tensor = prepare_for_vit(image)
    with torch.no_grad():
        logits = detector(img_tensor)
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
    return ImageEnhance.Brightness(image).enhance(float(factor))

def attack_downscale(image, scale_ratio):
    w, h = image.size
    scale_ratio = max(0.1, min(1.0, float(scale_ratio)))
    small = image.resize(
        (max(1, int(w * scale_ratio)), max(1, int(h * scale_ratio))),
        resample=Image.BICUBIC,
    )
    return small.resize((w, h), resample=Image.BICUBIC)

def attack_screenshot(image, severity):
    severity = max(0.0, min(1.0, float(severity)))
    out = attack_downscale(image, 1.0 - 0.18 * severity)
    out = attack_blur(out, 0.4 + 0.8 * severity)
    out = attack_brightness(out, 1.0 + 0.05 * severity)
    quality = int(92 - 40 * severity)
    return attack_jpeg(out, quality)

def decode_message(image, method):
    if method == "ae":
        _, decoder = get_ae()
    elif method == "vae":
        _, decoder = get_vae()
    else:
        raise ValueError(f"Unknown method {method}")
        
    transform = T.Compose([
        T.Resize((128, 128)),
        T.ToTensor()
    ])
    img_tensor = transform(image).unsqueeze(0)
    
    with torch.no_grad():
        logits = decoder(img_tensor)
        
    decoded_bits = (logits >= 0.0).int().squeeze(0).cpu().tolist()
    return decoded_bits
