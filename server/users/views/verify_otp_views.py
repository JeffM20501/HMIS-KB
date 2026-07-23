from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models.password_reset_otp import PasswordResetOTP

User=get_user_model()


class VerifyOtpView(APIView):
    """
    POST /api/v1/u/auth/verify-otp/
    Verify the OTP sent to the user's email.
    """
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response(
                {'error': 'Email and OTP are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            #return the same message regardless to prevent user enumeration
            return Response(
                {'error': 'Invalid OTP or email.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        #find the latest unused OTP for this user
        otp_obj = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp,
            used=False
        ).first()

        if not otp_obj:
            return Response(
                {'error': 'Invalid or expired OTP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        #check if OTP is still valid (not expired)
        if not otp_obj.is_valid():
            return Response(
                {'error': 'OTP has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        #otp is valid mark it as used
        otp_obj.mark_verified()

        return Response(
            {'message': 'OTP verified successfully.'},
            status=status.HTTP_200_OK
        )