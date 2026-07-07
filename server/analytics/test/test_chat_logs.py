from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from analytics.models.chat_logs import ChatLog
from analytics.models.feedback import Feedback
from articles.models.article import Article
from articles.models.category import Category
from users.test.helper import create_regular_user, create_admin

User = get_user_model()


class ChatLogTest(TestCase):
    """Test chat log functionality."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = create_regular_user(role='viewer')
        self.admin = create_admin()
        
        # Create an article
        self.category = Category.objects.create(name='Test', slug='test')
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='This is test content for the article.',
            category=self.category,
            author=self.user,
            status='published'
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
    
    def test_chat_log_creation(self):
        """Test creating a chat log."""
        self._login(self.user)
        log = ChatLog.objects.create(
            user=self.user,
            conversation_id='test-conv-123',
            question='How do I reset my password?',
            answer='You can reset your password by going to Settings...',
            article_ref=self.article,
            response_time=1.5,
            confidence_score=0.9
        )
        
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.conversation_id, 'test-conv-123')
        self.assertEqual(log.question, 'How do I reset my password?')
        self.assertEqual(log.article_ref, self.article)
        self.assertIsNotNone(log.created_at)
    
    def test_admin_can_view_chat_logs(self):
        """Test that admins can view all chat logs."""
        self._login(self.user)
        ChatLog.objects.create(
            user=self.user,
            conversation_id='test-conv',
            question='Test?',
            answer='Test answer'
        )
        
        self._login(self.admin)
        url = reverse('analytics:chat-log-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)
    
    def test_user_can_view_own_chat_logs(self):
        """Test that users can view their own chat logs."""
        self._login(self.user)
        ChatLog.objects.create(
            user=self.user,
            conversation_id='test-conv',
            question='Test?',
            answer='Test answer'
        )
        
        url = reverse('analytics:chat-log-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
    
    def test_user_cannot_view_others_chat_logs(self):
        """Test that users cannot view others' chat logs."""
        # Create log for another user
        other_user = create_regular_user(role='viewer', username='other')
        ChatLog.objects.create(
            user=other_user,
            conversation_id='other-conv',
            question='Other question?',
            answer='Other answer'
        )
        
        self._login(self.user)
        url = reverse('analytics:chat-log-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 0)
    
    def test_unanswered_endpoint(self):
        """Test unanswered questions endpoint (admin only)."""
        # Create logs with no feedback
        ChatLog.objects.create(
            user=self.user,
            conversation_id='conv-1',
            question='Unanswered question?',
            answer='Some answer'
        )
        
        self._login(self.admin)
        url = reverse('analytics:chat-log-unanswered')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_stats_endpoint(self):
        """Test chat stats endpoint."""
        self._login(self.admin)
        
        ChatLog.objects.create(
            user=self.user,
            conversation_id='conv-1',
            question='Q1?',
            answer='A1',
            was_helpful=True
        )
        ChatLog.objects.create(
            user=self.user,
            conversation_id='conv-2',
            question='Q2?',
            answer='A2',
            was_helpful=False
        )
        
        url = reverse('analytics:chat-log-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_chats'], 2)
        self.assertEqual(response.data['helpful_count'], 1)
        self.assertEqual(response.data['not_helpful_count'], 1)
    
    def test_conversation_endpoint(self):
        """Test conversation endpoint."""
        conv_id = 'multi-turn-conv'
        
        self._login(self.user)
        ChatLog.objects.create(
            user=self.user,
            conversation_id=conv_id,
            question='Q1?',
            answer='A1'
        )
        ChatLog.objects.create(
            user=self.user,
            conversation_id=conv_id,
            question='Q2?',
            answer='A2'
        )
        
        url = reverse('analytics:chat-log-conversation')
        response = self.client.get(url, {'conversation_id': conv_id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
    
    def test_chat_log_article_reference(self):
        """Test that chat log can reference an article."""
        self._login(self.user)
        log = ChatLog.objects.create(
            user=self.user,
            conversation_id='conv-123',
            question='How to fix issue?',
            answer='Here is the solution...',
            article_ref=self.article
        )
        self.assertEqual(log.get_article_title(), 'Test Article')