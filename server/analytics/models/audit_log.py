from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError

User = get_user_model()


class AuditLog(models.Model):
    """
    PRD FR-3.6: Audit trail for admin actions.
    Records who did what, when, and on which object.
    """
    
    # Action types
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    ACTION_PUBLISH = 'publish'
    ACTION_REJECT = 'reject'
    ACTION_SUBMIT = 'submit'
    ACTION_LOGIN = 'login'
    ACTION_LOGOUT = 'logout'
    ACTION_ROLE_CHANGE = 'role_change'
    ACTION_VIEW = 'view'
    ACTION_EXPORT = 'export'
    
    ACTION_CHOICES = [
        (ACTION_CREATE, 'Create'),
        (ACTION_UPDATE, 'Update'),
        (ACTION_DELETE, 'Delete'),
        (ACTION_PUBLISH, 'Publish'),
        (ACTION_REJECT, 'Reject'),
        (ACTION_SUBMIT, 'Submit for Review'),
        (ACTION_LOGIN, 'Login'),
        (ACTION_LOGOUT, 'Logout'),
        (ACTION_ROLE_CHANGE, 'Role Change'),
        (ACTION_VIEW, 'View'),
        (ACTION_EXPORT, 'Export'),
    ]
    
    # Who performed the action
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="User who performed the action"
    )
    user_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the user"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="Browser/device information"
    )
    
    # What action was performed
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Type of action performed"
    )
    
    # Which object was affected
    content_type = models.CharField(
        max_length=100,
        help_text="Model name (e.g., 'Article', 'User', 'Category')"
    )
    object_id = models.PositiveIntegerField(
        help_text="ID of the object affected"
    )
    object_repr = models.CharField(
        max_length=200,
        blank=True,
        help_text="String representation of the object"
    )
    
    # What changed (for updates)
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text="Dictionary of changes made (field: old_value -> new_value)"
    )
    
    # Additional context
    reason = models.TextField(
        blank=True,
        help_text="Optional reason for the action (e.g., rejection reason)"
    )
    
    # When it happened
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the action was performed"
    )
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        verbose_name_plural = 'Audit Logs'
    
    def __str__(self):
        user_name = self.user.username if self.user else 'Anonymous'
        return f"{user_name} → {self.action} {self.content_type} #{self.object_id} at {self.timestamp}"
    
    @classmethod
    def log_action(cls, user, action, obj, changes=None, **kwargs):
        """
        Helper method to log an action.
        
        Args:
            user: The user performing the action
            action: The action type (from ACTION_CHOICES)
            obj: The Django model instance being acted upon
            changes: Dict of changes made (for updates)
            **kwargs: Additional fields (reason, ip, user_agent)
        """
        return cls.objects.create(
            user=user,
            action=action,
            content_type=obj.__class__.__name__,
            object_id=obj.pk,
            object_repr=str(obj),
            changes=changes or {},
            **kwargs
        )