from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

# Counter for generating unique usernames in tests
_user_counter = 0

def _get_next_username():
    """Generate a unique username for tests."""
    global _user_counter
    _user_counter += 1
    return f'testuser_{_user_counter}'


def create_regular_user(**kwargs):
    """
    Create a user with default values that can be overridden.
    Uses a unique username by default.
    """
    if 'username' not in kwargs:
        kwargs['username'] = _get_next_username()
    
    user_obj = {
        'username': kwargs['username'],
        'email': kwargs.get('email', f'{kwargs["username"]}@test.com'),
        'password': kwargs.get('password', '12345'),
        'role': kwargs.get('role', 'viewer'),
        'department': kwargs.get('department', 'IT')
    }
    
    user_obj.update(kwargs)
    
    user = User(**user_obj)
    user.set_password(user_obj['password'])
    user.full_clean()  
    user.save()
    
    return user


def create_admin():
    """Create an admin user."""
    admin = User(
        username='admin_test',
        email='admin@test.com',
        role='admin',
        department='Management'
    )
    admin.set_password('12345')
    admin.full_clean()
    admin.save()
    return admin