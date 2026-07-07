from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class RegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('users:user-list')

    def test_public_registration(self):
        """Test that anyone can register"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'Securepass123',
            'role': 'viewer',
            'department': 'IT'
        }
        response = self.client.post(self.url, data, content_type='application/json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['username'], 'newuser')

        # Verify user was created in database with hashed password
        user = User.objects.get(username='newuser')
        self.assertEqual(user.role, 'viewer')
        self.assertEqual(user.department, 'IT')
        self.assertTrue(user.check_password('Securepass123'))

    def test_registration_duplicate_username(self):
        """Test that duplicate username is rejected"""
        # Create first user
        User.objects.create_user(
            username='newuser',
            email='existing@test.com',
            password='pass123'
        )

        data = {
            'username': 'newuser',  # Already exists
            'email': 'newuser@test.com',
            'password': 'securepass123',
            'role': 'viewer',
            'department': 'IT'
        }
        response = self.client.post(self.url, data, content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('username', response.data)

    def test_registration_missing_password(self):
        """Test that password is required"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            # No password field
            'role': 'viewer',
            'department': 'IT'
        }
        response = self.client.post(self.url, data, content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)

    def test_registration_weak_password(self):
        """Test that weak password is rejected"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'weak',  # Too short
            'role': 'viewer',
            'department': 'IT'
        }
        response = self.client.post(self.url, data, content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)
        self.assertIn('at least 8 characters', str(response.data['password']))

    def test_registration_no_uppercase_password(self):
        """Test that password without uppercase is rejected"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'nouppercase123',  # No uppercase
            'role': 'viewer',
            'department': 'IT'
        }
        response = self.client.post(self.url, data, content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)
        self.assertIn('uppercase', str(response.data['password']))