from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone


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
        from_email=settings.DEFAULT_FROM_EMAIL, #conf in settings
        recipient_list=[to_email], #users email
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
    
def send_article_submitted_email(admin, article, editor):
    """Send email to admin when an article is submitted for review."""
    subject = f"New Article Submitted for Review: {article.title}"
    template_name = "emails/article_submitted.html"
    context = {
        'admin_username': admin.username,
        'article_title': article.title,
        'article_slug': article.slug,
        'editor_username': editor.username,
        'submitted_at': timezone.now().strftime("%B %d, %Y at %I:%M %p"),
        'review_url': f"{settings.FRONTEND_URL}/admin/articles/{article.id}/review/",
    }
    send_email(admin.email, subject, template_name, context)


def send_article_published_email(editor, article, admin):
    """Send email to editor when their article is published."""
    subject = f"Your Article Has Been Published: {article.title}"
    template_name = "emails/article_published.html"
    context = {
        'editor_username': editor.username,
        'article_title': article.title,
        'article_slug': article.slug,
        'admin_username': admin.username,
        'published_at': timezone.now().strftime("%B %d, %Y at %I:%M %p"),
        'article_url': f"{settings.FRONTEND_URL}/articles/{article.slug}/",
    }
    send_email(editor.email, subject, template_name, context)


def send_article_rejected_email(editor, article, admin, reason):
    """Send email to editor when their article is rejected."""
    subject = f"Article Rejected: {article.title}"
    template_name = "emails/article_rejected.html"
    context = {
        'editor_username': editor.username,
        'article_title': article.title,
        'admin_username': admin.username,
        'reason': reason,
        'rejected_at': timezone.now().strftime("%B %d, %Y at %I:%M %p"),
        'edit_url': f"{settings.FRONTEND_URL}/articles/{article.slug}/edit/",
    }
    send_email(editor.email, subject, template_name, context)