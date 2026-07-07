from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_email(to_email, subject, template_name, context):
    """
    Send an email using Brevo SMTP.
    Template can be HTML or plain text.
    """
    html_message = render_to_string(template_name, context)
    plain_message = strip_tags(html_message)

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to_email],
        html_message=html_message,
        fail_silently=False,
    )


def send_welcome_email(user):
    """Send welcome email to a newly registered user."""
    subject = "Welcome to HMIS Knowledge Base"
    template_name = "emails/welcome.html"
    context = {
        'username': user.username,
        'email': user.email,
        'login_url': '/login',  # Adjust to your frontend login URL
    }
    send_email(user.email, subject, template_name, context)


def send_password_reset_email(user, otp_code):
    """Send password reset email with OTP."""
    subject = "Password Reset Request - HMIS Knowledge Base"
    template_name = "emails/password_reset.html"
    context = {
        'username': user.username,
        'otp': otp_code,
        'expiry_minutes': 30,
        'reset_url': '/reset-password',  # Frontend URL
    }
    send_email(user.email, subject, template_name, context)