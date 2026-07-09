import re
from typing import List, Tuple

# Dangerous patterns to detect (prompt injection attempts)
DANGEROUS_PATTERNS = [
    # System override attempts
    r"(?i)ignore (all|previous|above) (instructions|prompts|rules)",
    r"(?i)from now on,? you (will|must|shall)",
    r"(?i)you are (now|going to) (an? |the )?(assistant|bot|model|ai)",
    r"(?i)pretend (you are|to be)",
    r"(?i)act as (if|though)",
    r"(?i)system:",
    r"(?i)user:",
    r"(?i)assistant:",
    
    # Role playing / jailbreak attempts
    r"(?i)do(n'?t)? (forget|remember)",
    r"(?i)output (the|your) (instructions|prompt|system prompt)",
    r"(?i)what (are|were|is|was) your (instructions|prompt|system prompt)",
    r"(?i)reveal (your|the) (prompt|instructions|system prompt)",
    
    # Command injection attempts
    r"(?i)simulate (being|acting as)",
    r"(?i)take on the role of",
    r"(?i)hypothetical scenario:?",
    
    # Data extraction attempts
    r"(?i)(tell|give|show) me (your|the) (secret|key|password|token)",
    r"(?i)ignore (safety|security|guidelines|restrictions)",
]

def detect_prompt_injection(text: str) -> Tuple[bool, List[str]]:
    """
    Check for prompt injection attempts.
    Returns (is_dangerous, detected_patterns)
    """
    detected = []
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, text):
            detected.append(pattern)
    
    return len(detected) > 0, detected


def sanitize_query(text: str) -> str:
    """Sanitize query by removing obvious injection attempts."""
    # Remove excessive special characters
    text = re.sub(r'[^\w\s.,?!\'"-]', '', text)
    
    # Limit length (500 chars is plenty for a question)
    if len(text) > 500:
        text = text[:500]
    
    return text.strip()


def validate_query(text: str) -> dict:
    """
    Full validation pipeline for user queries.
    Returns: {
        'valid': bool,
        'sanitized': str,
        'warnings': list,
        'error': str or None
    }
    """
    result = {
        'valid': True,
        'sanitized': text,
        'warnings': [],
        'error': None
    }
    
    # Empty check
    if not text or len(text.strip()) < 2:
        result['valid'] = False
        result['error'] = "Please ask a valid question."
        return result
    
    # Detect injection
    is_dangerous, patterns = detect_prompt_injection(text)
    if is_dangerous:
        result['valid'] = False
        result['error'] = "Your query contains content that cannot be processed."
        result['warnings'] = patterns
        return result
    
    # Sanitize
    result['sanitized'] = sanitize_query(text)
    
    return result