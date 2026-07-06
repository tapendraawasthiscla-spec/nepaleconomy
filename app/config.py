"""
Configuration constants and startup setup for the TextExtract backend.
"""
import os
import pytesseract

# File limitations
MAX_FILE_SIZE_MB: int = 25
ALLOWED_EXTENSIONS: set[str] = {
    ".pdf", ".docx", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"
}

# Tesseract config
TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")

# OEM 1 = LSTM only (best for Devanagari), PSM 3 = fully automatic
DEFAULT_OCR_CONFIG: str = r'--oem 1 --psm 3'

# Higher DPI for PDF-to-image rendering (better OCR accuracy)
PDF_RENDER_DPI: int = 300


def configure_tesseract() -> None:
    """Configure the Tesseract command path."""
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
