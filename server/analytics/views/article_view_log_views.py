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
        # Parse range (default 7d, supports 7d, 30d, 12m)
        range_param = request.query_params.get('range', '7d')
        if range_param.endswith('d'):
            days = int(range_param[:-1])
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days - 1)
        elif range_param.endswith('m'):
            months = int(range_param[:-1])
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=months * 30)  # approximate
        else:
            start_date = timezone.now().date() - timedelta(days=6)
            end_date = timezone.now().date()

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

        views_dict = {item['day'].date(): item['count'] for item in views_qs}
        searches_dict = {item['day'].date(): item['count'] for item in searches_qs}

        # Build time series with formatted labels
        time_series = []
        current = start_date
        while current <= end_date:
            time_series.append({
                'label': current.strftime('%b %d'),  # e.g., "Jul 22"
                'views': views_dict.get(current, 0),
                'searches': searches_dict.get(current, 0),
            })
            current += timedelta(days=1)

        return Response({'results': time_series})