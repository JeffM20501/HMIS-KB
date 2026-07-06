from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from articles.models.category import Category
from articles.serializers.category_serializer import CategorySerializer, CategoryListSerializer
from articles.permissions.category_permissions import IsCategoryAdmin


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing article categories.
    
    PRD FR-1.5: Articles can be categorized
    PRD FR-8.1: Top-level categories for organizing content
    PRD FR-2.3: Users can filter search results by category
    """
    
    queryset = Category.objects.all().order_by('sort_order', 'name')
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        """
        PRD: Role-based permissions for categories.
        - Everyone can view categories
        - Only admins can create, update, or delete categories
        """
        if self.action in ['list', 'retrieve']:
            # Anyone can view categories
            permission_classes = [permissions.AllowAny]
        else:
            # Only admins can modify categories
            permission_classes = [IsCategoryAdmin]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Use simplified serializer for list view."""
        if self.action == 'list':
            return CategoryListSerializer
        return CategorySerializer
    
    @action(detail=False, methods=['get'])
    def root_categories(self, request):
        """
        Get only root categories (categories with no parent).
        """
        root_categories = Category.objects.filter(parent__isnull=True).order_by('sort_order', 'name')
        serializer = self.get_serializer(root_categories, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def articles(self, request, pk=None):
        """
        Get all articles in a specific category.
        """
        category = self.get_object()
        articles = category.articles.filter(status='published')  # Only published articles
        from articles.serializers.article_serializers import ArticleSerializer
        serializer = ArticleSerializer(articles, many=True, context={'request': request})
        return Response(serializer.data)