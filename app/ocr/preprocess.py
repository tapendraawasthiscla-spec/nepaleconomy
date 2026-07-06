"""
Image preprocessing utilities to maximize OCR accuracy.
Uses classical OpenCV techniques (no AI/LLMs).
"""

import cv2
import numpy as np
from PIL import Image

def load_image_bytes(data: bytes) -> np.ndarray:
    """
    Decodes uploaded bytes to a BGR numpy array safely.
    Handles single-channel, RGB, and RGBA images.
    """
    try:
        np_arr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError("Failed to decode image bytes.")
            
        # Normalize channels to BGR
        if len(img.shape) == 2:
            # Grayscale to BGR
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        elif len(img.shape) == 3 and img.shape[2] == 4:
            # RGBA with alpha channel -> BGR with white background
            bgr = img[:, :, :3]
            alpha = img[:, :, 3].astype(float) / 255.0
            bg = np.ones_like(bgr, dtype=np.float64) * 255.0
            
            out = bgr * alpha[..., None] + bg * (1.0 - alpha[..., None])
            img = np.clip(out, 0, 255).astype(np.uint8)
            
        return img
    except Exception as e:
        raise ValueError(f"Image load error: {str(e)}")

def pil_to_cv2(pil_image: Image.Image) -> np.ndarray:
    """Converts a PIL Image to an OpenCV BGR ndarray."""
    if pil_image.mode == "RGBA":
        # Create white background for transparent images
        background = Image.new("RGB", pil_image.size, (255, 255, 255))
        background.paste(pil_image, mask=pil_image.split()[3])
        pil_image = background
    elif pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")
        
    cv_img = np.array(pil_image)
    # RGB to BGR
    return cv_img[:, :, ::-1].copy()

def cv2_to_pil(cv_image: np.ndarray) -> Image.Image:
    """Converts an OpenCV BGR or Grayscale ndarray to a PIL Image."""
    if len(cv_image.shape) == 2:
        return Image.fromarray(cv_image)
    
    # BGR to RGB
    img_rgb = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
    return Image.fromarray(img_rgb)

def _to_grayscale(img: np.ndarray) -> np.ndarray:
    """Converts a BGR image to grayscale."""
    if len(img.shape) == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img

def _upscale_if_needed(img: np.ndarray) -> np.ndarray:
    """
    Upscales small images so that the larger side is ~1500-2000px,
    providing Tesseract with roughly 300 DPI equivalent size.
    Clamps scale factor to prevent out-of-memory errors on tiny images.
    """
    h, w = img.shape[:2]
    max_dim = max(h, w)
    
    if max_dim < 1000:
        target_max = 2000
        scale = target_max / max_dim
        scale = min(scale, 10.0)  # Guardrail: clamp upscale factor to max 10x
        
        new_w = int(w * scale)
        new_h = int(h * scale)
        return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    return img

def _denoise(img: np.ndarray, aggressive: bool) -> np.ndarray:
    """Removes noise using fastNlMeansDenoising."""
    h_val = 15.0 if aggressive else 5.0
    return cv2.fastNlMeansDenoising(img, None, h=h_val, templateWindowSize=7, searchWindowSize=21)

def _apply_clahe(img: np.ndarray) -> np.ndarray:
    """Increases local contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization)."""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(img)

def _binarize(img: np.ndarray) -> np.ndarray:
    """
    Binarizes the image. Computes both Adaptive Gaussian and Otsu thresholding,
    then heuristically selects the best one based on lighting variance.
    """
    # 1. Otsu thresholding
    _, th_otsu = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    
    # 2. Adaptive Gaussian thresholding
    th_adapt = cv2.adaptiveThreshold(
        img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 5
    )
    
    # 3. Heuristic: use standard deviation of local lighting
    # If the variance is high (uneven lighting), adaptive is usually much better.
    # If variance is low (clean scan), Otsu produces cleaner text.
    blur = cv2.GaussianBlur(img, (25, 25), 0)
    local_std = np.std(blur)
    
    if local_std > 20: 
        return th_adapt
    else:
        return th_otsu

def _deskew(img: np.ndarray) -> np.ndarray:
    """
    Detects and corrects skew angle by fitting a minAreaRect to text pixels.
    """
    # Invert image because minAreaRect works on non-zero (white) pixels
    inverted = cv2.bitwise_not(img)
    coords = np.column_stack(np.where(inverted > 0))
    
    if len(coords) == 0:
        return img
        
    angle = cv2.minAreaRect(coords)[-1]
    
    # Fix minAreaRect angle constraints (which returns [-90, 0))
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    # Guardrail: Only correct if |angle| > 0.5 degrees to prevent blurring from minor rotations
    if abs(angle) > 0.5:
        h, w = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        # Use a white border to replace the rotated empty areas
        img = cv2.warpAffine(
            img, M, (w, h), 
            flags=cv2.INTER_CUBIC, 
            borderMode=cv2.BORDER_CONSTANT, 
            borderValue=255
        )
    return img

def _morphological_opening(img: np.ndarray) -> np.ndarray:
    """Applies morphological opening to remove small speckles."""
    kernel = np.ones((2, 2), np.uint8)
    # Opening on a black-text/white-background image means we actually need to 
    # dilate and then erode, or invert, open, and invert back.
    # cv2.MORPH_OPEN removes white speckles on black backgrounds.
    # Our image has black text on white background, so we invert it first.
    inverted = cv2.bitwise_not(img)
    opened = cv2.morphologyEx(inverted, cv2.MORPH_OPEN, kernel)
    return cv2.bitwise_not(opened)

def preprocess_for_ocr(image_bgr: np.ndarray, aggressive: bool = False) -> np.ndarray:
    """
    Full pipeline to clean and optimize an image for Tesseract OCR.
    
    Args:
        image_bgr: A BGR numpy array image.
        aggressive: If True, applies stronger denoising and speckle removal.
        
    Returns:
        A clean, binary, deskewed grayscale numpy array image.
    """
    img = _to_grayscale(image_bgr)
    img = _upscale_if_needed(img)
    img = _denoise(img, aggressive)
    img = _apply_clahe(img)
    img = _binarize(img)
    img = _deskew(img)
    
    if aggressive:
        img = _morphological_opening(img)
        
    return img
