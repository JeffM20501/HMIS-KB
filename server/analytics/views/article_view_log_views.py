from django.db.models import Count, Q
from django.db.models.functions import TruncDay
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from analytics.models import  SearchLog,ArticleViewLog
from datetime import timedelta

class TimeSeriesStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        days = 30
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days - 1)

        # Daily article views
        views_qs = ArticleViewLog.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).annotate(
            day=TruncDay('timestamp')
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')

        # Daily searches
        searches_qs = SearchLog.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).annotate(
            day=TruncDay('created_at')
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')

        # Build a dictionary for each date
        views_dict = {item['day'].date(): item['count'] for item in views_qs}
        searches_dict = {item['day'].date(): item['count'] for item in searches_qs}

        # Generate full date range
        time_series = []
        current = start_date
        while current <= end_date:
            time_series.append({
                'date': current.isoformat(),
                'views': views_dict.get(current, 0),
                'searches': searches_dict.get(current, 0),
            })
            current += timedelta(days=1)

        return Response({'timeSeries': time_series})