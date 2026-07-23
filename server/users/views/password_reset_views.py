from users.serializers.password_reset_serializer import PasswordResetConfirmSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from users.serializers.password_reset_serializer import VerifyOTPSerializer

class ResetPasswordView(APIView):
    """
    POST /api/v1/u/auth/reset-password/
    """
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(
            data=request.data,
            context={'request': request} 
        )
        if serializer.is_valid():
            serializer.save()
            
            request.session.pop('password_reset_verified', None)
            return Response(
                {"message": "Password reset successful."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class VerifyOtpView(APIView):
    '/api/v1/u/auth/verify-otp/'
    permission_classes = []

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()  # marks OTP as verified in DB
            #session flag
            request.session['password_reset_verified'] = True
            request.session.save()
            return Response(
                {"message": "OTP verified successfully"},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)