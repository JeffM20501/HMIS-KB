from django.test import TestCase
from helper import create_article,create_category,create_user

class CategoryTest(TestCase):
    """Test the Category model."""
    
    def test_category_creation(self):
        category = create_category('Getting Started')
        self.assertEqual(category.name, 'Getting Started')
        self.assertEqual(category.slug, 'getting-started')
        self.assertIsNotNone(category.description)

    def test_category_str_method(self):
        category = create_category('Patient Management')
        self.assertEqual(str(category), 'Patient Management')

    def test_category_can_have_articles(self):
        author = create_user(role='editor')
        category = create_category('Billing')
        article = create_article(author, category)
        self.assertEqual(category.articles.count(), 1)
        self.assertEqual(category.articles.first(), article)