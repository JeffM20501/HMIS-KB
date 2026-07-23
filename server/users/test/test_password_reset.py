from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from users.models.password_reset_otp import PasswordResetOTP
from users.test.helper import create_regular_user
from unittest.mock import patch
from django.utils import timezone

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
        # 1. Generate OTP
        otp_obj = PasswordResetOTP.generate_otp(self.user)
        # 2. Mark it as verified (simulate OTP verification step)
        otp_obj.verified = True
        otp_obj.save()
        # 3. Call reset endpoint (no OTP in payload)
        url = reverse('users:reset-password')
        response = self.client.post(url, {
            'email': 'test@example.com',
            'new_password': 'NewSecurePass123'
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecurePass123'))
        otp_obj.refresh_from_db()
        self.assertTrue(otp_obj.used)  # OTP marked used after reset

    def test_reset_password_without_verification(self):
        # 1. Generate OTP but do NOT mark verified
        otp_obj = PasswordResetOTP.generate_otp(self.user)
        # 2. Call reset without verification
        url = reverse('users:reset-password')
        response = self.client.post(url, {
            'email': 'test@example.com',
            'new_password': 'NewSecurePass123'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('OTP not yet verified', str(response.data))
        # OTP should still be unused and unverified
        otp_obj.refresh_from_db()
        self.assertFalse(otp_obj.used)
        self.assertFalse(otp_obj.verified)

    def test_reset_password_invalid_email(self):
        url = reverse('users:reset-password')
        response = self.client.post(url, {
            'email': 'wrong@example.com',
            'new_password': 'NewSecurePass123'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('Email not found', str(response.data))

    def test_reset_password_expired_otp(self):
        # 1. Generate OTP and mark it verified but expired
        otp_obj = PasswordResetOTP.generate_otp(self.user)
        otp_obj.expires_at = timezone.now() - timezone.timedelta(minutes=1)
        otp_obj.verified = True
        otp_obj.save()
        # 2. Call reset
        url = reverse('users:reset-password')
        response = self.client.post(url, {
            'email': 'test@example.com',
            'new_password': 'NewSecurePass123'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('No valid OTP found', str(response.data))

    def test_reset_password_missing_email(self):
        url = reverse('users:reset-password')
        response = self.client.post(url, {
            'new_password': 'NewSecurePass123'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', str(response.data))