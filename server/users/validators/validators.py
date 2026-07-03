
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

User=get_user_model()

def validate_username(value):
    
    if not value:
        raise ValidationError(('%{value} is required'),params={'value':value})
    
    if User.objects.filter(username=value).exists():
        raise ValidationError(('%{value} already taken'),params={'value':value})
    
    return value 


def validate_email(value):
    if not value:
        raise ValidationError(('%{value} is required'),params={'value':value})
    
    if User.objects.filter(email=value).exists():
        raise ValidationError(('%{value} already taken'),params={'value':value})
    
    return value 

def validate_role(value):
    ROLES=['admin','editor','viewer']
    if not value:
        raise ValidationError(('%{value} is required'),params={'value':value})
    
    if value not in ROLES:
        raise ValidationError(('%{value} invlaid role. Must one of this: %{roles}'),params={'value':value, 'roles':'. '.join(ROLES)})
    
    return value

def validate_department(value):
    if not value:
        raise ValidationError(('%{value} is required'),params={'value':value})
    
    return value

def validate_password(value):
    if not value:
        raise ValidationError(('%{value} is required'),params={'value':value})
    
    if len(value)<8:
        raise ValidationError(('%{value} must be at least 8 characters long'),params={'value':value})
    
    if not any(char.isdigit() for char in value):
        raise ValidationError(('%{value} must contain at least one digit'),params={'value':value})
    
    if not any(char.isupper() for char in value):
        raise ValidationError(('%{value} must contain at least 1 uppercase letter'),params={'value':value})
    
    if not any(char.islower() for char in value):
        raise ValidationError(('%{value} must contain at least 1 lowercase letter'),params={'value':value})
    
    return value
    

# Cross-Field Validator 
def validate_admin_department(role,department):
    if role=='admin' and department!='Management':
        raise ValidationError(('%{value} users must be in %{department} department'),params={'role':role, 'department':department})
    
    if role!='admin' and department=='Management':
        raise ValidationError(('%{value} can not be in the %{department} department'),params={'role':role, 'department':department})
    
