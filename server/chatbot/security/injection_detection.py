"""
Prompt injection heuristics — step 3/4 of the pipeline. This is a
best-effort *first line of defense* on the user's raw input; the real,
structural defense against injection (especially *indirect* injection
riding in through article content) lives in prompts/system_prompt.py,
which explicitly tells the model to treat retrieved content as data, not
instructions. No regex on the user's message can defend against a
malicious article — only prompt structure can.

Two confidence tiers, deliberately:

- HIGH_CONFIDENCE patterns are blocked immediately (no LLM call at all) —
  these are unambiguous attack phrasing with essentially no legitimate use
  in an HMIS documentation context ("ignore previous instructions", "reveal
  your system prompt", etc).
- WATCH patterns are logged as a security event for audit but do NOT block
  the request — the previous implementation's single-tier denylist had
  patterns broad enough to false-positive on completely normal questions
  (e.g. `r"(?i)do(n'?t)? (forget|remember)"` matches "what if I *forget*
  my password", which is an entirely reasonable thing to ask an HMIS help
  assistant). Blocking those would make the assistant actively worse at
  its actual job. Logging without blocking still gives visibility for
  tuning without breaking legitimate use.
"""
import logging
import re

logger = logging.getLogger('chatbot.security')

HIGH_CONFIDENCE_PATTERNS = [
    r'ignore (all|any|the|your)? ?(previous|prior|above)?\s*instructions',
    r'disregard (all|any|the|your)?\s*(previous|prior|above)?\s*(instructions|rules)',
    r'reveal (your|the)\s*(system\s*)?prompt',
    r'(show|print|output|repeat)\s*(me\s*)?(your|the)\s*(system\s*)?(prompt|instructions)',
    r'you are (now|no longer)\s*(an?\s*)?(admin|administrator|unrestricted|jailbroken|dan)',
    r'act as (an?\s*)?(admin|administrator|root|system)',
    r'pretend (to be|you are)\s*(an?\s*)?(admin|administrator)',
    r'developer mode',
    r'jailbreak',
    r'\bDAN\b.{0,20}\bmode\b',
    r'bypass (your|the)\s*(safety|security|restrictions?|filters?)',
    r'(return|show|dump)\s*(the\s*)?(env(ironment)?\s*variables?|secrets?|api\s*keys?)',
]

WATCH_PATTERNS = [
    r'forget (your|all)\s*(rules|instructions|training)',
    r'from now on',
    r'new instructions?:',
    r'system:\s',
]

_HIGH_CONFIDENCE_RE = [re.compile(p, re.IGNORECASE) for p in HIGH_CONFIDENCE_PATTERNS]
_WATCH_RE = [re.compile(p, re.IGNORECASE) for p in WATCH_PATTERNS]


def check_injection(text):
    """
    Returns (should_block: bool, matched_labels: list[str]).
    `matched_labels` is safe to log (it's the pattern category, not the
    user's raw text) — see log_security_event below for why we avoid
    logging full message content by default.
    """
    matched = []

    for pattern in _HIGH_CONFIDENCE_RE:
        if pattern.search(text):
            matched.append(f'high:{pattern.pattern[:40]}')

    if matched:
        return True, matched

    for pattern in _WATCH_RE:
        if pattern.search(text):
            matched.append(f'watch:{pattern.pattern[:40]}')

    return False, matched


def log_security_event(event_type, request, matched_labels=None, extra=None):
    """
    Structured security-event logging. Deliberately does NOT log the raw
    message content by default — logging every flagged message verbatim
    would itself be a sensitive-data-retention concern in a healthcare-
    adjacent product, even for synthetic KB content. `matched_labels` (the
    pattern category) is enough to tune detection later without retaining
    what the user actually typed.
    """
    payload = {
        'event': event_type,
        'ip': _get_client_ip(request),
        'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
        'matched': matched_labels or [],
    }
    if extra:
        payload.update(extra)
    logger.warning('chatbot_security_event', extra=payload)


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
