"""
Tesseract OCR engine wrapper with multi-language support.
"""
import pytesseract
import numpy as np
from app.config import DEFAULT_OCR_CONFIG, configure_tesseract
from app.logging_config import get_logger

logger = get_logger("OCREngine")

configure_tesseract()


def available_languages() -> list[str]:
    """Returns installed Tesseract language packs."""
    try:
        return pytesseract.get_languages(config='')
    except Exception:
        return []


def run_ocr(image: np.ndarray, lang: str, config: str = None) -> dict:
    """
    Run Tesseract on an image and return structured results.
    """
    if config is None:
        config = DEFAULT_OCR_CONFIG

    try:
        data = pytesseract.image_to_data(
            image, lang=lang, config=config,
            output_type=pytesseract.Output.DICT
        )
    except Exception as e:
        raise RuntimeError(
            f"OCR failed. Ensure tesseract-ocr and lang packs are installed. Error: {e}"
        )

    n_boxes = len(data['level'])
    text_lines = []
    current_line = []
    confidences = []
    word_count = 0
    last_block = -1
    last_par = -1
    last_line = -1

    for i in range(n_boxes):
        word = data['text'][i].strip()
        conf = float(data['conf'][i])
        block_num = data['block_num'][i]
        par_num = data['par_num'][i]
        line_num = data['line_num'][i]

        if block_num != last_block or par_num != last_par:
            if current_line:
                text_lines.append(" ".join(current_line))
                current_line = []
            if text_lines and text_lines[-1] != "":
                text_lines.append("")
            last_block = block_num
            last_par = par_num
            last_line = line_num
        elif line_num != last_line:
            if current_line:
                text_lines.append(" ".join(current_line))
                current_line = []
            last_line = line_num

        if conf >= 0 and word:
            current_line.append(word)
            confidences.append(conf)
            word_count += 1

    if current_line:
        text_lines.append(" ".join(current_line))

    full_text = "\n".join(text_lines).strip()

    # Fallback: if no text found with PSM 3, try PSM 6 (uniform block)
    if not full_text and '--psm 3' in (config or ''):
        fallback_config = config.replace('--psm 3', '--psm 6')
        return run_ocr(image, lang=lang, config=fallback_config)

    mean_conf = sum(confidences) / len(confidences) if confidences else 0.0

    return {
        "text": full_text,
        "mean_confidence": round(mean_conf, 2),
        "word_count": word_count,
        "lang_used": lang,
    }


def ocr_with_best_lang(image: np.ndarray) -> dict:
    """
    Try multiple language combinations and return the best result.
    """
    langs_available = available_languages()
    
    candidates = []
    if "eng" in langs_available:
        candidates.append("eng")
    if "nep" in langs_available:
        candidates.append("nep")
    if "eng" in langs_available and "nep" in langs_available:
        candidates.append("eng+nep")
    
    if not candidates:
        candidates = ["eng"]

    best_result = None
    best_score = -1.0

    for lang in candidates:
        try:
            res = run_ocr(image, lang=lang)
        except Exception:
            continue

        # Score: confidence weighted by word count (more words = more reliable)
        score = res["mean_confidence"] * min(res["word_count"], 50) / 50.0
        if res["text"] and score > best_score:
            best_score = score
            best_result = res

    if best_result is None:
        return {"text": "", "mean_confidence": 0.0, "word_count": 0, "lang_used": "none"}

    return best_result
