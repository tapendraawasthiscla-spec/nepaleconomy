"""
DOCX text extraction with legacy font conversion.
"""
import io
from typing import Dict, Any
import docx

from app.legacy_fonts.converter import convert_legacy_text
from app.legacy_fonts.mappings import is_legacy_font


def extract_docx(docx_bytes: bytes) -> Dict[str, Any]:
    """Extract text from DOCX, converting legacy Nepali fonts."""
    try:
        doc = docx.Document(io.BytesIO(docx_bytes))
    except Exception as e:
        raise ValueError(f"Failed to read DOCX: {e}")

    detected_fonts = set()
    had_legacy = False
    text_blocks = []

    def _process_paragraph(p) -> str:
        nonlocal had_legacy

        para_font = None
        if p.style and p.style.font and p.style.font.name:
            para_font = p.style.font.name

        parts = []
        for run in p.runs:
            raw = run.text
            if not raw:
                continue

            font_name = (run.font.name if run.font and run.font.name else para_font)
            if font_name:
                detected_fonts.add(font_name)

            if font_name and is_legacy_font(font_name):
                had_legacy = True
                parts.append(convert_legacy_text(raw, font_name))
            else:
                if font_name is None:
                    detected_fonts.add("(default)")
                parts.append(raw)

        return "".join(parts)

    # Extract paragraphs
    for p in doc.paragraphs:
        text_blocks.append(_process_paragraph(p))

    # Extract tables
    for table in doc.tables:
        for row in table.rows:
            row_cells = []
            for cell in row.cells:
                cell_parts = []
                for p in cell.paragraphs:
                    cell_parts.append(_process_paragraph(p))
                row_cells.append(" ".join(cell_parts).strip())
            text_blocks.append(" | ".join(row_cells))

    return {
        "text": "\n".join(text_blocks).strip(),
        "had_legacy_fonts": had_legacy,
        "detected_fonts": list(detected_fonts),
    }
