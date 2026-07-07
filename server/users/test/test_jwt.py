from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from utils.base_helper_auth import BaseAPITestCase
import jwt
from django.conf import settings
from datetime import timedelta

User = get_user_model()


def setup_url(url_name):
    return reverse(url_name)


class AuthTest(BaseAPITestCase):
    """Test JWT authentication."""

    def test_get_token(self):
        """Test that valid credentials return a token."""
        user = self._create_and_login_user(username='jwt', email='jwt@gmail.com')
        url = setup_url('token_obtain_pair')
        response = self.client.post(url, {
            'username': 'jwt',
            'password': '12345'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_refresh_token(self):
        """Test that refresh token returns a new access token."""
        user = self._create_and_login_user(username='jwt', email='jwt@gmail.com')
        url = setup_url('token_obtain_pair')
        response = self.client.post(url, {
            'username': 'jwt',
            'password': '12345'
        })
        refresh_token = response.data.get('refresh')

        url = setup_url('token_refresh')
        response = self.client.post(url, {
            'refresh': refresh_token
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_get_token_invalid_credentials(self):
        """Test that invalid credentials return 401."""
        url = setup_url('token_obtain_pair')
        response = self.client.post(url, {
            'username': 'wrong',
            'password': 'wrong'
        })
        self.assertEqual(response.status_code, 401)

    def test_authenticated_request_with_jwt(self):
        """Test that a valid JWT token authenticates the user."""
        # Create a user and get token
        user = self._create_and_login_user(username='jwt', email='jwt@gmail.com')
        url = setup_url('token_obtain_pair')
        response = self.client.post(url, {
            'username': 'jwt',
            'password': '12345'
        })
        token = response.data.get('access')

        # Use token to access protected endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = setup_url('users:user-list')
        response = self.client.get(url, content_type='application/json')
        # The token is valid, but authorization may fail (403)
        # We just want to ensure it's not 401
        self.assertNotEqual(response.status_code, 401)

    def test_unauthenticated_request_blocked(self):
        """Test that requests without token are blocked."""
        url = setup_url('users:user-list')
        response = self.client.get(url, content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_token_contains_user_id(self):
        """Test that the token contains user ID."""
        user = self._create_and_login_user(username='jwt', email='jwt@gmail.com')
        url = setup_url('token_obtain_pair')
        response = self.client.post(url, {
            'username': 'jwt',
            'password': '12345'
        })
        token = response.data.get('access')
        self.assertIsNotNone(token, "Token should not be None")

        # Decode the token (without verification for testing)
        decoded = jwt.decode(token, options={"verify_signature": False})
        self.assertEqual(int(decoded.get('user_id')), user.id)

    def test_custom_user_from_token(self):
        """Test that request.user is correctly set from token."""
        user = self._create_and_login_user(username='jwt', email='jwt@gmail.com')
        url = setup_url('token_obtain_pair')
        response = self.client.post(url, {
            'username': 'jwt',
            'password': '12345'
        })
        token = response.data.get('access')
        self.assertIsNotNone(token, "Token should not be None")

        # Make authenticated request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('users:user-detail', kwargs={'pk': user.id})
        response = self.client.get(url, content_type='application/json')

        # The response should contain the user data (200 OK)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('username'), 'jwt')
    
    def test_token_verify_valid_token(self):
        """Test that a valid token passes verification."""
        user = self._create_and_login_user(username='jwt', email='jwt@gmail.com')
        
        # Get a token
        url = setup_url('token_obtain_pair')
        response = self.client.post(url, {
            'username': 'jwt',
            'password': '12345'
        })
        token = response.data.get('access')
        
        # Verify the token
        url = setup_url('token_verify')
        response = self.client.post(url, {
            'token': token
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        # TokenVerifyView returns an empty response on success

    def test_token_verify_invalid_token(self):
        """Test that an invalid token fails verification."""
        url = setup_url('token_verify')
        response = self.client.post(url, {
            'token': 'invalid.token.here'
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('detail', response.data)
        self.assertEqual(str(response.data['detail']), 'Token is invalid')

    def test_token_verify_expired_token(self):
        """Test that an expired token fails verification."""
        user = self._create_and_login_user(username='jwt', email='jwt@gmail.com')
        
        # Manually create an expired token
        from rest_framework_simplejwt.tokens import AccessToken
        
        token = AccessToken()
        # Set the expiration to 1 second ago
        token.set_exp(lifetime=-timedelta(seconds=1))
        token['user_id'] = user.id
        expired_token = str(token)
        
        # Verify the expired token
        url = setup_url('token_verify')
        response = self.client.post(url, {
            'token': expired_token
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('detail', response.data)