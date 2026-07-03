from django.test import TestCase
from django.core.exceptions import ValidationError
from users.validators import *
from users.test.helper import create_user


class ValidatorTest(TestCase):
    """Test each validator individually."""
    
    
    
    def test_validate_username_valid(self):
        result = validate_username('validuser')
        self.assertEqual(result, 'validuser')
    
    def test_validate_username_empty(self):
        with self.assertRaises(ValidationError) as context:
            validate_username('')
        self.assertIn('required', str(context.exception))
    
    def test_validate_username_duplicate(self):
        create_user(username='existing')
        with self.assertRaises(ValidationError) as context:
            validate_username('existing')
        self.assertIn('already taken', str(context.exception))
    
    
    
    def test_validate_email_valid(self):
        result = validate_email('test@example.com')
        self.assertEqual(result, 'test@example.com')
    
    def test_validate_email_empty(self):
        with self.assertRaises(ValidationError):
            validate_email('')
    
    def test_validate_email_duplicate(self):
        create_user(email='existing@test.com')
        with self.assertRaises(ValidationError):
            validate_email('existing@test.com')
    
    def test_validate_email_invalid_format(self):
        with self.assertRaises(ValidationError):
            validate_email('invalid-email')
    
    
    
    def test_validate_role_valid(self):
        for role in ['admin', 'editor', 'viewer']:
            result = validate_role(role)
            self.assertEqual(result, role)
    
    def test_validate_role_invalid(self):
        with self.assertRaises(ValidationError) as context:
            validate_role('invalid_role')
        self.assertIn('not a valid role', str(context.exception))
    
    def test_validate_role_empty(self):
        with self.assertRaises(ValidationError):
            validate_role('')
    
    
    
    def test_validate_department_valid(self):
        result = validate_department('IT')
        self.assertEqual(result, 'IT')
    
    def test_validate_department_empty(self):
        with self.assertRaises(ValidationError):
            validate_department('')
    
    
    
    def test_validate_password_valid(self):
        result = validate_password('Secure123')
        self.assertEqual(result, 'Secure123')
    
    def test_validate_password_empty(self):
        with self.assertRaises(ValidationError):
            validate_password('')
    
    def test_validate_password_min_length(self):
        with self.assertRaises(ValidationError):
            validate_password('Short1')
    
    def test_validate_password_no_digit(self):
        with self.assertRaises(ValidationError):
            validate_password('NoDigitHere')
    
    def test_validate_password_no_uppercase(self):
        with self.assertRaises(ValidationError):
            validate_password('nouppercase1')
    
    def test_validate_password_no_lowercase(self):
        with self.assertRaises(ValidationError):
            validate_password('NOLOWERCASE1')
    
    
    
    def test_validate_admin_department_admin_management(self):
        validate_admin_department('admin', 'Management')
    
    def test_validate_admin_department_admin_not_management(self):
        with self.assertRaises(ValidationError):
            validate_admin_department('admin', 'IT')
    
    def test_validate_admin_department_non_admin_management(self):
        with self.assertRaises(ValidationError):
            validate_admin_department('viewer', 'Management')
    
    def test_validate_admin_department_non_admin_valid(self):
        validate_admin_department('viewer', 'IT')