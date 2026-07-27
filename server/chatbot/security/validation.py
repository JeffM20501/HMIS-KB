"""
Input validation — step 2 of the pipeline, and deliberately the FIRST real
check that runs (before injection detection, before touching the DB/LLM).

Fixes a real bug in the code this replaces: the old `validate_query()`
returned a dict, and the call site did `if not validate_query(question):`
— a dict is always truthy, so that check never actually rejected anything,
ever. Here, `validate_message()` returns a plain (is_valid: bool, error:
str | None) tuple specifically so that mistake can't happen again.
"""

MIN_LENGTH = 1
MAX_LENGTH = 1000  # generous for a real question, short enough to block token-flooding/DoS attempts


def validate_message(text):
    """
    Returns (is_valid, error_message). Checked first and cheaply — before
    any embedding/DB/LLM work — so a malformed or oversized request is
    rejected without spending any real resources on it.
    """
    if text is None:
        return False, 'A message is required.'

    text = text.strip()

    if len(text) < MIN_LENGTH:
        return False, 'A message is required.'

    if len(text) > MAX_LENGTH:
        return False, f'Message is too long (max {MAX_LENGTH} characters).'

    # Repeated-character flooding (e.g. "aaaaaaaa...") wastes embedding/LLM
    # cycles without being a real question — cheap to catch before it goes
    # any further.
    if _is_mostly_repeated_characters(text):
        return False, 'Message does not appear to contain a valid question.'

    return True, None


def _is_mostly_repeated_characters(text, threshold=0.6):
    if len(text) < 20:
        return False
    most_common_count = max(text.count(c) for c in set(text))
    return (most_common_count / len(text)) > threshold


def sanitize_message(text):
    """Light normalization only — real defense is structural (see prompts/system_prompt.py),
    not stripping characters out of the user's message."""
    return ' '.join((text or '').strip().split())[:MAX_LENGTH]
