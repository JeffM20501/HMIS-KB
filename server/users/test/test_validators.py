from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from users.validators.validators import *
from users.test.helper import create_user, create_admin

User = get_user_model()


class ValidatorTest(TestCase):
    """Test each validator individually."""
    
    
    def test_validate_username_valid(self):
        """Test that valid username passes."""
        result = validate_username('validuser')
        self.assertEqual(result, 'validuser')
    
    def test_validate_username_empty(self):
        """Test that empty username raises error."""
        with self.assertRaises(ValidationError) as context:
            validate_username('')
        self.assertIn('required', str(context.exception))
    
    def test_validate_username_duplicate(self):
        """Test that duplicate username raises error."""
        create_user(username='existing')
        with self.assertRaises(ValidationError) as context:
            validate_username('existing')
        self.assertIn('already taken', str(context.exception))
    
    
    def test_validate_email_valid(self):
        """Test that valid email passes."""
        result = validate_email('test@example.com')
        self.assertEqual(result, 'test@example.com')
    
    def test_validate_email_empty(self):
        """Test that empty email raises error."""
        with self.assertRaises(ValidationError):
            validate_email('')
    
    def test_validate_email_duplicate(self):
        """Test that duplicate email raises error."""
        create_user(email='existing@test.com')
        with self.assertRaises(ValidationError):
            validate_email('existing@test.com')
    
    def test_validate_email_invalid_format(self):
        """Test that invalid email format raises error."""
        with self.assertRaises(ValidationError):
            validate_email('invalid-email')

    
    def test_validate_role_valid(self):
        """Test that valid roles pass."""
        for role in ['admin', 'editor', 'viewer']:
            result = validate_role(role)
            self.assertEqual(result, role)
    
    def test_validate_role_invalid(self):
        """Test that invalid role raises error."""
        with self.assertRaises(ValidationError):
            validate_role('invalid_role')
    
    def test_validate_role_empty(self):
        """Test that empty role raises error."""
        with self.assertRaises(ValidationError):
            validate_role('')
    

    
    def test_validate_department_valid(self):
        """Test that valid department passes."""
        result = validate_department('IT')
        self.assertEqual(result, 'IT')
    
    def test_validate_department_empty(self):
        """Test that empty department raises error."""
        with self.assertRaises(ValidationError):
            validate_department('')
    
    
    def test_validate_password_valid(self):
        """Test that valid password passes."""
        result = validate_password('Secure123')
        self.assertEqual(result, 'Secure123')
    
    def test_validate_password_empty(self):
        """Test that empty password raises error."""
        with self.assertRaises(ValidationError):
            validate_password('')
    
    def test_validate_password_min_length(self):
        """Test that password too short raises error."""
        with self.assertRaises(ValidationError):
            validate_password('Short1')
    
    def test_validate_password_no_digit(self):
        """Test that password without digit raises error."""
        with self.assertRaises(ValidationError):
            validate_password('NoDigitHere')
    
    def test_validate_password_no_uppercase(self):
        """Test that password without uppercase raises error."""
        with self.assertRaises(ValidationError):
            validate_password('nouppercase1')
    
    def test_validate_password_no_lowercase(self):
        """Test that password without lowercase raises error."""
        with self.assertRaises(ValidationError):
            validate_password('NOLOWERCASE1')
    
    # Cross-Field Validator 
    
    def test_validate_admin_department_admin_management(self):
        """Test that admin in Management passes."""
        # This should not raise any error
        validate_admin_department('admin', 'Management')
    
    def test_validate_admin_department_admin_not_management(self):
        """Test that admin not in Management raises error."""
        with self.assertRaises(ValidationError):
            validate_admin_department('admin', 'IT')
    
    def test_validate_admin_department_non_admin_management(self):
        """Test that non-admin in Management raises error."""
        with self.assertRaises(ValidationError):
            validate_admin_department('viewer', 'Management')
    
    def test_validate_admin_department_non_admin_valid(self):
        """Test that non-admin in non-Management passes."""
        # This should not raise any error
        validate_admin_department('viewer', 'IT')