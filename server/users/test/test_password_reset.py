from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from users.models.password_reset_otp import PasswordResetOTP
from users.test.helper import create_regular_user
from unittest.mock import patch

User = get_user_model()


class PasswordResetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_regular_user(email='test@example.com', username='testuser')

    @patch('users.serializers.password_reset_serializer.send_password_reset_email')
    def test_request_reset_valid(self, mock_send):
        url = reverse('users:request-password-reset')
        response = self.client.post(url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(PasswordResetOTP.objects.count(), 1)
        self.assertTrue(mock_send.called)

    def test_request_reset_email_not_found(self):
        url = reverse('users:request-password-reset')
        response = self.client.post(url, {'email': 'unknown@example.com'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('Email not found', str(response.data))

    def test_reset_password_valid(self):
        # Create OTP
        otp_obj = PasswordResetOTP.generate_otp(self.user)
        url = reverse('users:reset-password')
        response = self.client.post(url, {
            'email': 'test@example.com',
            'otp': otp_obj.otp,
            'new_password': 'NewSecurePass123'
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecurePass123'))
        otp_obj.refresh_from_db()
        self.assertTrue(otp_obj.used)

    def test_reset_password_invalid_otp(self):
        url = reverse('users:reset-password')
        response = self.client.post(url, {
            'email': 'test@example.com',
            'otp': '000000',
            'new_password': 'NewSecurePass123'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid or expired OTP', str(response.data))