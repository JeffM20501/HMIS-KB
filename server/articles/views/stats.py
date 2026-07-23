from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count
from articles.models import Article
from analytics.models import Feedback, SearchLog


class PublicStatsView(APIView):
    """
    Public endpoint for landing page stats.
    No authentication required.
    """
    permission_classes = []

    def get(self, request):
        # Total published articles
        total_articles = Article.objects.filter(status='published').count()

        # Total views across all articles
        total_views = Article.objects.aggregate(total=Sum('views'))['total'] or 0

        # Average rating from article feedback (rating field)
        avg_rating = Feedback.objects.filter(
            content_type='article',
            rating__isnull=False
        ).aggregate(avg=Avg('rating'))['avg'] or 0.0

        # Search success rate: fraction of searches with results > 0
        search_logs = SearchLog.objects.all()
        if search_logs.exists():
            total_searches = search_logs.count()
            successful = search_logs.filter(result_count__gt=0).count()
            success_rate = round((successful / total_searches) * 100)
        else:
            success_rate = 75  # fallback static value

        return Response({
            'total_articles': total_articles,
            'total_views': total_views,
            'avg_rating': round(avg_rating, 1),
            'search_success_rate': success_rate,
        })