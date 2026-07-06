import pytest
from app.legacy_fonts.converter import get_converter, is_legacy_font, smart_convert


def test_is_legacy_font():
    assert is_legacy_font("Preeti") is True
    assert is_legacy_font("preeti-bold") is True
    assert is_legacy_font("Kantipur") is True
    assert is_legacy_font("Sagarmatha") is True
    assert is_legacy_font("Himali") is True

    assert is_legacy_font("Arial") is False
    assert is_legacy_font("Mangal") is False
    assert is_legacy_font("") is False
    assert is_legacy_font(None) is False


def test_smart_convert_non_legacy():
    text = "Hello World 123"
    assert smart_convert(text, "Arial") == text
    assert smart_convert(text, "Mangal") == text


def test_preeti_converter_exists():
    converter = get_converter("preeti")
    assert converter is not None


def test_preeti_numerals():
    converter = get_converter("preeti")
    assert converter is not None
    result = converter.convert("123")
    # Preeti maps 1->१, 2->२, 3->३
    assert "१" in result or "२" in result or "३" in result
