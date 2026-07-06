from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from users.validators import validate_admin_department,validate_department,validate_role
# Create your models here.
ROLES=[
        ('admin','Admin',),
        ('viewer','Viewer',),
        ('editor','Editor',)
    ]


class User(AbstractUser):
    department=models.CharField(default="staff", validators=[validate_department])
    role=models.CharField(max_length=20,choices=ROLES, default="viewer", validators=[validate_role])
    updated_at=models.DateTimeField(auto_now=True)    
    
    def clean(self):
        
        super().clean()
    
        role=getattr(self,'role',None)
        department=getattr(self,'department',None)
        
        if role and department:
            validate_admin_department(role,department)
        
    
    def __str__(self):
        return self.username
    