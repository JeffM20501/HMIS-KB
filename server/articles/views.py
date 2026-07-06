from django.shortcuts import render
from rest_framework.views import APIView
from articles.serializers.article_serializers import ArticleSerializer
from articles.models.article import Article
# Create your views here.
class CreateArticles(APIView):
    queryset=Article.objects.all().order_by('-date_joined')
    serializer_class=Article