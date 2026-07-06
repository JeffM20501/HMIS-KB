"""
Test helper functions for articles app.
Provides reusable factories for creating test data.
"""
from django.contrib.auth import get_user_model
from articles.models import Article, Category, Tag

User = get_user_model()

_user_counter = 0


def _get_next_username():
    """Generate a unique username for tests."""
    global _user_counter
    _user_counter += 1
    return f'testuser_{_user_counter}'



def create_user(role='viewer', **kwargs):
    """Create a user with unique username."""
    if 'username' not in kwargs:
        kwargs['username'] = _get_next_username()
    if 'email' not in kwargs:
        kwargs['email'] = f'{kwargs["username"]}@test.com'
    
    user = User.objects.create_user(
        username=kwargs['username'],
        email=kwargs['email'],
        password=kwargs.get('password', '12345'),
        role=role,
        department=kwargs.get('department', 'IT')
    )
    return user


def create_admin():
    """Create an admin user."""
    return create_user(role='admin', username='admin_test', email='admin@test.com')



def create_category(name='Troubleshooting', **kwargs):
    """Create a category."""
    slug = kwargs.pop('slug', name.lower().replace(' ', '-'))
    return Category.objects.create(
        name=name,
        slug=slug,
        description=kwargs.pop('description', f'Category for {name}'),
        **kwargs
    )



def create_tag(name='Emergency', **kwargs):
    """Create a tag."""
    slug = kwargs.pop('slug', name.lower().replace(' ', '-'))
    return Tag.objects.create(
        name=name,
        slug=slug,
        description=kwargs.pop('description', f'Tag for {name}'),
        **kwargs
    )

def create_article(author, category=None, status='draft', **kwargs):
    """Create an article."""
    if category is None:
        category = create_category()
    
    return Article.objects.create(
        title=kwargs.get('title', 'Test Article'),
        slug=kwargs.get('slug', 'test-article'),
        content=kwargs.get('content', 'This is test content for the article.'),
        category=category,
        author=author,
        status=status,
        views=kwargs.get('views', 0)
    )