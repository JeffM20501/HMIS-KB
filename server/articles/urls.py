from django.urls import path, include
from rest_framework.routers import DefaultRouter
from articles.views import CategoryViewSet,TagViewSet,ArticleTagViewSet,ArticleViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'article-tags', ArticleTagViewSet, basename='article-tag')

app_name = 'articles'

urlpatterns = [
    path('', include(router.urls)),
    path('article-tags/bulk-add/', ArticleTagViewSet.as_view({'post': 'bulk_add_tags'}), name='article-tag-bulk-add'),
    path('article-tags/bulk-remove/', ArticleTagViewSet.as_view({'post': 'bulk_remove_tags'}), name='article-tag-bulk-remove'),
]