from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models.password_reset_otp import PasswordResetOTP
from django.utils import timezone
from utils.email_utils import send_password_reset_email

User = get_user_model()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        """Check if user exists."""
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email not found.")
        return value

    def save(self, **kwargs):
        """Generate OTP and send email."""
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        otp_obj = PasswordResetOTP.generate_otp(user)
        send_password_reset_email(user, otp_obj.otp)
        return user


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email not found.")
        return value

    def validate(self, data):
        email = data['email']
        otp = data['otp']
        user = User.objects.get(email=email)

        # Find the latest unused OTP for this user
        otp_obj = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp,
            used=False
        ).first()

        if not otp_obj:
            raise serializers.ValidationError("Invalid or expired OTP.")

        if not otp_obj.is_valid():
            raise serializers.ValidationError("OTP has expired.")

        self.otp_obj = otp_obj
        self.user = user
        return data

    def save(self, **kwargs):
        """Reset password and mark OTP as used."""
        self.user.set_password(self.validated_data['new_password'])
        self.user.save()
        self.otp_obj.mark_used()
        return self.user