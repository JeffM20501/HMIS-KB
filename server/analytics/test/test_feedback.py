from django.test import TestCase
from django.urls import reverse
from analytics.models import Feedback
from helper import create_user,create_article


class FeedbackModelTest(TestCase):
    """Test the Feedback model directly."""
    
    def test_feedback_creation(self):
        user = create_user(role='viewer')
        article = create_article(user)
        
        feedback = Feedback.objects.create(
            article=article,
            user=user,
            rating=4,
            comment='Very helpful article!'
        )
        
        self.assertEqual(feedback.article, article)
        self.assertEqual(feedback.user, user)
        self.assertEqual(feedback.rating, 4)
        self.assertEqual(feedback.comment, 'Very helpful article!')
        self.assertIsNotNone(feedback.created_at)

    def test_feedback_rating_min_max(self):
        user = create_user(role='viewer')
        article = create_article(user)
        
        # Test valid ratings
        for rating in [1, 2, 3, 4, 5]:
            feedback = Feedback.objects.create(
                article=article,
                user=user,
                rating=rating
            )
            self.assertEqual(feedback.rating, rating)

    def test_feedback_str_method(self):
        user = create_user(role='viewer')
        article = create_article(user)
        feedback = Feedback.objects.create(
            article=article,
            user=user,
            rating=5,
            comment='Excellent!'
        )
        expected = f"Feedback by usertest on Test Article (5/5)"
        self.assertEqual(str(feedback), expected)


class FeedbackAPITest(TestCase):
    """Test the Feedback API endpoints."""
    
    def setUp(self):
        self.user = create_user(role='viewer')
        self.article = create_article(self.user)

    def test_unauthenticated_cannot_submit_feedback(self):
        url = reverse('feedback-list')
        response = self.client.post(url, {
            'article_id': self.article.id,
            'rating': 5,
            'comment': 'Great!'
        })
        self.assertEqual(response.status_code, 401)

    def test_viewer_can_submit_feedback(self):
        self.client.force_login(self.user)
        url = reverse('feedback-list')
        response = self.client.post(url, {
            'article': self.article.id,
            'rating': 5,
            'comment': 'Excellent guide!'
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Feedback.objects.count(), 1)
        
        feedback = Feedback.objects.first()
        self.assertEqual(feedback.user, self.user)
        self.assertEqual(feedback.article, self.article)
        self.assertEqual(feedback.rating, 5)

    def test_user_cannot_submit_multiple_feedback_for_same_article(self):
        """Test that a user can only submit one feedback per article."""
        self.client.force_login(self.user)
        url = reverse('feedback-list')
        
        # First feedback
        response1 = self.client.post(url, {
            'article': self.article.id,
            'rating': 4,
            'comment': 'Good'
        })
        self.assertEqual(response1.status_code, 201)
        
        # Second feedback (should fail or update existing)
        response2 = self.client.post(url, {
            'article': self.article.id,
            'rating': 5,
            'comment': 'Actually, excellent!'
        })
        # Either returns 400 (bad request) or 200 (updated)
        self.assertIn(response2.status_code, [200, 400])

    def test_viewer_can_update_own_feedback(self):
        self.client.force_login(self.user)
        url = reverse('feedback-list')
        
        response = self.client.post(url, {
            'article': self.article.id,
            'rating': 3,
            'comment': 'Average'
        })
        self.assertEqual(response.status_code, 201)
        
        # Update the feedback
        feedback = Feedback.objects.first()
        url = reverse('feedback-detail', kwargs={'pk': feedback.id})
        response = self.client.patch(url, {
            'rating': 5,
            'comment': 'Actually, it was great!'
        })
        self.assertEqual(response.status_code, 200)
        feedback.refresh_from_db()
        self.assertEqual(feedback.rating, 5)
        self.assertEqual(feedback.comment, 'Actually, it was great!')