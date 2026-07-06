from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from articles.models.article import Article
from articles.models.tag import Tag
from articles.models.category import Category
from articles.models.article_tag import ArticleTag
from users.test.helper import create_regular_user, create_admin


class ArticleTagTest(TestCase):
    """Test Article-Tag relationships."""
    
    def setUp(self):
        self.client = APIClient()
        self.editor = create_regular_user(role='editor')
        self.admin = create_admin()
        self.viewer = create_regular_user(role='viewer')
        
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='This is test content for the article. It is definitely more than 50 characters long.',
            category=self.category,
            author=self.editor,
            status='published'
        )
        
        self.tag1 = Tag.objects.create(name='Emergency', slug='emergency')
        self.tag2 = Tag.objects.create(name='SOP', slug='sop')
    
    def _get_token(self, user):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': user.username,
            'password': '12345'
        })
        return response.data['access']
    
    def _login(self, user):
        token = self._get_token(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    def test_add_tag_to_article(self):
        """Test adding a tag to an article."""
        self._login(self.editor)
        
        url = reverse('articles:article-tag-list')
        response = self.client.post(url, {
            'article': self.article.id,
            'tag': self.tag1.id
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ArticleTag.objects.count(), 1)
        self.assertEqual(self.article.tags.count(), 1)
    
    def test_duplicate_tag_to_article(self):
        """Test that a tag cannot be added twice to the same article."""
        ArticleTag.objects.create(
            article=self.article,
            tag=self.tag1,
            added_by=self.editor
        )
        
        self._login(self.editor)
        
        url = reverse('articles:article-tag-list')
        response = self.client.post(url, {
            'article': self.article.id,
            'tag': self.tag1.id
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        
        # Collect all error messages
        error_messages = []
        for field, errors in response.data.items():
            if isinstance(errors, list):
                for error in errors:
                    error_messages.append(str(error).lower())
            elif isinstance(errors, str):
                error_messages.append(errors.lower())
        
        # Check for either custom message or default unique-together message
        duplicate_phrases = ['already added', 'already exists', 'unique set']
        error_found = any(
            any(phrase in msg for phrase in duplicate_phrases)
            for msg in error_messages
        )
        
        self.assertTrue(
            error_found,
            f"Expected duplicate error not found. Got response data: {response.data}"
        )
    
    def test_viewer_cannot_add_tag(self):
        """Test that viewers cannot add tags to articles."""
        self._login(self.viewer)
        
        url = reverse('articles:article-tag-list')
        response = self.client.post(url, {
            'article': self.article.id,
            'tag': self.tag1.id
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 403)
    
    def test_bulk_add_tags(self):
        """Test bulk adding tags to an article."""
        self._login(self.editor)
        
        
        url = reverse('articles:article-tag-bulk-add')
        response = self.client.post(url, {
            'article_id': self.article.id,
            'tag_ids': [self.tag1.id, self.tag2.id]
        }, content_type='application/json')
        
        # Debug output
        if response.status_code != 200:
            print("Bulk add response status:", response.status_code)
            print("Bulk add response data:", response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.article.tags.count(), 2)
    
    def test_remove_tag_from_article(self):
        """Test removing a tag from an article."""
        article_tag = ArticleTag.objects.create(
            article=self.article,
            tag=self.tag1,
            added_by=self.editor
        )
        
        self._login(self.editor)
        
        url = reverse('articles:article-tag-detail', kwargs={'pk': article_tag.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, 204)
        self.assertEqual(self.article.tags.count(), 0)