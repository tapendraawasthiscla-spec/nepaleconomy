"""
Image preprocessing utilities to maximize OCR accuracy.
Uses classical OpenCV techniques only (no AI/ML).
"""
import cv2
import numpy as np


def load_image_bytes(data: bytes) -> np.ndarray:
    """
    Decodes uploaded bytes to a BGR numpy array safely.
    Handles single-channel, RGB, and RGBA images.
    """
    np_arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("Failed to decode image bytes.")

    if len(img.shape) == 2:
        # Grayscale -> BGR
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif len(img.shape) == 3 and img.shape[2] == 4:
        # RGBA -> BGR with alpha compositing on white
        bgr = img[:, :, :3]
        alpha = img[:, :, 3].astype(np.float64) / 255.0
        bg = np.ones_like(bgr, dtype=np.float64) * 255.0
        out = bgr.astype(np.float64) * alpha[..., None] + bg * (1.0 - alpha[..., None])
        img = np.clip(out, 0, 255).astype(np.uint8)

    return img


def _to_grayscale(img: np.ndarray) -> np.ndarray:
    """Convert to grayscale if needed."""
    if len(img.shape) == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def _upscale_if_needed(img: np.ndarray, target_min_dim: int = 2000) -> np.ndarray:
    """Upscale small images for better OCR. Tesseract works best at 300+ DPI."""
    h, w = img.shape[:2]
    max_dim = max(h, w)
    if max_dim < 1000:
        scale = min(target_min_dim / max_dim, 4.0)
        new_w = int(w * scale)
        new_h = int(h * scale)
        return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    return img


def _denoise(img: np.ndarray, aggressive: bool) -> np.ndarray:
    """Apply Non-Local Means Denoising."""
    h_val = 12.0 if aggressive else 5.0
    return cv2.fastNlMeansDenoising(
        img, None, h=h_val, templateWindowSize=7, searchWindowSize=21
    )


def _apply_clahe(img: np.ndarray) -> np.ndarray:
    """Contrast Limited Adaptive Histogram Equalization for local contrast enhancement."""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(img)


def _binarize(img: np.ndarray) -> np.ndarray:
    """
    Adaptive binarization: chooses between Otsu and adaptive thresholding
    based on local variance of the image.
    """
    _, th_otsu = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    th_adapt = cv2.adaptiveThreshold(
        img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 5
    )
    # Use local standard deviation to decide
    blur = cv2.GaussianBlur(img, (25, 25), 0)
    local_std = np.std(blur.astype(np.float64))
    return th_adapt if local_std > 20 else th_otsu


def _deskew(img: np.ndarray) -> np.ndarray:
    """Correct skew using minimum area rectangle on text pixels."""
    inverted = cv2.bitwise_not(img)
    coords = np.column_stack(np.where(inverted > 0))
    if len(coords) < 100:
        return img

    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) > 0.3:
        h, w = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        img = cv2.warpAffine(
            img, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=255
        )
    return img


def _morphological_clean(img: np.ndarray) -> np.ndarray:
    """Remove small noise using morphological opening."""
    kernel = np.ones((2, 2), np.uint8)
    inverted = cv2.bitwise_not(img)
    opened = cv2.morphologyEx(inverted, cv2.MORPH_OPEN, kernel)
    return cv2.bitwise_not(opened)


def _remove_borders(img: np.ndarray) -> np.ndarray:
    """Remove dark borders that can confuse OCR."""
    h, w = img.shape[:2]
    border = int(min(h, w) * 0.02)
    if border < 2:
        return img
    # Check if borders are significantly darker than center
    top = np.mean(img[:border, :])
    bottom = np.mean(img[-border:, :])
    left = np.mean(img[:, :border])
    right = np.mean(img[:, -border:])
    center = np.mean(img[border:-border, border:-border])

    if center - min(top, bottom, left, right) > 50:
        img[:border, :] = 255
        img[-border:, :] = 255
        img[:, :border] = 255
        img[:, -border:] = 255
    return img


def preprocess_for_ocr(image_bgr: np.ndarray, aggressive: bool = False) -> np.ndarray:
    """
    Full pipeline to clean and optimize an image for Tesseract OCR.
    
    Pipeline:
    1. Grayscale conversion
    2. Upscaling (if image is small)
    3. Denoising
    4. CLAHE contrast enhancement
    5. Binarization (adaptive Otsu/adaptive threshold)
    6. Border removal
    7. Deskewing
    8. Morphological cleaning (aggressive mode only)
    """
    img = _to_grayscale(image_bgr)
    img = _upscale_if_needed(img)
    img = _denoise(img, aggressive)
    img = _apply_clahe(img)
    img = _binarize(img)
    img = _remove_borders(img)
    img = _deskew(img)

    if aggressive:
        img = _morphological_clean(img)

    return img
