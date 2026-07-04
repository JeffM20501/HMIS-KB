from users.test.helper import create_regular_user
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthTest(TestCase):
    
    def setUp(self):
        self.client = APIClient()
        self.user = create_regular_user()  
    
    def test_get_token(self):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': 'usertest',      
            'password': '12345'           
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
    
    def test_refresh_token(self):
        
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': 'usertest',
            'password': '12345'
        })
        
        refresh_token = response.data.get('refresh')
        
        url = reverse('token_refresh')
        response = self.client.post(url, {
            'refresh': refresh_token
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_get_token_invalid_credentials(self):
        url=reverse('token_obtain_pair')
        res=self.client.post(url,{'username':'wrong','password':'wrong'})
        
        self.assertEqual(res.status_code,401)