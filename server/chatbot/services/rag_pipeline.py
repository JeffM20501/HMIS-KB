"""
Orchestrates the full RAG flow end to end. Each numbered step below maps
directly to the pipeline in the task spec:

 1. user question           -> passed in as `raw_message`
 2. input validation        -> security.validation.validate_message
 3-4. injection detection   -> security.injection_detection.check_injection
 5. query preprocessing     -> security.validation.sanitize_message
 6. embedding generation    -> services.embedding_service.embed_query (inside retrieval)
 7. vector similarity search -> services.retrieval.retrieve_relevant_chunks
 8. retrieve top-k chunks   -> (same call, top_k param)
 9. context ranking         -> services.retrieval.rank_and_dedupe_by_article
10. prompt construction     -> prompts.system_prompt.build_messages
11. LLM response            -> services.llm_client.generate_answer
12. output validation       -> _validate_output (below)
13. return final answer     -> RAGResult returned to the view

This module has no heavy per-call initialization — embedding_service and
llm_client are both module-level singletons/lazy clients, so constructing
a fresh pipeline object per request (unlike the old `RAGPipeline.__init__`,
which rebuilt DB/HTTP clients on every single call) is now cheap.
"""
import logging
import time
from dataclasses import dataclass, field

from chatbot.prompts.system_prompt import build_messages
from chatbot.security.injection_detection import check_injection, log_security_event
from chatbot.security.validation import sanitize_message, validate_message
from chatbot.services.llm_client import LLMUnavailableError, generate_answer
from chatbot.services.retrieval import rank_and_dedupe_by_article, retrieve_relevant_chunks

logger = logging.getLogger('chatbot')

MAX_HISTORY_TURNS = 3  # 3 user+assistant pairs = 6 messages — see the memory-architecture writeup
BLOCKED_RESPONSE = (
    "I can't help with that request. I'm only able to answer questions about TaifaCare "
    "documentation and procedures."
)
NO_CONTEXT_RESPONSE = (
    "I couldn't find anything about that in the knowledge base. You might try rephrasing your "
    "question, or reach out to your facility's IT support or a supervisor for help."
)


@dataclass
class RAGResult:
    answer: str
    sources: list = field(default_factory=list)  # [{article, similarity}, ...]
    blocked: bool = False
    escalate_suggested: bool = False
    latency_seconds: float = 0.0


def _build_history_messages(chat_log_queryset):
    """Takes the last MAX_HISTORY_TURNS ChatLog rows (oldest first) and
    turns them into alternating user/assistant messages for the prompt."""
    recent = list(chat_log_queryset.order_by('-created_at')[:MAX_HISTORY_TURNS])
    recent.reverse()
    messages = []
    for log in recent:
        messages.append({'role': 'user', 'content': log.question})
        messages.append({'role': 'assistant', 'content': log.answer})
    return messages


def _validate_output(answer):
    """
    Output validation (step 12). Deliberately light-touch: the structural
    system-prompt defense is the primary control, this is a backstop that
    catches the model complying with a "reveal your instructions" request
    despite being told not to, and swaps in a safe refusal instead of
    leaking anything.
    """
    lowered = answer.lower()
    leak_markers = ['you are the taifacare knowledge assistant', 'rules you must follow', 'context:']
    if any(marker in lowered for marker in leak_markers):
        logger.warning('chatbot_possible_prompt_leak')
        return "I can't share my internal configuration, but I'm happy to help with a documentation question."
    return answer


def run_pipeline(raw_message, request, history_queryset=None):
    """
    Main entry point. `history_queryset` is an already-filtered ChatLog
    queryset for the current conversation (or None for a fresh one) —
    callers (views/chatbot_views.py) own the query, this function only
    reads it.
    """
    start = time.monotonic() #time it start

    # Steps 2 + 5: validate, then sanitize/normalize.
    is_valid, error = validate_message(raw_message)
    if not is_valid:
        return RAGResult(answer=error, blocked=True, latency_seconds=time.monotonic() - start)

    message = sanitize_message(raw_message)

    # Steps 3-4: injection detection. High-confidence matches short-circuit
    # before any embedding/DB/LLM work happens.
    should_block, matched = check_injection(message)
    if matched:
        log_security_event('prompt_injection_detected', request, matched_labels=matched)
    if should_block:
        return RAGResult(answer=BLOCKED_RESPONSE, blocked=True, latency_seconds=time.monotonic() - start)

    # Steps 6-9: retrieve, then rank/dedupe to a handful of distinct articles.
    try:
        raw_results = retrieve_relevant_chunks(message)
    except Exception:
        logger.exception('chatbot_retrieval_failed')
        return RAGResult(
            answer='Something went wrong searching the knowledge base. Please try again shortly.',
            blocked=True,
            latency_seconds=time.monotonic() - start,
        )

    ranked = rank_and_dedupe_by_article(raw_results)

    if not ranked:
        return RAGResult(
            answer=NO_CONTEXT_RESPONSE,
            escalate_suggested=True,
            latency_seconds=time.monotonic() - start,
        )

    # Step 10: prompt construction (system + windowed history + question).
    history = _build_history_messages(history_queryset) if history_queryset is not None else None
    messages = build_messages(message, ranked, history=history)

    # Step 11: LLM call.
    try:
        answer = generate_answer(messages)
    except LLMUnavailableError:
        logger.exception('chatbot_llm_unavailable')
        return RAGResult(
            answer=(
                "The knowledge assistant is temporarily unavailable. Please try again in a "
                "moment, or contact support if this continues."
            ),
            sources=ranked,
            escalate_suggested=True,
            latency_seconds=time.monotonic() - start,
        )

    # Step 12: output validation.
    answer = _validate_output(answer)

    latency = time.monotonic() - start
    logger.info('chatbot_response_generated', extra={'latency_seconds': round(latency, 3), 'sources': len(ranked)})

    return RAGResult(answer=answer, sources=ranked, latency_seconds=latency)
