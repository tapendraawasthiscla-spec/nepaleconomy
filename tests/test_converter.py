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

def test_preeti_converter_basic():
    converter = get_converter("preeti")
    assert converter is not None
    
    # Test simple consonants
    assert converter.convert("k") == "क"
    assert converter.convert("v") == "ख"
    
    # Test numeral
    assert converter.convert("123") == "१२३"
    
def test_preeti_converter_i_matra():
    converter = get_converter("preeti")
    
    # Simple consonant: lk -> कि
    assert converter.convert("lk") == "कि"
    
    # Half consonant + full consonant: ls -> सि (s is स)
    # Wait, Preeti half s is S, full s is s. So "lSs" is "स्सि"
    assert converter.convert("lSs") == "स्सि"
    
    # Check that pre-rule moved 'l' appropriately: 
    # 'l' + 'S' (half) + 's' (full) -> 'Ssl' -> स् + स + ि -> स्सि
