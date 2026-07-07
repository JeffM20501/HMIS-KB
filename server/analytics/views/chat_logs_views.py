from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg
from analytics.models.chat_logs import ChatLog
from analytics.models.feedback import Feedback
from analytics.serializers.chat_log_serializer import (
    ChatLogSerializer,
    ChatLogListSerializer,
    ChatLogDetailSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer
)
from analytics.permissions.chat_logs_permissions import CanViewChatLogs
from articles.models.article import Article


class ChatLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing chat logs.
    
    PRD FR-5.8: All assistant queries and responses are logged.
    PRD FR-5.9: Admins can review unanswered/low-confidence questions.
    """
    
    queryset = ChatLog.objects.all()
    serializer_class = ChatLogSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewChatLogs]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ChatLogListSerializer
        elif self.action == 'retrieve':
            return ChatLogDetailSerializer
        return ChatLogSerializer
    
    def get_queryset(self):
        """Filter queryset based on user role and query parameters."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admins see all, others see only their own
        if user.role != 'admin':
            queryset = queryset.filter(user=user)
        
        # Filter by conversation
        conversation_id = self.request.query_params.get('conversation_id')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        
        # Filter by helpfulness
        was_helpful = self.request.query_params.get('was_helpful')
        if was_helpful is not None:
            if was_helpful.lower() == 'true':
                queryset = queryset.filter(was_helpful=True)
            elif was_helpful.lower() == 'false':
                queryset = queryset.filter(was_helpful=False)
            elif was_helpful.lower() == 'null':
                queryset = queryset.filter(was_helpful__isnull=True)
        
        # Filter by article reference
        article_ref = self.request.query_params.get('article_ref')
        if article_ref:
            queryset = queryset.filter(article_ref_id=article_ref)
        
        # Search by question or answer content
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(question__icontains=search) |
                Q(answer__icontains=search)
            )
        
        # Date range filters
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def conversation(self, request):
        """
        Get all messages in a conversation.
        """
        conversation_id = request.query_params.get('conversation_id')
        
        if not conversation_id:
            return Response(
                {"error": "conversation_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logs = ChatLog.objects.filter(conversation_id=conversation_id)
        
        # Check permission
        if request.user.role != 'admin':
            logs = logs.filter(user=request.user)
        
        if not logs.exists():
            return Response(
                {"error": "Conversation not found or you don't have permission."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unanswered(self, request):
        """
        PRD FR-5.9: Get unanswered/low-confidence questions.
        Admin only.
        """
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admins can view unanswered questions."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get logs with no feedback or low confidence
        logs = ChatLog.objects.filter(
            Q(was_helpful__isnull=True) |
            Q(confidence_score__lt=0.5)
        ).order_by('created_at')
        
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get chat statistics.
        Admin only.
        """
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admins can view chat stats."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total = ChatLog.objects.count()
        helpful = ChatLog.objects.filter(was_helpful=True).count()
        not_helpful = ChatLog.objects.filter(was_helpful=False).count()
        no_feedback = ChatLog.objects.filter(was_helpful__isnull=True).count()
        
        # Get top asked questions
        top_questions = ChatLog.objects.values('question').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'total_chats': total,
            'helpful_count': helpful,
            'not_helpful_count': not_helpful,
            'no_feedback_count': no_feedback,
            'helpfulness_rate': round(helpful / total * 100, 2) if total > 0 else 0,
            'top_questions': top_questions
        })