"""
Configuration constants and startup setup for the TextExtract backend.
"""

import os
import pytesseract

MAX_FILE_SIZE_MB: int = 25
ALLOWED_EXTENSIONS: set[str] = {
    ".pdf", ".docx", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"
}

TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
DEFAULT_DPI: int = 300

# OEM 1 = LSTM only (best for accuracy with tessdata_best)
# PSM 3 = Fully automatic page segmentation (default)
DEFAULT_OCR_CONFIG: str = r'--oem 1 --psm 3'
# PSM 6 = Assume a single uniform block of text
FALLBACK_OCR_CONFIG: str = r'--oem 1 --psm 6'
# PSM 4 = Assume a single column of text of variable sizes
COLUMN_OCR_CONFIG: str = r'--oem 1 --psm 4'


def configure_tesseract() -> None:
    """Configure the Tesseract command path for pytesseract."""
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
