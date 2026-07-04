from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from users.test.helper import create_regular_user


class BaseAPITestCase(TestCase):
    """Base test class with JWT authentication helper."""

    def setUp(self):
        self.client = APIClient()
        self.user = create_regular_user(
            username='base_test_user',
            email='base@test.com'
        )

    def _get_token(self, user):
        """Get JWT token for a user."""
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': user.username,
            'password': '12345' 
        })
        return response.data['access']

    def _login(self, user):
        """Log in a user using JWT token."""
        token = self._get_token(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def _create_and_login_user(self, role='viewer', **kwargs):
        """Create a user with the given role and log them in."""
        if 'username' not in kwargs:
            kwargs['username'] = f'{role}_test_user'
        if 'email' not in kwargs:
            kwargs['email'] = f'{role}_test@test.com'
        
        user = create_regular_user(role=role, **kwargs)
        self._login(user)
        return user

    def _create_and_login_admin(self):
        """Create and login an admin user."""
        from users.test.helper import create_admin
        admin = create_admin()
        self._login(admin)
        return admin