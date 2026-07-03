from django.contrib.auth import get_user_model

User = get_user_model()

def create_user(**kwargs):
    """Create a user with default values that can be overridden."""
    user_obj = {
        'username': 'usertest',
        'email': 'test@gmail.com',
        'password': '12345',
        'role': 'viewer',
        'department': 'IT'
    }
    user_obj.update(kwargs)
    return User.objects.create_user(**user_obj)

def create_admin():
    """Create an admin user."""
    return User.objects.create_user(
        username='admin',
        email='admin@gmail.com',
        password='12345',
        role='admin',
        department='Management'
    )