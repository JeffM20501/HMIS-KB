from rest_framework.views import APIView 
from users.permissions import IsAdmin
from rest_framework.response import Response
from rest_framework import status

class Healthy(APIView):
    permission_classes=[]
    
    def get(self, request):
        return Response(
            {'message':'Healthy'},
            status.HTTP_200_OK
        )