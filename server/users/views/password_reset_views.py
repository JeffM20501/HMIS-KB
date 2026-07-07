from users.serializers.password_reset_serializer import PasswordResetConfirmSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView


class ResetPasswordView(APIView):
    """
    POST /api/v1/auth/reset-password/
    """
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password reset successful."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)