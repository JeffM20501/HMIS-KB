from rest_framework.views import APIView
from users.serializers.password_reset_serializer import PasswordResetRequestSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle

class RequestPasswordResetView(APIView):
    permission_classes = []
    throttle_classes=[ScopedRateThrottle]
    throttle_scope='request_pwd_reset'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "If an account with that email exists, an OTP has been sent."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)