from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils import timezone
from analytics.models.chat_logs import ChatLog
from articles.models.article import Article
from chatbot.rag.rag_pipline import RAGPipeline
from chatbot.security.prompt_injection import validate_query


class ChatbotView(APIView):
    """
    POST /api/v1/chat/
    Accepts a question, runs it through the RAG pipeline, and saves the
    conversation to ChatLog in the analytics app.
    """
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.pipeline = RAGPipeline()

    def post(self, request):
        question = request.data.get('question')
        conversation_id = request.data.get('conversation_id')

        # 1. Validate input
        if not question:
            return Response(
                {'error': 'Question is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Process through RAG pipeline
        result = self.pipeline.answer(question, conversation_id)

        # 3. Extract article reference (if grounded)
        article_ref = None
        if result.get('article_ref'):
            try:
                article_ref = Article.objects.get(id=result['article_ref']['id'])
            except Article.DoesNotExist:
                pass

        # 4. Save to ChatLog (in analytics app)
        chat_log = ChatLog.objects.create(
            user=request.user,
            conversation_id=conversation_id or f"conv_{request.user.id}_{timezone.now().timestamp()}",
            question=question,
            answer=result['answer'],
            article_ref=article_ref,
            was_helpful=None,  # User can provide feedback later
            response_time=result.get('response_time'),
            confidence_score=result.get('confidence_score'),
        )

        # 5. Return response to frontend
        return Response({
            'answer': result['answer'],
            'article_ref': result.get('article_ref'),
            'was_grounded': result.get('was_grounded', False),
            'confidence_score': result.get('confidence_score'),
            'chat_log_id': chat_log.id,
        }, status=status.HTTP_200_OK)