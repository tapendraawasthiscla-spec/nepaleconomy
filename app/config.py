"""
Configuration constants and startup setup for the TextExtract backend.
"""

import os
import pytesseract

# File limitations
MAX_FILE_SIZE_MB: int = 25
ALLOWED_EXTENSIONS: set[str] = {
    ".pdf",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
    ".tiff",
    ".bmp",
    ".webp"
}

# Tesseract resolution
TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
DEFAULT_OCR_CONFIG: str = r'--oem 1 --psm 3'


def configure_tesseract() -> None:
    """
    Configures the Tesseract command path for pytesseract.
    This should be called during application startup.
    """
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
