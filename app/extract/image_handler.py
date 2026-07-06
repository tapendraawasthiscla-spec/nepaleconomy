"""
Image handler utilizing preprocessing and Tesseract OCR.
"""
from typing import Dict, Any

from app.ocr.preprocess import load_image_bytes, preprocess_for_ocr
from app.ocr.engine import ocr_with_best_lang, run_ocr
from app.logging_config import get_logger

logger = get_logger("ImageHandler")

# Confidence threshold below which we try aggressive preprocessing
LOW_CONFIDENCE_THRESHOLD = 55.0


def extract_image(image_bytes: bytes, lang: str = "auto") -> Dict[str, Any]:
    """
    Extracts text from images using classical preprocessing and OCR.
    Uses a two-pass strategy: normal preprocessing first, then aggressive if confidence is low.
    """
    try:
        image_bgr = load_image_bytes(image_bytes)
    except Exception as e:
        raise ValueError(f"Failed to process image: {e}")

    # Pass 1: Normal preprocessing
    clean_img = preprocess_for_ocr(image_bgr, aggressive=False)

    if lang == "auto":
        res = ocr_with_best_lang(clean_img)
    else:
        res = run_ocr(clean_img, lang)

    # Pass 2: If confidence is low and we got some text, try aggressive
    if 0 < res["mean_confidence"] < LOW_CONFIDENCE_THRESHOLD:
        logger.info(f"Low confidence ({res['mean_confidence']:.1f}), trying aggressive preprocessing")
        clean_img_agg = preprocess_for_ocr(image_bgr, aggressive=True)

        if lang == "auto":
            res_agg = ocr_with_best_lang(clean_img_agg)
        else:
            res_agg = run_ocr(clean_img_agg, lang)

        if res_agg["mean_confidence"] > res["mean_confidence"]:
            res = res_agg

    return {
        "text": res["text"],
        "mean_confidence": res["mean_confidence"],
        "method": "ocr"
    }
