"""
Image preprocessing for maximum OCR accuracy.
Classical OpenCV techniques only - no AI/LLM.
"""
import cv2
import numpy as np


def load_image_bytes(data: bytes) -> np.ndarray:
    """Decode uploaded bytes to BGR numpy array."""
    np_arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("Failed to decode image bytes.")

    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif len(img.shape) == 3 and img.shape[2] == 4:
        bgr = img[:, :, :3]
        alpha = img[:, :, 3].astype(np.float64) / 255.0
        bg = np.ones_like(bgr, dtype=np.float64) * 255.0
        img = (bgr * alpha[..., None] + bg * (1.0 - alpha[..., None]))
        img = np.clip(img, 0, 255).astype(np.uint8)

    return img


def _to_grayscale(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def _upscale_if_needed(img: np.ndarray, target_min: int = 2000) -> np.ndarray:
    """Upscale small images so Tesseract has enough pixels to work with."""
    h, w = img.shape[:2]
    max_dim = max(h, w)
    if max_dim < 1000:
        scale = min(target_min / max_dim, 8.0)
        new_w, new_h = int(w * scale), int(h * scale)
        return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    return img


def _denoise(img: np.ndarray, strength: float = 5.0) -> np.ndarray:
    return cv2.fastNlMeansDenoising(
        img, None, h=strength, templateWindowSize=7, searchWindowSize=21
    )


def _apply_clahe(img: np.ndarray) -> np.ndarray:
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(img)


def _binarize(img: np.ndarray) -> np.ndarray:
    """Adaptive binarization - picks best method based on image content."""
    _, th_otsu = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    th_adapt = cv2.adaptiveThreshold(
        img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 5
    )
    # Use adaptive for high-contrast documents, Otsu for photos/scans
    local_std = np.std(cv2.GaussianBlur(img, (25, 25), 0).astype(np.float64))
    return th_adapt if local_std > 20 else th_otsu


def _deskew(img: np.ndarray) -> np.ndarray:
    """Correct slight rotation in scanned documents."""
    inverted = cv2.bitwise_not(img)
    coords = np.column_stack(np.where(inverted > 0))
    if len(coords) < 50:
        return img

    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) < 0.3 or abs(angle) > 15:
        return img

    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(
        img, M, (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=255
    )


def _morphological_clean(img: np.ndarray) -> np.ndarray:
    """Remove small noise dots via morphological opening."""
    kernel = np.ones((2, 2), np.uint8)
    inverted = cv2.bitwise_not(img)
    opened = cv2.morphologyEx(inverted, cv2.MORPH_OPEN, kernel)
    return cv2.bitwise_not(opened)


def preprocess_for_ocr(image_bgr: np.ndarray, aggressive: bool = False) -> np.ndarray:
    """
    Full preprocessing pipeline for Tesseract OCR.
    
    Args:
        image_bgr: Input BGR image
        aggressive: If True, apply stronger denoising and morphological cleaning
    """
    img = _to_grayscale(image_bgr)
    img = _upscale_if_needed(img)
    img = _denoise(img, strength=15.0 if aggressive else 5.0)
    img = _apply_clahe(img)
    img = _binarize(img)
    img = _deskew(img)

    if aggressive:
        img = _morphological_clean(img)

    return img
