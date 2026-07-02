from django.urls import reverse
from django.test import TestCase
from helper import create_user,create_article
from analytics.models import ChatLog

class ChatLogModelTest(TestCase):
    """Test the ChatLog model directly."""
    
    def test_chat_log_creation(self):
        user = create_user(role='viewer')
        article = create_article(user)
        
        chat_log = ChatLog.objects.create(
            user=user,
            conversation_id='conv-123-456',
            question='How do I fix Error 404?',
            answer='To fix Error 404, check your internet connection...',
            article_ref=article,
            was_helpful=True
        )
        
        self.assertEqual(chat_log.user, user)
        self.assertEqual(chat_log.conversation_id, 'conv-123-456')
        self.assertEqual(chat_log.question, 'How do I fix Error 404?')
        self.assertEqual(chat_log.article_ref, article)
        self.assertTrue(chat_log.was_helpful)
        self.assertIsNotNone(chat_log.created_at)

    def test_chat_log_multiple_questions_same_conversation(self):
        user = create_user(role='viewer')
        article = create_article(user)
        conv_id = 'conv-789-abc'
        
        # First question
        log1 = ChatLog.objects.create(
            user=user,
            conversation_id=conv_id,
            question='What is HMIS?',
            answer='HMIS is a Health Management Information System...',
            article_ref=article
        )
        
        # Second question (follow-up)
        log2 = ChatLog.objects.create(
            user=user,
            conversation_id=conv_id,
            question='How do I login?',
            answer='To login, go to the login page...',
            article_ref=article
        )
        
        # Both should have the same conversation_id
        self.assertEqual(log1.conversation_id, log2.conversation_id)
        self.assertEqual(log1.user, log2.user)

    def test_chat_log_was_helpful_default(self):
        user = create_user(role='viewer')
        article = create_article(user)
        
        log = ChatLog.objects.create(
            user=user,
            conversation_id='conv-123',
            question='Test question?',
            answer='Test answer'
        )
        self.assertIsNone(log.was_helpful)  # Should be null initially


class ChatAPITest(TestCase):
    """Test the Chatbot API endpoint."""
    
    def setUp(self):
        self.user = create_user(role='viewer')
        self.article = create_article(self.user)

    def test_unauthenticated_cannot_use_chat(self):
        url = reverse('chat-list')
        response = self.client.post(url, {
            'question': 'How do I fix Error 404?',
            'conversation_id': 'conv-123'
        })
        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_ask_question(self):
        self.client.force_login(self.user)
        url = reverse('chat-list')
        response = self.client.post(url, {
            'question': 'How do I fix Error 404?',
            'conversation_id': 'conv-123-456'
        })
        self.assertEqual(response.status_code, 200)
        
        # Check that the response contains answer and article reference
        self.assertIn('answer', response.data)
        self.assertIn('article_ref', response.data)
        self.assertIn('was_grounded', response.data)

    def test_chat_logs_question(self):
        self.client.force_login(self.user)
        url = reverse('chat-list')
        
        response = self.client.post(url, {
            'question': 'How do I fix Error 404?',
            'conversation_id': 'conv-123-456'
        })
        self.assertEqual(response.status_code, 200)
        
        # Check that the chat was logged
        chat_logs = ChatLog.objects.filter(user=self.user)
        self.assertEqual(chat_logs.count(), 1)
        self.assertEqual(chat_logs.first().question, 'How do I fix Error 404?')

    def test_chat_returns_grounded_answer(self):
        self.client.force_login(self.user)
        url = reverse('chat-list')
        
        response = self.client.post(url, {
            'question': 'How do I fix Error 404?',
            'conversation_id': 'conv-123-456'
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['was_grounded'])
        self.assertEqual(response.data['article_ref']['id'], self.article.id)

    def test_chat_handles_unknown_question(self):
        self.client.force_login(self.user)
        url = reverse('chat-list')
        
        response = self.client.post(url, {
            'question': 'What is the meaning of life?',
            'conversation_id': 'conv-123-456'
        })
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['was_grounded'])
        self.assertIn('I cannot find an answer', response.data['answer'])