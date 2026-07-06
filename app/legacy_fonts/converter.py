"""
Core conversion engine for legacy Nepali fonts to Unicode.
"""
import re
from typing import Optional
from functools import lru_cache
from app.legacy_fonts.mappings import FONT_REGISTRY, SHARED_POST_RULES


class LegacyFontConverter:
    """
    High-performance rule-based converter for mapping legacy Nepali ASCII fonts 
    to Unicode Devanagari using a 2-stage (char map -> post rules) pipeline.
    """
    def __init__(self, char_map: dict, post_rules: list):
        self.char_map = char_map
        self.post_rules = [(re.compile(p), r) for p, r in post_rules]
        
        # Sort keys by length descending to match longest tokens first
        sorted_keys = sorted(char_map.keys(), key=len, reverse=True)
        # Escape keys for regex
        escaped_keys = map(re.escape, sorted_keys)
        pattern = "|".join(escaped_keys)
        self.char_regex = re.compile(pattern)

    def convert(self, text: str) -> str:
        """
        Converts a legacy font string to Unicode.
        """
        if not text:
            return text
            
        # STAGE 1: Character Map Substitution
        text = self.char_regex.sub(lambda m: self.char_map[m.group(0)], text)
            
        # STAGE 2: Post-Rules
        for pattern, replacement in self.post_rules:
            text = pattern.sub(replacement, text)
            
        return text


@lru_cache(maxsize=32)
def get_converter(font_name: str) -> Optional[LegacyFontConverter]:
    """
    Returns a cached LegacyFontConverter instance for the given font name, or None.
    """
    font_key = font_name.lower().strip()
    for known_font, mapping in FONT_REGISTRY.items():
        if known_font in font_key:
            return LegacyFontConverter(mapping, SHARED_POST_RULES)
    return None


def is_legacy_font(font_name: str) -> bool:
    """
    Checks if the font name matches known legacy Nepali fonts.
    """
    if not font_name:
        return False
    font_key = font_name.lower()
    return any(legacy in font_key for legacy in FONT_REGISTRY.keys())


def convert_legacy_text(text: str, font_name: str) -> str:
    """
    Main entry point for converting text based on font detection.
    """
    converter = get_converter(font_name)
    if converter:
        return converter.convert(text)
    return text

# Alias for backwards compatibility with previous prompt
smart_convert = convert_legacy_text
