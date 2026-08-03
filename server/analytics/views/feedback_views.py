from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count
from analytics.models.feedback import Feedback
from analytics.serializers.feedback_serializer import FeedbackSerializer
from analytics.permissions.feedback_permissions import CanViewFeedback, CanCreateFeedback


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        elif self.action in ['list', 'retrieve', 'stats', 'my_feedback', 'for_object']:
            permission_classes = [permissions.IsAuthenticated, CanViewFeedback]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        queryset = Feedback.objects.all()

        if not user.is_authenticated:
            return Feedback.objects.none()

        if user.role != 'admin':
            queryset = queryset.filter(user=user)

        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)

        object_id = self.request.query_params.get('object_id')
        if object_id:
            queryset = queryset.filter(object_id=object_id)

        return queryset

    def perform_create(self, serializer):
        # Set user to None for anonymous, else the authenticated user
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Count articles per editor (assuming author is editor)
        editors = User.objects.filter(role='editor')
        editor_stats = editors.annotate(
            article_count=Count('articles_authored')
        ).filter(article_count__gt=0).order_by('-article_count')[:5]
        
        most_active = [
            {
                'id': e.id,
                'name': e.full_name or e.username,
                'article_count': e.article_count
            }
            for e in editor_stats
        ]
        
        return Response({'most_active_editors': most_active})

    @action(detail=False, methods=['get'])
    def my_feedback(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        feedbacks = Feedback.objects.filter(user=request.user)
        content_type = request.query_params.get('content_type')
        if content_type:
            feedbacks = feedbacks.filter(content_type=content_type)

        page = self.paginate_queryset(feedbacks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(feedbacks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def for_object(self, request):
        content_type = request.query_params.get('content_type')
        object_id = request.query_params.get('object_id')

        if not content_type or not object_id:
            return Response(
                {"error": "content_type and object_id are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        feedbacks = Feedback.objects.filter(
            content_type=content_type,
            object_id=object_id
        )
        serializer = self.get_serializer(feedbacks, many=True)
        return Response(serializer.data)