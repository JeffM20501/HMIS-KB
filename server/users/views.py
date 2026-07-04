from django.shortcuts import render

# Create your views here.

from django.contrib.auth import get_user_model
from rest_framework import permissions,viewsets
from rest_framework.views import APIView
from users.permissions import *
from rest_framework.response import Response
from rest_framework import status,serializers

from .serializers import UserSerializer


User=get_user_model()
class UserViewSet(viewsets.ModelViewSet):
    """
        API endpoint that allows users to be viewed or edited
    """
    
    queryset = get_user_model().objects.all().order_by("-date_joined")
    serializer_class=UserSerializer
    
    
    def get_permissions(self):
        if self.action in ['list']:
            permission_classes=[CanListUsers]
        elif self.action in ['retrieve']:
            permission_classes=[permissions.IsAuthenticated]        
        elif self.action =='create' :
            permission_classes=[IsAdmin]
        elif self.action in ['update','partial_update']:
            permission_classes=[IsOwnerOrReadOnly|IsAdmin]
        elif self.action=='destroy':
            permission_classes=[IsAdmin]
        else: 
            permission_classes=[permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_update(self, serializer):
        instance=self.get_object()
        new_role=self.request.data.get('role')
        
        if new_role and new_role!=instance.role:
            if self.request.user.role!='admin':
                raise serializers.ValidationError({'role':'Only admin can change user roles'})
        serializer.save()

class ListUsers(APIView):
    
    permission_classes=[IsAdmin]
    
    def get(self,request,format=None):
        users=  User.objects.all()
        serializer=UserSerializer(users,many=True)
        return Response(serializer.data)

class ChangeUserRole(APIView):
    permission_classes=[IsAdmin]
    
    def patch(self,request,user_id,format=None):
        try:
            user=User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error':'User not found'},status=status.HTTP_404_NOT_FOUND)
        
        new_role=request.data.get('role')
        
        if new_role not in ['admin','editor','viewer']:
            return Response({'error':'Invaild role'},status=status.HTTP_400_BAD_REQUEST)
        
        user.role=new_role
        user.save()
        return Response({'message':f'User role Updated to {new_role}'},status=status.HTTP_200_OK)
    
    
class AdminDashboard(APIView):
    permission_classes=[IsAdmin]
    
    def get(self,request, role, format=None):
        
        total_users=User.objects.count()
        admins = User.objects.filter(role='admin').count()
        editors = User.objects.filter(role='editor').count()
        viewers = User.objects.filter(role='viewer').count()
        
        data={
            'total_users': total_users,
            'admins': admins,
            'editors': editors,
            'viewers': viewers,
        }
        return Response(data)

class Dashboard(APIView):
    permission_classes=[permissions.IsAuthenticated]
    
    def get(self,request,format=None):
        serializer=UserSerializer(request.user)
        return Response(serializer.data)
    
    

