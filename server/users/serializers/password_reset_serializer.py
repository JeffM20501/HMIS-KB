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
        request = self.context.get('request')
        email = data['email']
        user = User.objects.get(email=email)

        # Check session flag
        if not request or not request.session.get('password_reset_verified'):
            raise serializers.ValidationError(
                "OTP verification required. Please verify your OTP first."
            )

        # Find any valid unused OTP ignoring verified flag
        
        otp_obj = PasswordResetOTP.objects.filter(
            user=user,
            used=False,
            expires_at__gt=timezone.now()
        ).first()

        if not otp_obj:
            raise serializers.ValidationError(
                "No valid OTP found. Request a new one."
            )

        self.otp_obj = otp_obj
        self.user = user
        return data

    def save(self, **kwargs):
        self.user.set_password(self.validated_data['new_password'])
        self.user.save()
        self.otp_obj.mark_used()  # mark OTP as used
        return self.user
    
class VerifyOTPSerializer(serializers.Serializer):
    email=serializers.EmailField()
    otp=serializers.CharField(max_length=6)
    
    def validate_email(self,value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email not found')
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
        self.otp_obj.verified=True
        self.otp_obj.save()
        
        return self.otp_obj