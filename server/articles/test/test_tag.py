from django.test import TestCase
from articles.test.helper import create_tag,create_user,create_category,create_article

class TagTest(TestCase):
    """Test the Tag model."""
    
    def test_tag_creation(self):
        tag = create_tag('SOP')
        self.assertEqual(tag.name, 'SOP')
        self.assertEqual(tag.slug, 'sop')

    def test_tag_str_method(self):
        tag = create_tag('FAQs')
        self.assertEqual(str(tag), 'FAQs')

    def test_article_can_have_multiple_tags(self):
        author = create_user(role='editor')
        category = create_category()
        article = create_article(author, category)
        
        tag1 = create_tag('Emergency')
        tag2 = create_tag('SOP')
        
        article.tags.add(tag1, tag2)
        self.assertEqual(article.tags.count(), 2)
        self.assertIn(tag1, article.tags.all())
        self.assertIn(tag2, article.tags.all())