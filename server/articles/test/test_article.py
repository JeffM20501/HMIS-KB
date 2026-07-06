from articles.test.helper import *
from django.utils import timezone
from django.urls import reverse
from django.test import TestCase
from articles.models import Article

class ArticleModelTest(TestCase):
    """Test the Article model directly."""
    
    def test_article_creation(self):
        author = create_user(role='editor')
        category = create_category()
        article = create_article(author, category)
        
        self.assertEqual(article.title, 'Test Article')
        self.assertEqual(article.slug, 'test-article')
        self.assertEqual(article.author, author)
        self.assertEqual(article.category, category)
        self.assertEqual(article.status, 'draft')
        self.assertEqual(article.views, 0)
        self.assertIsNotNone(article.created_at)
        self.assertIsNotNone(article.updated_at)
        self.assertIsNone(article.published_at)
        self.assertIsNone(article.published_by)

    def test_article_str_method(self):
        author = create_user(role='editor')
        article = create_article(author)
        self.assertEqual(str(article), 'Test Article')

    def test_article_published_status(self):
        author = create_user(role='editor')
        admin = create_admin()
        article = create_article(author, status='draft')
        
        self.assertEqual(article.status, 'draft')
        self.assertIsNone(article.published_at)
        self.assertIsNone(article.published_by)
        
        
        article.status = 'published'
        article.published_by = admin
        article.published_at = timezone.now()
        article.save()
        
        self.assertEqual(article.status, 'published')
        self.assertEqual(article.published_by, admin)
        self.assertIsNotNone(article.published_at)

    def test_article_views_increment(self):
        author = create_user(role='editor')
        article = create_article(author)
        
        self.assertEqual(article.views, 0)
        
        
        article.views += 1
        article.save()
        self.assertEqual(article.views, 1)
        
        article.views += 1
        article.save()
        self.assertEqual(article.views, 2)