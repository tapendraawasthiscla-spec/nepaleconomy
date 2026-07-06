"""
PDF text extraction with legacy font conversion and OCR fallback.
"""
import fitz  # PyMuPDF
import numpy as np
from typing import Dict, Any

from app.legacy_fonts.converter import convert_legacy_text
from app.legacy_fonts.mappings import is_legacy_font
from app.ocr.preprocess import preprocess_for_ocr
from app.ocr.engine import ocr_with_best_lang, run_ocr
from app.config import PDF_RENDER_DPI
from app.logging_config import get_logger

logger = get_logger("PDFHandler")


def _pixmap_to_bgr(pix) -> np.ndarray:
    """Convert a PyMuPDF Pixmap to a BGR numpy array."""
    if pix.n >= 3:
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        if pix.n == 4:
            # RGBA -> BGR with alpha compositing on white background
            bgr = img[:, :, [2, 1, 0]]
            alpha = img[:, :, 3].astype(np.float64) / 255.0
            bg = np.ones_like(bgr, dtype=np.float64) * 255.0
            result = (bgr * alpha[..., None] + bg * (1.0 - alpha[..., None]))
            return np.clip(result, 0, 255).astype(np.uint8)
        else:
            return img[:, :, [2, 1, 0]].copy()
    else:
        gray = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w)
        return np.stack((gray,) * 3, axis=-1)


def _extract_page_text(page) -> tuple[str, set, bool, int]:
    """
    Extract text from a single PDF page, converting legacy fonts.
    Returns: (text, detected_fonts, had_legacy, char_count)
    """
    detected_fonts = set()
    had_legacy = False
    char_count = 0
    page_text_blocks = []

    page_dict = page.get_text("dict")

    for block in page_dict.get("blocks", []):
        if block.get("type") != 0:
            continue

        block_lines = []
        for line in block.get("lines", []):
            line_spans = []
            for span in line.get("spans", []):
                font_name = span.get("font", "Unknown")
                detected_fonts.add(font_name)
                raw_text = span.get("text", "")

                if is_legacy_font(font_name):
                    had_legacy = True
                    converted = convert_legacy_text(raw_text, font_name)
                    line_spans.append(converted)
                    char_count += len(converted.strip())
                else:
                    line_spans.append(raw_text)
                    char_count += len(raw_text.strip())

            block_lines.append("".join(line_spans))
        page_text_blocks.append("\n".join(block_lines))

    text = "\n\n".join(page_text_blocks).strip()
    return text, detected_fonts, had_legacy, char_count


def _ocr_page(page, lang: str) -> str:
    """Render page to image and run OCR."""
    pix = page.get_pixmap(dpi=PDF_RENDER_DPI)
    img_bgr = _pixmap_to_bgr(pix)
    clean_img = preprocess_for_ocr(img_bgr, aggressive=False)

    if lang == "auto":
        ocr_res = ocr_with_best_lang(clean_img)
    else:
        ocr_res = run_ocr(clean_img, lang)

    # If confidence is low, retry with aggressive preprocessing
    if 0 < ocr_res["mean_confidence"] < 55:
        clean_img_agg = preprocess_for_ocr(img_bgr, aggressive=True)
        if lang == "auto":
            ocr_res_agg = ocr_with_best_lang(clean_img_agg)
        else:
            ocr_res_agg = run_ocr(clean_img_agg, lang)
        if ocr_res_agg["mean_confidence"] > ocr_res["mean_confidence"]:
            ocr_res = ocr_res_agg

    return ocr_res["text"]


def extract_pdf(pdf_bytes: bytes, lang: str = "auto") -> Dict[str, Any]:
    """
    Extract text from PDF with legacy font conversion and OCR fallback.
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Failed to read PDF: {e}")

    full_text = []
    all_fonts = set()
    had_legacy = False
    methods = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)

        text, fonts, page_legacy, char_count = _extract_page_text(page)
        all_fonts.update(fonts)
        if page_legacy:
            had_legacy = True

        # If very little text extracted, fall back to OCR
        if char_count < 10:
            methods.append("ocr")
            ocr_text = _ocr_page(page, lang)
            full_text.append(ocr_text)
        else:
            methods.append("text_layer")
            full_text.append(text)

    doc.close()

    final_text = "\n\n--- Page Break ---\n\n".join(full_text)

    return {
        "text": final_text,
        "pages": len(methods),
        "method_per_page": methods,
        "had_legacy_fonts": had_legacy,
        "detected_fonts": list(all_fonts),
    }
