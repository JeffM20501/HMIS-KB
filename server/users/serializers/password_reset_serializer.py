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
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        email = data['email'].strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError("Email not found.")

        # Find a verified, unused, non‑expired OTP
        otp_obj = PasswordResetOTP.objects.filter(
            user=user,
            used=False,
            verified=True,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()

        if not otp_obj:
            # Provide specific feedback
            if PasswordResetOTP.objects.filter(user=user, used=False, expires_at__gt=timezone.now()).exists():
                raise serializers.ValidationError("OTP not yet verified. Please verify your OTP first.")
            else:
                raise serializers.ValidationError("No valid OTP found. Request a new one.")

        self.otp_obj = otp_obj
        self.user = user
        return data

    def save(self, **kwargs):
        self.user.set_password(self.validated_data['new_password'])
        self.user.save()
        self.otp_obj.mark_used()
        return self.user
    
class VerifyOTPSerializer(serializers.Serializer):
    email=serializers.EmailField()
    otp=serializers.CharField(max_length=6)
    
    def validate_email(self, value):
        user = User.objects.filter(email__iexact=value.strip()).first()
        if not user:
            raise serializers.ValidationError('Email not found')
        self.user = user
        return value
    
    def validate_otp(self,value):
        otp_obj=PasswordResetOTP.objects.filter(
            otp=value,
            used=False,
            expires_at__gt=timezone.now()
        ).first()
        
        if not otp_obj:
            raise serializers.ValidationError('Invalid or expired OTP')
        
        self.otp_obj=otp_obj
        
        return value
    
    def save(self,**kwargs):
        self.otp_obj.mark_verified()
        
        return self.otp_obj