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
    permission_classes = [permissions.IsAuthenticated, CanCreateFeedback]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated, CanViewFeedback]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, CanViewFeedback]
        else:
            permission_classes = [permissions.IsAuthenticated, CanCreateFeedback]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role != 'admin':
            queryset = queryset.filter(user=user)

        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)

        object_id = self.request.query_params.get('object_id')
        if object_id:
            queryset = queryset.filter(object_id=object_id)

        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        content_type = request.query_params.get('content_type', 'article')
        object_id = request.query_params.get('object_id')

        if not object_id:
            return Response(
                {"error": "object_id is required for stats."},
                status=status.HTTP_400_BAD_REQUEST
            )

        feedbacks = Feedback.objects.filter(
            content_type=content_type,
            object_id=object_id
        )

        if content_type == 'article':
            avg_rating = feedbacks.filter(rating__isnull=False).aggregate(Avg('rating'))['rating__avg']
            total_ratings = feedbacks.filter(rating__isnull=False).count()
            distribution = {i: feedbacks.filter(rating=i).count() for i in range(1, 6)}

            return Response({
                'average_rating': round(avg_rating, 2) if avg_rating else None,
                'total_ratings': total_ratings,
                'rating_distribution': distribution
            })

        elif content_type == 'chat':
            total = feedbacks.count()
            helpful_count = feedbacks.filter(helpful=True).count()

            return Response({
                'total_feedback': total,
                'helpful_count': helpful_count,
                'not_helpful_count': total - helpful_count,
                'helpfulness_rate': round(helpful_count / total * 100, 2) if total > 0 else 0
            })

        return Response({"error": "Invalid content_type."}, status=400)

    @action(detail=False, methods=['get'])
    def my_feedback(self, request):
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