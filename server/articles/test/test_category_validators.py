from django.test import TestCase
from django.core.exceptions import ValidationError
from articles.validators.category_validator import validate_name, validate_slug


class CategoryValidatorTest(TestCase):
    """Test category validators."""
    
    def test_validate_name_valid(self):
        result = validate_name('Patient Management')
        self.assertEqual(result, 'Patient Management')
    
    def test_validate_name_empty(self):
        with self.assertRaises(ValidationError):
            validate_name('')
    
    def test_validate_name_too_short(self):
        with self.assertRaises(ValidationError):
            validate_name('A')
    
    def test_validate_name_too_long(self):
        with self.assertRaises(ValidationError):
            validate_name('A' * 101)
    
    def test_validate_slug_valid(self):
        result = validate_slug('patient-management')
        self.assertEqual(result, 'patient-management')
    
    def test_validate_slug_with_uppercase(self):
        with self.assertRaises(ValidationError):
            validate_slug('Patient-Management')
    
    def test_validate_slug_with_space(self):
        with self.assertRaises(ValidationError):
            validate_slug('patient management')