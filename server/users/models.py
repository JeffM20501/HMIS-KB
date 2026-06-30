from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
# Create your models here.

class User(AbstractUser):
    ROLES=[
        ('admin','Admin',),
        ('viewer','Viewer',),
        ('editor','Editor',)
    ]
    role=models.CharField(max_length=20,choices=ROLES, default="viewer")
    updated_at=models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.username