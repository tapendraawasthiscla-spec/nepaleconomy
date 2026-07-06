"""
Main FastAPI application entry point.
"""

import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool

from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, configure_tesseract
from app.ocr.engine import available_languages
from app.extract.pdf_handler import extract_pdf
from app.extract.docx_handler import extract_docx
from app.extract.image_handler import extract_image
from app.logging_config import get_logger

logger = get_logger("TextExtract")

app = FastAPI(title="TextExtract")

# CORS for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Frontend
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    logger.warning(f"Frontend directory not found at {frontend_dir}. UI will not be served.")

@app.on_event("startup")
async def startup_event():
    configure_tesseract()
    langs = available_languages()
    logger.info(f"Available Tesseract languages: {langs}")
    
    if "nep" not in langs:
        logger.warning("CRITICAL: 'nep' language pack is NOT installed. Nepali OCR will fail.")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Generic catch-all for unhandled server errors to prevent leaking stack traces."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": "An internal server error occurred.", "error": str(exc)}
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handles bad inputs and file parsing errors."""
    logger.warning(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={"success": False, "detail": str(exc)}
    )

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    langs = available_languages()
    return {"status": "ok", "languages": langs}

@app.post("/api/extract")
async def extract_api(
    file: UploadFile = File(...),
    lang: str = Form("auto")
):
    """
    Main extraction endpoint.
    Accepts PDF, DOCX, and images. Returns extracted text.
    """
    # Validate language
    if lang not in ["auto", "eng", "nep", "eng+nep"]:
        raise ValueError(f"Invalid language requested: {lang}")
        
    # Validate extension
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type {ext} not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}")
        
    # Read and validate size
    file_bytes = await file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    
    if size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(f"File size ({size_mb:.1f} MB) exceeds limit of {MAX_FILE_SIZE_MB} MB.")
        
    # Route to appropriate handler in a threadpool
    logger.info(f"Processing file: {filename} ({size_mb:.2f} MB), lang: {lang}")
    
    try:
        if ext == ".pdf":
            result = await run_in_threadpool(extract_pdf, file_bytes, lang)
        elif ext == ".docx":
            result = await run_in_threadpool(extract_docx, file_bytes)
        else:
            # Image formats
            result = await run_in_threadpool(extract_image, file_bytes, lang)
    except ValueError as e:
        # Re-raise ValueErrors to be caught by the exception handler
        raise e
    except Exception as e:
        # Wrap unknown processing errors
        raise Exception(f"Failed to process {ext} file: {str(e)}")
        
    text = result.pop("text", "")
    
    return {
        "success": True,
        "text": text,
        "filename": filename,
        "lang": lang,
        "meta": result
    }
