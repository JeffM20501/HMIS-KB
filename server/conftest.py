import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

import pytest
from django.db.models.signals import post_save
from django.contrib.auth import get_user_model
from users.signals import send_welcome_email_on_create

@pytest.fixture(autouse=True)
def disable_email_signal():
    """Disable welcome email signal during tests."""
    #disable 
    post_save.disconnect(send_welcome_email_on_create, sender=get_user_model())
    yield
    #reconnect after test
    post_save.connect(send_welcome_email_on_create, sender=get_user_model())
    
    