"""
Mapping definitions for legacy Nepali fonts to Unicode.
Each map contains:
- pre_rules: List of (regex_pattern, replacement) applied to raw text.
- char_map: Dictionary of Preeti tokens to Unicode strings.
- post_rules: List of (regex_pattern, replacement) applied after character mapping.
"""

PREETI_MAP = {
    "pre_rules": [
        # Move 'i' matra (l in Preeti) to after the consonant cluster.
        # Matches 'l' followed by any sequence of half-consonants/symbols and one full consonant.
        (r'l([A-Z\{\}\[\]\|]*(?:[a-z0-9\+\-\=\_\;\:\'\"\,\.\/\<\>\?\!\@\#\$\%\^\&\*\(\)\~]))', r'\1l'),
    ],
    "char_map": {
        "a": "ब", "b": "द", "c": "अ", "d": "म", "e": "भ", "f": "ा", "g": "न", "h": "ज", 
        "i": "ष", "j": "व", "k": "क", "l": "ि", "m": "ु", "n": "ल", "o": "य", "p": "उ", 
        "q": "त्र", "r": "च", "s": "स", "t": "त", "u": "ग", "v": "ख", "w": "ध", "x": "ह", 
        "y": "थ", "z": "श", 
        "A": "ब्", "B": "द्", "C": "ऋ", "D": "म्", "E": "भ्", "F": "ँ", "G": "न्", "H": "ज्", 
        "I": "क्ष", "J": "व्", "K": "क्", "L": "ी", "M": "ू", "N": "ल्", "O": "इ", "P": "ए", 
        "Q": "त्त", "R": "च्", "S": "स्", "T": "त्", "U": "ग्", "V": "ख्", "W": "ध्", "X": "ह्", 
        "Y": "थ्", "Z": "श्",
        "0": "०", "1": "१", "2": "२", "3": "३", "4": "४", "5": "५", "6": "६", "7": "७", "8": "८", "9": "९",
        "`": "ञ", "~": "ञ्", "!": "ज्ञ", "@": "द्द", "#": "घ", "$": "द्ध", "%": "छ", "^": "ट", 
        "&": "ठ", "*": "ड", "(": "ढ", ")": "ण", "-": "(", "_": ")", "=": ".", "+": "ं", 
        "\\": "्", "|": "र्", "[": "ृ", "{": "र्द", "]": "े", "}": "ै", ";": "ँ", ":": "ट्ठ", 
        "'": "ु", "\"": "ू", ",": ",", "<": "?", ".": "।", ">": "श्र", "/": "र", "?": "रु",
        "æ": "“", "Æ": "”", "÷": "/", "×": "×", "ˆ": "क्क", "ß": "द्व", "µ": "ट्ठ",
        # Common multi-char tokens can be added here if needed.
    },
    "post_rules": [
        # Correct Reph placement (Reph 'र्' often appears after the matra instead of before)
        (r'([क-ह])([ा-ौ])?र्', r'र्\1\2'),
        # Correct Nukta placement
        (r'([क-ह])([ा-ौ])?़', r'\1़\2'),
        # Fix halant + zero width joiner if any isolated halants remain
        (r'् ', r'् '),
    ]
}

KANTIPUR_MAP = {
    "pre_rules": [],
    "char_map": {},
    "post_rules": []
}

SAGARMATHA_MAP = {
    "pre_rules": [],
    "char_map": {},
    "post_rules": []
}

FONT_MAPS = {
    "preeti": PREETI_MAP,
    "kantipur": KANTIPUR_MAP,
    "sagarmatha": SAGARMATHA_MAP,
}
