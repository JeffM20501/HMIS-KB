from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'tags', views.TagViewSet, basename='tag')
router.register(r'articles', views.ArticleViewSet, basename='article')
router.register(r'article-tags', views.ArticleTagViewSet, basename='article-tag')

app_name = 'articles'

urlpatterns = [
    path('', include(router.urls)),
]