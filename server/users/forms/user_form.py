from django import forms
from django.core.exceptions import ValidationError
from users.models import User


class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'department', 'role', 'password']

    def clean_username(self):
        """Validate that the username is not already taken."""
        username = self.cleaned_data.get('username')
        
        if not username:
            raise ValidationError("Username is required.")
        
        if User.objects.filter(username=username).exists():
            raise ValidationError("Username already taken.")
        
        return username

    def clean_email(self):
        """Validate that the email is valid and not already taken."""
        email = self.cleaned_data.get('email')
        
        if not email:
            raise ValidationError("Email is required.")
        
        return email

    def clean_password(self):
        password = self.cleaned_data.get('password')
        
        if not password:
            raise ValidationError("Password is required.")
        
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long.")
        
        if not any(char.isdigit() for char in password):
            raise ValidationError('Password} must contain at least one digit')
        
        if not any(char.isuper() for char in password):
            raise ValidationError('Password must contain at least 1 uppercase letter')
        
        if not any(char.islower() for char in password):
            raise ValidationError('Password must contain at least 1 lowercase letter')
    
        
        return password
    
    def clean_department(self):
        department=self.cleaned_data.get('department')
        
        if not department:
            raise ValidationError('Department required')
        
        return department
    
    def clean_role(self):
        ROLES=['admin','editor','viewer']
        role=self.cleaned_data.get('role')
        
        if not role and role not in ROLES:
            raise ValidationError('Role required and should be either admin,editor,or viewer')
        
        return role
    

    def clean(self):
        
        cleaned_data = super().clean()  
        
        role = cleaned_data.get('role')
        department = cleaned_data.get('department')
        
        if role == 'admin' and department != 'Management':
            self.add_error('department', 'Admin users must be in the Management department.')
        
        if role!='admin' and department=='Management':
            self.add_error('department', 'Regular users must not be in Managment department')
        
        return cleaned_data