from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone

User = get_user_model()


class Notification(models.Model):
    """
    PRD: Notification system for user actions.
    """
    
    # Notification Types
    TYPE_ARTICLE_SUBMITTED = 'article_submitted'
    TYPE_ARTICLE_PUBLISHED = 'article_published'
    TYPE_ARTICLE_REJECTED = 'article_rejected'
    TYPE_COMMENT_ADDED = 'comment_added'
    TYPE_ROLE_CHANGED = 'role_changed'
    
    NOTIFICATION_TYPES = [
        (TYPE_ARTICLE_SUBMITTED, 'Article Submitted for Review'),
        (TYPE_ARTICLE_PUBLISHED, 'Article Published'),
        (TYPE_ARTICLE_REJECTED, 'Article Rejected'),
        (TYPE_COMMENT_ADDED, 'Comment Added'),
        (TYPE_ROLE_CHANGED, 'Role Changed'),
    ]
    
    # Who receives the notification
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    # Who triggered the notification
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    
    # Notification type
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES
    )
    
    # What object is this about (Generic Foreign Key)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Notification content
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.URLField(max_length=500, blank=True)
    
    # Read status
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Email notification status
    email_sent = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'read']),
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"{self.recipient.username} → {self.title[:50]}"
    
    def mark_read(self):
        """Mark notification as read."""
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save()
    
    def mark_unread(self):
        """Mark notification as unread."""
        if self.read:
            self.read = False
            self.read_at = None
            self.save()
    
    @classmethod
    def create_article_submitted_notification(cls, article, editor, admins):
        """Create notifications for admins when an article is submitted."""
        notifications = []
        for admin in admins:
            notification = cls.objects.create(
                recipient=admin,
                sender=editor,
                notification_type=cls.TYPE_ARTICLE_SUBMITTED,
                content_object=article,
                title=f"Article Submitted for Review",
                message=f"'{article.title}' has been submitted for review by {editor.username}.",
                link=f"/articles/{article.id}/"
            )
            notifications.append(notification)
        return notifications
    
    @classmethod
    def create_article_published_notification(cls, article, admin):
        """Create notification for editor when their article is published."""
        return cls.objects.create(
            recipient=article.author,
            sender=admin,
            notification_type=cls.TYPE_ARTICLE_PUBLISHED,
            content_object=article,
            title="Article Published",
            message=f"Your article '{article.title}' has been published by {admin.username}.",
            link=f"/articles/{article.id}/"
        )
    
    @classmethod
    def create_article_rejected_notification(cls, article, admin, reason):
        """Create notification for editor when their article is rejected."""
        return cls.objects.create(
            recipient=article.author,
            sender=admin,
            notification_type=cls.TYPE_ARTICLE_REJECTED,
            content_object=article,
            title="Article Rejected",
            message=f"Your article '{article.title}' was rejected. Reason: {reason}",
            link=f"/articles/{article.id}/"
        )