from django.urls import path, include
from rest_framework.routers import DefaultRouter
from articles.views import ArticleViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'articles', ArticleViewSet, basename='article')

app_name = 'articles'

urlpatterns = [
    path('', include(router.urls)),
]