from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from analytics.models.notification import Notification
from articles.models.article import Article
from articles.models.category import Category
from users.test.helper import create_regular_user, create_admin
from django.utils import timezone
from unittest.mock import patch

User = get_user_model()


class NotificationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.editor = create_regular_user(role='editor')
        self.admin = create_admin()
        self.viewer = create_regular_user(role='viewer')
        
        self.category = Category.objects.create(name='Test', slug='test')
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='This is test content for the article.',
            category=self.category,
            author=self.editor,
            status='draft'
        )
    
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
    
    def test_notification_creation(self):
        """Test creating a notification."""
        notification = Notification.objects.create(
            recipient=self.admin,
            sender=self.editor,
            notification_type=Notification.TYPE_ARTICLE_SUBMITTED,
            title="Article Submitted",
            message="Test message",
            link="/articles/1/"
        )
        
        self.assertEqual(notification.recipient, self.admin)
        self.assertEqual(notification.sender, self.editor)
        self.assertEqual(notification.title, "Article Submitted")
        self.assertFalse(notification.read)
        self.assertIsNotNone(notification.created_at)
    
    
    @patch('users.signals.send_welcome_email')
    def test_article_submitted_creates_notifications(self, mock_send):
        """Test that submitting an article creates notifications for admins."""
        self._login(self.editor)
        # Use slug instead of pk
        url = reverse('articles:article-submit-for-review', kwargs={'slug': self.article.slug})
        response = self.client.post(url, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        submission_notifications = Notification.objects.filter(notification_type='article_submitted')
        self.assertIsNotNone(submission_notifications)
        
        notification = submission_notifications.first()
        self.assertEqual(notification.recipient, self.admin)
        self.assertEqual(notification.sender, self.editor)
        self.assertEqual(notification.notification_type, 'article_submitted')
    
    def test_user_can_view_own_notifications(self):
        """Test that users can view their own notifications."""
        Notification.objects.create(
            recipient=self.admin,
            notification_type='article_submitted',
            title="Test",
            message="Test"
        )
        
        self._login(self.admin)
        url = reverse('analytics:notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
    
    def test_user_cannot_view_others_notifications(self):
        """Test that users cannot view others' notifications."""
        Notification.objects.create(
            recipient=self.admin,
            notification_type='article_submitted',
            title="Test",
            message="Test"
        )
        
        self._login(self.viewer)
        url = reverse('analytics:notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 0)
    
    def test_mark_notification_read(self):
        """Test marking a notification as read."""
        notification = Notification.objects.create(
            recipient=self.admin,
            notification_type='article_submitted',
            title="Test",
            message="Test"
        )
        
        self._login(self.admin)
        url = reverse('analytics:notification-mark-read', kwargs={'pk': notification.id})
        response = self.client.patch(url, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        notification.refresh_from_db()
        self.assertTrue(notification.read)
        self.assertIsNotNone(notification.read_at)
    
    def test_unread_count(self):
        """Test getting unread notification count."""
        Notification.objects.create(
            recipient=self.admin,
            notification_type='article_submitted',
            title="Unread",
            message="Unread"
        )
        Notification.objects.create(
            recipient=self.admin,
            notification_type='article_published',
            title="Read",
            message="Read",
            read=True,
            read_at=timezone.now()
        )
        
        self._login(self.admin)
        url = reverse('analytics:notification-unread-count')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['unread_count'], 1)