import json
import logging

from django.http import StreamingHttpResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models.chat_logs import ChatLog
from analytics.models.chat_log_source import ChatLogSource
from chatbot.models import Conversation
from chatbot.security.throttles import ChatAnonRateThrottle, ChatUserRateThrottle
from chatbot.security.validation import sanitize_message, validate_message
from chatbot.security.injection_detection import check_injection, log_security_event
from chatbot.serializers.chat_serializers import ChatRequestSerializer, ChatResponseSerializer
from chatbot.services.llm_client import LLMUnavailableError, generate_answer, stream_to_text_chunks
from chatbot.services.rag_pipeline import BLOCKED_RESPONSE, run_pipeline
from chatbot.services.retrieval import rank_and_dedupe_by_article, retrieve_relevant_chunks
from chatbot.prompts.system_prompt import build_messages

logger = logging.getLogger('chatbot')


class ChatbotView(APIView):
    """
    POST /api/v1/chat/

    Public (AllowAny) — the chat widget is embedded in both the public
    Help Center and the authenticated Admin/Editor portals (per the PRD's
    embeddability requirement), so this intentionally accepts both
    anonymous and authenticated callers. Role-awareness (FR-5.4 — never
    surface content a user's role wouldn't otherwise see) is handled
    structurally rather than per-request: chatbot/signals.py only ever
    creates embeddings for articles with status='published', so there is
    no draft/pending-review content in the vector index at all for any
    role to leak — retrieval simply has nothing restricted to accidentally
    return.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ChatAnonRateThrottle, ChatUserRateThrottle]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = serializer.validated_data['message']
        context = serializer.validated_data.get('context', {})
        conversation = self._resolve_conversation(request, serializer.validated_data.get('conversation_id'))

        if request.query_params.get('stream', '').lower() == 'true':
            return self._handle_streaming(request, message, conversation)

        history_qs = ChatLog.objects.filter(conversation=conversation) if conversation else ChatLog.objects.none()
        result = run_pipeline(message, request, history_queryset=history_qs)

        chat_log = self._persist(request, conversation, message, result)

        payload = {
            'conversation_id': str(conversation.id) if conversation else str(chat_log.id),
            'chat_log_id':chat_log.id,
            'answer': result.answer,
            'sources': [
                {'article_slug': r['article'].slug, 'title': r['article'].title, 'confidence': round(r['similarity'], 3)}
                for r in result.sources
            ],
            'escalate_suggested': result.escalate_suggested or result.blocked,
        }
        response_serializer = ChatResponseSerializer(data=payload)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def _resolve_conversation(self, request, conversation_id):
        """
        Looks up an existing conversation the requester actually owns, or
        creates a new one. A conversation_id for a conversation the
        requester does NOT own is treated as if none were provided (starts
        a fresh conversation) rather than raising — this is deliberate:
        it's the simplest way to guarantee cross-user history leakage is
        impossible even if a client sent a stale/guessed id, without
        needing a separate hard 403 path for what's likely just a stale
        client-side value.
        """
        if conversation_id:
            try:
                existing = Conversation.objects.get(pk=conversation_id)
                if existing.owned_by(request):
                    return existing
            except (Conversation.DoesNotExist, ValueError, TypeError):
                pass

        if not request.session.session_key:
            request.session.save()

        return Conversation.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_key=None if request.user.is_authenticated else request.session.session_key,
        )

    def _persist(self, request, conversation, message, result):
        chat_log = ChatLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            conversation=conversation,
            conversation_id=str(conversation.id) if conversation else '',
            question=message,
            answer=result.answer,
            article_ref=result.sources[0]['article'] if result.sources else None,
            response_time=result.latency_seconds,
            confidence_score=result.sources[0]['similarity'] if result.sources else None,
        )

        if conversation and not conversation.title:
            conversation.set_title_from_text(message)
            conversation.save(update_fields=['title', 'updated_at'])

        if result.sources:
            ChatLogSource.objects.bulk_create(
                [
                    ChatLogSource(chat_log=chat_log, article=r['article'], confidence=r['similarity'], rank=i)
                    for i, r in enumerate(result.sources)
                ]
            )
        return chat_log

    def _handle_streaming(self, request, message, conversation):
        """
        Streams the LLM's answer as it's generated (Groq supports SSE).
        Validation/injection-check/retrieval/prompt-construction all run
        synchronously first (those aren't things you'd want to stream
        partial results of); only the actual answer generation streams.
        The full answer is accumulated and persisted to ChatLog after the
        stream completes, same as the non-streaming path.

        Note: the current React chat widget does not yet consume SSE — it
        calls the non-streaming path. Wiring the frontend up to this is a
        follow-up, not included here since this task was scoped to the
        backend.
        """
        is_valid, error = validate_message(message)
        if not is_valid:
            return self._sse_error(error)

        clean_message = sanitize_message(message)
        should_block, matched = check_injection(clean_message)
        if matched:
            log_security_event('prompt_injection_detected', request, matched_labels=matched)
        if should_block:
            return self._sse_error(BLOCKED_RESPONSE)

        try:
            raw_results = retrieve_relevant_chunks(clean_message)
        except Exception:
            logger.exception('chatbot_retrieval_failed_stream')
            return self._sse_error('Something went wrong searching the knowledge base.')

        ranked = rank_and_dedupe_by_article(raw_results)
        messages = build_messages(clean_message, ranked)

        def event_stream():
            accumulated = []
            try:
                stream_response = generate_answer(messages, stream=True)
                for delta in stream_to_text_chunks(stream_response):
                    accumulated.append(delta)
                    yield f"data: {json.dumps({'delta': delta})}\n\n"
            except LLMUnavailableError:
                yield f"data: {json.dumps({'error': 'The assistant is temporarily unavailable.'})}\n\n"
                accumulated = []

            full_answer = ''.join(accumulated)
            if full_answer:
                self._persist(request, conversation, clean_message, _StreamResult(full_answer, ranked))

            sources_payload = [
                {'article_slug': r['article'].slug, 'title': r['article'].title, 'confidence': round(r['similarity'], 3)}
                for r in ranked
            ]
            yield f"data: {json.dumps({'done': True, 'sources': sources_payload, 'conversation_id': str(conversation.id) if conversation else None})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # disable nginx buffering of the SSE stream, if fronted by nginx
        return response

    def _sse_error(self, message):
        def gen():
            yield f"data: {json.dumps({'error': message, 'done': True})}\n\n"

        return StreamingHttpResponse(gen(), content_type='text/event-stream')


class _StreamResult:
    """Adapts a streamed answer into the shape _persist() expects, without
    needing run_pipeline()'s full validation/retrieval work to run twice."""

    def __init__(self, answer, sources):
        self.answer = answer
        self.sources = sources
        self.latency_seconds = 0.0
