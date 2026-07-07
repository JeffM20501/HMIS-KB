from django.urls import path, include
from rest_framework.routers import DefaultRouter
from articles.views import CategoryViewSet,TagViewSet,ArticleTagViewSet,ArticleViewSet,MediaViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'article-tag', ArticleTagViewSet, basename='article-tag')
router.register(r'media', MediaViewSet, basename='media')

app_name = 'articles'

urlpatterns = [
    path('', include(router.urls)),
]