"""
Core conversion engine for legacy Nepali fonts to Unicode.
"""

import re
from typing import Optional
from app.legacy_fonts.mappings import FONT_MAPS


class PreetiConverter:
    """
    High-performance rule-based converter for mapping legacy Nepali ASCII fonts 
    to Unicode Devanagari.
    """
    def __init__(self, mapping: dict):
        self.pre_rules = [(re.compile(p), r) for p, r in mapping.get("pre_rules", [])]
        self.post_rules = [(re.compile(p), r) for p, r in mapping.get("post_rules", [])]
        
        char_map = mapping.get("char_map", {})
        self.char_map = char_map
        
        if char_map:
            # Sort keys by length descending to match longest tokens first (O(n) linear scan)
            sorted_keys = sorted(char_map.keys(), key=len, reverse=True)
            # Escape keys for regex
            escaped_keys = map(re.escape, sorted_keys)
            pattern = "|".join(escaped_keys)
            self.char_regex = re.compile(pattern)
        else:
            self.char_regex = None

    def convert(self, text: str) -> str:
        """
        Converts a legacy font string to Unicode in a 3-stage pipeline.
        """
        if not text:
            return text
            
        # STAGE 1: PRE-RULES
        for pattern, replacement in self.pre_rules:
            text = pattern.sub(replacement, text)
            
        # STAGE 2: CHARACTER MAP
        if self.char_regex:
            text = self.char_regex.sub(lambda m: self.char_map[m.group(0)], text)
            
        # STAGE 3: POST-RULES
        for pattern, replacement in self.post_rules:
            text = pattern.sub(replacement, text)
            
        return text


def get_converter(font_name: str) -> Optional[PreetiConverter]:
    """
    Returns a PreetiConverter instance for the given font name, or None if unknown.
    """
    font_key = font_name.lower().strip()
    # Handle embedded font suffixes (e.g., Preeti-Bold -> preeti)
    for known_font, mapping in FONT_MAPS.items():
        if known_font in font_key:
            return PreetiConverter(mapping)
    return None


def is_legacy_font(font_name: str) -> bool:
    """
    Checks if the font name matches known legacy Nepali fonts.
    """
    if not font_name:
        return False
    font_key = font_name.lower()
    known_legacy = ["preeti", "kantipur", "sagarmatha", "himali", "pcs"]
    return any(legacy in font_key for legacy in known_legacy)


def smart_convert(text: str, font_name: str) -> str:
    """
    Converts text if the font is a legacy font. Otherwise returns text unchanged.
    Leaves ASCII English words/numbers alone if the font isn't explicitly legacy.
    Note: If font IS legacy, all text in that span is converted.
    """
    if not is_legacy_font(font_name):
        return text
        
    converter = get_converter(font_name)
    if converter:
        return converter.convert(text)
    
    return text
