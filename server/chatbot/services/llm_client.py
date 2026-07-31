"""
Groq chat-completions client with an in-process fallback chain.

Replaces the old code's list of HF Inference API models
(google/flan-t5-large, microsoft/phi-2, tiiuae/falcon-7b,
mistralai/Mistral-7B-v0.1) — most of those are no longer served on HF's
free serverless tier at all, and the ones that are aren't good
instruction-followers for grounded QA. See the research writeup for the
provider comparison that led to Groq.

Primary model: llama-3.3-70b-versatile (best grounded-answer quality —
matters most here). Falls back to llama-3.1-8b-instant (much higher free
daily quota) only on a 429/rate-limit response from the primary, not on
every request — the old code's "try each model in a list until one works"
pattern masked real failures; here a fallback only fires for the specific,
expected condition (quota exhausted), and any other error is raised so it
surfaces properly instead of being silently swallowed.
"""
import logging
import os

from django.conf import settings

logger = logging.getLogger('chatbot')

PRIMARY_MODEL = 'llama-3.3-70b-versatile'
FALLBACK_MODEL = 'llama-3.1-8b-instant'
REQUEST_TIMEOUT = 20  # seconds — a chat request should fail fast, not hang


class LLMUnavailableError(Exception):
    """Raised when neither the primary nor fallback model could serve the request."""


def _get_client():
    from groq import Groq

    api_key = getattr(settings, 'GROQ_API_KEY', None) or os.environ.get('GROQ_API_KEY')
    if not api_key:
        raise LLMUnavailableError('GROQ_API_KEY is not configured.')
    return Groq(api_key=api_key, timeout=REQUEST_TIMEOUT)


def _call_model(client, model, messages, temperature, max_tokens, stream):
    return client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=stream,
    )


def generate_answer(messages, temperature=0.2, max_tokens=600, stream=False):
    """
    `messages` is an OpenAI-style list of {role, content} dicts (system +
    history + current question — see prompts/system_prompt.py and
    rag_pipeline.py for how it's assembled).

    Low temperature (0.2) is deliberate: this is a grounded-QA assistant,
    not a creative-writing one — we want it to stick closely to the
    retrieved context rather than embellish.

    Returns either a plain string (stream=False) or a generator yielding
    text deltas (stream=True) — see views/chatbot_views.py for how each is
    consumed.
    """
    from groq import APIStatusError, APIConnectionError, APITimeoutError

    client = _get_client()

    try:
        response = _call_model(client, PRIMARY_MODEL, messages, temperature, max_tokens, stream)
        return response if stream else response.choices[0].message.content
    except APIStatusError as e:
        if e.status_code != 429:
            logger.error('llm_primary_error', extra={'model': PRIMARY_MODEL, 'status': e.status_code})
            raise LLMUnavailableError(f'{PRIMARY_MODEL} returned {e.status_code}') from e
        logger.warning('llm_primary_rate_limited', extra={'model': PRIMARY_MODEL})
    except (APIConnectionError, APITimeoutError) as e:
        logger.warning('llm_primary_unreachable', extra={'model': PRIMARY_MODEL, 'error': str(e)})

    # Fallback — only reached on rate-limit or connectivity failure of the primary.
    try:
        response = _call_model(client, FALLBACK_MODEL, messages, temperature, max_tokens, stream)
        return response if stream else response.choices[0].message.content
    except Exception as e:
        logger.error('llm_fallback_error', extra={'model': FALLBACK_MODEL, 'error': str(e)})
        raise LLMUnavailableError('Both primary and fallback models failed.') from e


def stream_to_text_chunks(stream_response):
    """Yields text deltas from a Groq streaming response for StreamingHttpResponse."""
    for chunk in stream_response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
