"""
Image preprocessing utilities to maximize OCR accuracy.
Uses classical OpenCV techniques (no AI/LLMs).
"""
import cv2
import numpy as np

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
            
        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        elif len(img.shape) == 3 and img.shape[2] == 4:
            bgr = img[:, :, :3]
            alpha = img[:, :, 3].astype(float) / 255.0
            bg = np.ones_like(bgr, dtype=np.float64) * 255.0
            out = bgr * alpha[..., None] + bg * (1.0 - alpha[..., None])
            img = np.clip(out, 0, 255).astype(np.uint8)
            
        return img
    except Exception as e:
        raise ValueError(f"Image load error: {str(e)}")

def _to_grayscale(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img

def _upscale_if_needed(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    max_dim = max(h, w)
    if max_dim < 1000:
        target_max = 2000
        scale = min(target_max / max_dim, 10.0)
        return cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
    return img

def _denoise(img: np.ndarray, aggressive: bool) -> np.ndarray:
    h_val = 15.0 if aggressive else 5.0
    return cv2.fastNlMeansDenoising(img, None, h=h_val, templateWindowSize=7, searchWindowSize=21)

def _apply_clahe(img: np.ndarray) -> np.ndarray:
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(img)

def _binarize(img: np.ndarray) -> np.ndarray:
    _, th_otsu = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    th_adapt = cv2.adaptiveThreshold(
        img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 5
    )
    blur = cv2.GaussianBlur(img, (25, 25), 0)
    local_std = np.std(blur)
    return th_adapt if local_std > 20 else th_otsu

def _deskew(img: np.ndarray) -> np.ndarray:
    inverted = cv2.bitwise_not(img)
    coords = np.column_stack(np.where(inverted > 0))
    if len(coords) == 0:
        return img
        
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    if abs(angle) > 0.5:
        h, w = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=255)
    return img

def _morphological_opening(img: np.ndarray) -> np.ndarray:
    kernel = np.ones((2, 2), np.uint8)
    inverted = cv2.bitwise_not(img)
    opened = cv2.morphologyEx(inverted, cv2.MORPH_OPEN, kernel)
    return cv2.bitwise_not(opened)

def preprocess_for_ocr(image_bgr: np.ndarray, aggressive: bool = False) -> np.ndarray:
    """
    Full pipeline to clean and optimize an image for Tesseract OCR.
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
