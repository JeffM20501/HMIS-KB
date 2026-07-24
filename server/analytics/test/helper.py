import uuid
from django.contrib.auth import get_user_model
from articles.models import Article, Category

User = get_user_model()

def unique_slug(base="test"):
    """Generate a unique slug to avoid IntegrityError in tests."""
    return f"{base}-{uuid.uuid4().hex[:8]}"

def create_user(role='viewer', username=None):
    if username is None:
        username = f"user_{uuid.uuid4().hex[:6]}"
    return User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password='12345',
        role=role,
        department='IT'
    )

def create_category():
    name = f"Category-{uuid.uuid4().hex[:8]}"
    slug = unique_slug("category")
    return Category.objects.create(
        name=name,
        slug=slug,
        description="Test category"
    )

def create_article(author, category=None, status='published'):
    if category is None:
        category = create_category()
    return Article.objects.create(
        title='Test Article',
        slug=unique_slug('article'),
        content='Test content ' * 20,  # ensure at least 50 chars
        category=category,
        author=author,
        status=status
    )