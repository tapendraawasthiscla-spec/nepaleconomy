"""
Main FastAPI application entry point.
"""
import os
from fastapi import FastAPI, UploadFile, File, Form, Request
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

# 1. Create FastAPI app
app = FastAPI(title="TextExtract")

# 2. Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define startup event
@app.on_event("startup")
async def startup_event():
    configure_tesseract()
    langs = available_languages()
    logger.info(f"Available Tesseract languages: {langs}")
    
    if "nep" not in langs:
        logger.warning("CRITICAL: 'nep' language pack is NOT installed. Nepali OCR will fail.")

# 4. Define exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": "An internal server error occurred.", "error": str(exc)}
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.warning(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={"success": False, "detail": str(exc)}
    )

# 5. Define GET /api/health
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    langs = available_languages()
    return {"status": "ok", "languages": langs}

# 6. Define POST /api/extract
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
        
    logger.info(f"Processing file: {filename} ({size_mb:.2f} MB), lang: {lang}")
    
    try:
        if ext == ".pdf":
            result = await run_in_threadpool(extract_pdf, file_bytes, lang)
        elif ext == ".docx":
            result = await run_in_threadpool(extract_docx, file_bytes)
        else:
            result = await run_in_threadpool(extract_image, file_bytes, lang)
    except ValueError as e:
        raise e
    except Exception as e:
        raise Exception(f"Failed to process {ext} file: {str(e)}")
        
    text = result.pop("text", "")
    
    return {
        "success": True,
        "text": text,
        "filename": filename,
        "lang": lang,
        "meta": result
    }

# 7. Mount StaticFiles at "/" LAST
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    logger.warning(f"Frontend directory not found at {frontend_dir}. UI will not be served.")
