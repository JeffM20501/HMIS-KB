from django.contrib import admin

from .models.user import *
# Register your models here.
admin.site.register(User)