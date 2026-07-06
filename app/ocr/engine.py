"""
Tesseract OCR engine wrapper with intelligent language selection.
"""
import pytesseract
import numpy as np
from app.config import DEFAULT_OCR_CONFIG, FALLBACK_OCR_CONFIG, configure_tesseract
from app.logging_config import get_logger

logger = get_logger("OCREngine")

configure_tesseract()


def available_languages() -> list[str]:
    """Returns a list of installed Tesseract traineddata languages."""
    try:
        return pytesseract.get_languages(config='')
    except Exception:
        return []


def run_ocr(image: np.ndarray, lang: str, config: str = None) -> dict:
    """
    Runs Tesseract OCR on the given image and returns structured results.
    Includes automatic PSM fallback if no text is found.
    """
    if config is None:
        config = DEFAULT_OCR_CONFIG

    try:
        data = pytesseract.image_to_data(
            image, lang=lang, config=config, output_type=pytesseract.Output.DICT
        )
    except Exception as e:
        raise RuntimeError(
            f"OCR execution failed. Ensure tesseract-ocr and language packs are installed. Details: {e}"
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

    # Fallback: try PSM 6 if no text found with default PSM
    if not full_text and config == DEFAULT_OCR_CONFIG:
        logger.info("No text found with default PSM, trying fallback PSM 6")
        return run_ocr(image, lang=lang, config=FALLBACK_OCR_CONFIG)

    mean_conf = sum(confidences) / len(confidences) if confidences else 0.0

    return {
        "text": full_text,
        "mean_confidence": mean_conf,
        "word_count": word_count
    }


def ocr_with_best_lang(image: np.ndarray) -> dict:
    """
    Runs OCR with 'eng', 'nep', and 'eng+nep' and returns the
    highest confidence result. This is the auto-detection strategy.
    """
    candidates = ["eng", "nep", "eng+nep"]
    best_result = None
    best_conf = -1.0

    for l in candidates:
        try:
            res = run_ocr(image, lang=l)
            if res["text"] and res["mean_confidence"] > best_conf:
                best_conf = res["mean_confidence"]
                best_result = res
        except Exception:
            continue

    if best_result is None:
        return {"text": "", "mean_confidence": 0.0, "word_count": 0}

    return best_result
