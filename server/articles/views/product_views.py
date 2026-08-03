from rest_framework import viewsets
from articles.models import Product
from articles.serializers.product_serializer import ProductSerializer
from articles.permissions.product_permissions import IsProductWrite,IsProductRead
from rest_framework.decorators import action
from rest_framework.response import Response
from articles.serializers.article_serializers import ArticleSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset=Product.objects.all()
    serializer_class=ProductSerializer
    lookup_field='slug'
    
    def get_queryset(self):
        user = self.request.user
        queryset=Product.objects.all()
        active_filter=self.request.query_params.get('status')
        
        if user.is_authenticated and user.role == 'editor':
            queryset = queryset.filter(is_active=True)
        else:
            queryset = queryset.filter(is_active=True)
        if active_filter is not None:
            queryset = queryset.filter(is_active=active_filter == 'true')
        return queryset
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'articles']:
            permission_classes = [IsProductRead]
        else:
            permission_classes = [IsProductWrite]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        return ProductSerializer
    
    @action(detail=True, methods=['get'])
    def articles(self, request, slug=None):
        product = self.get_object()
        articles = product.articles.filter(status='published')
        serializer = ArticleSerializer(articles, many=True, context={'request': request})
        return Response(serializer.data)