from django.test import TestCase
from django.core.exceptions import ValidationError
from articles.validators.tag_validator import validate_name, validate_slug


class TagValidatorTest(TestCase):
    """Test tag validators."""
    
    def test_validate_name_valid(self):
        result = validate_name('Emergency')
        self.assertEqual(result, 'Emergency')
    
    def test_validate_name_empty(self):
        with self.assertRaises(ValidationError):
            validate_name('')
    
    def test_validate_name_too_short(self):
        with self.assertRaises(ValidationError):
            validate_name('A')
    
    def test_validate_name_too_long(self):
        with self.assertRaises(ValidationError):
            validate_name('A' * 51)
    
    def test_validate_name_invalid_characters(self):
        with self.assertRaises(ValidationError):
            validate_name('Invalid@#$')
    
    def test_validate_slug_valid(self):
        result = validate_slug('emergency')
        self.assertEqual(result, 'emergency')
    
    def test_validate_slug_with_uppercase(self):
        with self.assertRaises(ValidationError):
            validate_slug('Emergency')
    
    def test_validate_slug_with_space(self):
        with self.assertRaises(ValidationError):
            validate_slug('emergency tag')
    
    def test_validate_slug_special_chars(self):
        with self.assertRaises(ValidationError):
            validate_slug('emergency!@#')