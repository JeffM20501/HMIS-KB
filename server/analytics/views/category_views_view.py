from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum
from articles.models import Category

class CategoryViewsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        categories = Category.objects.annotate(
            total_views=Sum('articles__views')
        ).filter(total_views__gt=0).order_by('-total_views')
        
        total = sum(c.total_views for c in categories)
        if total == 0:
            return Response([])
        
        data = [
            {'name': c.name, 'percentage': round((c.total_views / total) * 100, 1)}
            for c in categories
        ]
        return Response(data)