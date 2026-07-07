from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import random
import string

User = get_user_model()


class PasswordResetOTP(models.Model):
    """
    Stores OTP for password reset.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_otps')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.user.email} - {self.otp}"

    @classmethod
    def generate_otp(cls, user):
        """Generate a 6-digit OTP and save it with 30-min expiry."""
        # Delete any existing unused OTPs for this user
        cls.objects.filter(user=user, used=False).delete()

        otp_code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timezone.timedelta(minutes=30)

        otp_obj = cls.objects.create(
            user=user,
            otp=otp_code,
            expires_at=expires_at
        )
        return otp_obj

    def is_valid(self):
        """Check if OTP is valid (not used, not expired)."""
        if self.used:
            return False
        if timezone.now() > self.expires_at:
            return False
        return True

    def mark_used(self):
        """Mark OTP as used."""
        self.used = True
        self.save()