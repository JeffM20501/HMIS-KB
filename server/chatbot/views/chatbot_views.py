from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from analytics.models.chat_logs import ChatLog
from articles.models.article import Article
from chatbot.rag.rag_pipline import RAGPipeline
from chatbot.security.prompt_injection import validate_query


class ChatbotView(APIView):
    """
    POST /api/v1/chat/
    Accepts a question (even from anonymous users) and returns an answer.
    """
    permission_classes = [permissions.AllowAny]   # ← public

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.pipeline = RAGPipeline()

    def post(self, request):
        question = request.data.get('question')
        conversation_id = request.data.get('conversation_id')

        if not question:
            return Response(
                {'error': 'Question is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Optional input validation
        if not validate_query(question):
            return Response(
                {'error': 'Invalid input.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Process through RAG pipeline
        result = self.pipeline.answer(question, conversation_id)

        # Extract article reference if grounded
        article_ref = None
        if result.get('article_ref'):
            try:
                article_ref = Article.objects.get(id=result['article_ref']['id'])
            except Article.DoesNotExist:
                pass

        # Generate conversation_id if not provided
        if not conversation_id:
            if request.user.is_authenticated:
                conversation_id = f"conv_{request.user.id}_{int(timezone.now().timestamp())}"
            else:
                # Use session to generate a stable ID for anonymous
                if not request.session.get('anon_conversation_id'):
                    request.session['anon_conversation_id'] = f"anon_{int(timezone.now().timestamp())}_{request.session.session_key}"
                conversation_id = request.session['anon_conversation_id']

        # Save chat log (user can be None)
        chat_log = ChatLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            conversation_id=conversation_id,
            question=question,
            answer=result['answer'],
            article_ref=article_ref,
            was_helpful=None,
            response_time=result.get('response_time'),
            confidence_score=result.get('confidence_score'),
        )

        return Response({
            'answer': result['answer'],
            'article_ref': result.get('article_ref'),
            'was_grounded': result.get('was_grounded', False),
            'confidence_score': result.get('confidence_score'),
            'chat_log_id': chat_log.id,
            'conversation_id': conversation_id,
        }, status=status.HTTP_200_OK)