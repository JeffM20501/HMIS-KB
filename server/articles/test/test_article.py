# articles/test/test_article.py
from django.test import TestCase
from articles.test.helper import *
from django.utils import timezone

class ArticleModelTest(TestCase):
    def setUp(self):
        # Clean slate
        Article.objects.all().delete()
        Category.objects.all().delete()
        User.objects.all().delete()

    def test_article_creation(self):
        author = create_user(role='editor')
        category = create_category()
        slug = unique_slug(base='test-article')
        article = Article.objects.create(
            title='Test Article',
            slug=slug,
            content='This is test content for the article. It needs to be at least 50 characters long.',
            category=category,
            author=author,
            status='draft'
        )
        self.assertEqual(article.title, 'Test Article')
        self.assertEqual(article.slug, slug)
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
        slug = unique_slug(base='test-article')
        article = Article.objects.create(
            title='Test Article',
            slug=slug,
            content='Content...',
            author=author
        )
        self.assertEqual(str(article), 'Test Article')

    def test_article_published_status(self):
        author = create_user(role='editor')
        admin = create_admin()
        slug = unique_slug(base='test-article')
        article = Article.objects.create(
            title='Test Article',
            slug=slug,
            content='Content...',
            author=author,
            status='draft'
        )
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
        slug = unique_slug(base='test-article')
        article = Article.objects.create(
            title='Test Article',
            slug=slug,
            content='Content...',
            author=author
        )
        self.assertEqual(article.views, 0)
        article.views += 1
        article.save()
        self.assertEqual(article.views, 1)
        article.views += 1
        article.save()
        self.assertEqual(article.views, 2)