from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
User = get_user_model()

def create_regular_user(**kwargs):
    """Create a user with default values that can be overridden."""
    user_obj = {
        'username': 'usertest',
        'email': 'test@gmail.com',
        'password': '12345',
        'role': 'viewer',
        'department': 'IT'
    }
    user_obj.update(kwargs)
    try:
        user= User(**user_obj)
        user.set_password('12345')
        user.full_clean()
        user.save()
        return user
    except ValidationError:
        raise
    

def create_admin():
    """Create an admin user."""
    admin = User(
        username='admin',
        email='admin@gmail.com',
        password='12345',
        role='admin',
        department='Management'
    )
    try:
        admin.set_password('12345')
        admin.full_clean()
        admin.save()
        return admin
    except ValidationError:
        raise