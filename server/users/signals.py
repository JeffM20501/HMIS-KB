from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from utils.email_utils import send_welcome_email

User = get_user_model()

@receiver(post_save, sender=User)
def send_welcome_email_on_create(sender, instance, created, **kwargs):
    if created:
        send_welcome_email(instance)