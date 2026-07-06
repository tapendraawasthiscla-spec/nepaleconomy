# TextExtract

TextExtract is a high-accuracy text-extraction web app backend. 
It extracts human-readable text from PDFs, DOCX, and images in both English and Nepali. 
This project uses strictly classical OCR (Tesseract) and rule-based legacy-font (Preeti/Kantipur/etc.) to Unicode conversion without any AI/LLM/cloud recognition components.

## System Dependencies

This application requires the following system packages to be installed on the host machine:
- `tesseract-ocr`
- `tesseract-ocr-nep`
- `tesseract-ocr-eng`
- `poppler-utils`

*(These are also listed in `packages.txt` for deployment platforms that support automatic installation.)*

## Running Locally

1. Create and activate a Python 3.11+ virtual environment.
2. Install the python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoint Contract

**POST `/api/extract`**
Extracts text from the uploaded file.

- **Payload:** `multipart/form-data`
  - `file`: The file to be extracted (PDF, DOCX, PNG, JPG, JPEG, TIFF, BMP, WEBP).
  - `lang` *(optional)*: Language to use for OCR. Valid options: `auto`, `eng`, `nep`, `eng+nep`. Defaults to `auto`.

- **Response:**
  Returns a JSON payload with the extracted text.
