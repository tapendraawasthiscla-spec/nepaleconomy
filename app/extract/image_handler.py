"""
Image text extraction via OCR.
"""
from typing import Dict, Any

from app.ocr.preprocess import load_image_bytes, preprocess_for_ocr
from app.ocr.engine import ocr_with_best_lang, run_ocr


def extract_image(image_bytes: bytes, lang: str = "auto") -> Dict[str, Any]:
    """Extract text from images using preprocessing + Tesseract OCR."""
    try:
        image_bgr = load_image_bytes(image_bytes)
    except Exception as e:
        raise ValueError(f"Failed to load image: {e}")

    # First pass: standard preprocessing
    clean_img = preprocess_for_ocr(image_bgr, aggressive=False)

    if lang == "auto":
        res = ocr_with_best_lang(clean_img)
    else:
        res = run_ocr(clean_img, lang)

    # If confidence is low, retry with aggressive preprocessing
    if 0 < res["mean_confidence"] < 55:
        clean_agg = preprocess_for_ocr(image_bgr, aggressive=True)
        if lang == "auto":
            res_agg = ocr_with_best_lang(clean_agg)
        else:
            res_agg = run_ocr(clean_agg, lang)
        if res_agg["mean_confidence"] > res["mean_confidence"]:
            res = res_agg

    return {
        "text": res["text"],
        "mean_confidence": res["mean_confidence"],
        "method": "ocr",
        "lang_used": res.get("lang_used", lang),
    }
