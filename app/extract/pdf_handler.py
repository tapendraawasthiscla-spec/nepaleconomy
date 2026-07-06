"""
PDF handler utilizing PyMuPDF (fitz) and Tesseract OCR fallback.
"""
import fitz
from typing import Dict, Any
import numpy as np

from app.legacy_fonts.converter import convert_legacy_text, is_legacy_font
from app.ocr.preprocess import preprocess_for_ocr
from app.ocr.engine import ocr_with_best_lang, run_ocr
from app.logging_config import get_logger

logger = get_logger("PDFHandler")

# Minimum characters on a page to consider it has a usable text layer
MIN_CHAR_COUNT_FOR_TEXT_LAYER = 10


def _pixmap_to_bgr(pix) -> np.ndarray:
    """Convert a PyMuPDF Pixmap to a BGR numpy array, handling alpha channels."""
    if pix.n >= 3:
        img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        if pix.n == 4:
            # RGBA -> BGR with alpha compositing onto white background
            bgr = img_array[:, :, [2, 1, 0]]
            alpha = img_array[:, :, 3].astype(np.float64) / 255.0
            bg = np.ones_like(bgr, dtype=np.float64) * 255.0
            img_bgr = (bgr.astype(np.float64) * alpha[..., None] + bg * (1.0 - alpha[..., None])).astype(np.uint8)
        else:
            img_bgr = img_array[:, :, [2, 1, 0]]
    else:
        # Grayscale
        img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w)
        img_bgr = np.stack((img_array,) * 3, axis=-1)
    return img_bgr


def extract_pdf(pdf_bytes: bytes, lang: str = "auto") -> Dict[str, Any]:
    """
    Extracts text from a PDF.
    Strategy:
    1. Try text layer extraction with legacy font conversion
    2. Fall back to OCR if the text layer is sparse
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Failed to read PDF file: {e}")

    full_text = []
    detected_fonts = set()
    had_legacy = False
    methods = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)

        page_dict = page.get_text("dict")
        page_text_lines = []
        char_count = 0

        for block in page_dict.get("blocks", []):
            if block.get("type") == 0:  # Text block
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
                page_text_lines.append("\n".join(block_lines))

        extracted_page_text = "\n\n".join(page_text_lines).strip()

        if char_count < MIN_CHAR_COUNT_FOR_TEXT_LAYER:
            # Fall back to OCR
            methods.append("ocr")
            pix = page.get_pixmap(dpi=300)
            img_bgr = _pixmap_to_bgr(pix)

            clean_img = preprocess_for_ocr(img_bgr, aggressive=False)

            if lang == "auto":
                ocr_res = ocr_with_best_lang(clean_img)
            else:
                ocr_res = run_ocr(clean_img, lang)

            full_text.append(ocr_res["text"])
        else:
            methods.append("text_layer")
            full_text.append(extracted_page_text)

    doc.close()

    final_text = "\n\n--- Page Break ---\n\n".join(full_text)

    return {
        "text": final_text,
        "pages": len(methods),
        "method_per_page": methods,
        "had_legacy_fonts": had_legacy,
        "detected_fonts": list(detected_fonts)
    }
