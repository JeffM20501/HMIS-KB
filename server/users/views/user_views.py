from django.shortcuts import render

# Create your views here.

from django.contrib.auth import get_user_model
from rest_framework import permissions,viewsets
from rest_framework.views import APIView
from users.permissions import *
from rest_framework.response import Response
from rest_framework import status,serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action

from ..serializers.user_serializers import UserSerializer
from ..serializers.password_reset_serializer import PasswordResetConfirmSerializer,PasswordResetRequestSerializer



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
            permission_classes=[permissions.AllowAny]
        elif self.action in ['update','partial_update']:
            permission_classes=[IsOwnerOrReadOnly|IsAdmin]
        elif self.action=='destroy':
            permission_classes=[IsAdmin]
        else: 
            permission_classes=[permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_update(self, serializer): 
        if 'password' in  self.request.data:
            instance=self.get_object()
            instance.set_password(self.request.data.get('password'))
            self.request.data._mutable=True
            del self.request.data['password']
            self.request.data._mutable=False
        serializer.save()
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard(self, request):
        """GET /api/v1/users/dashboard/ → Current user's profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """GET /api/v1/u/users/me/ → Current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def admin_dashboard(self, request):
        """GET /api/v1/users/admin_dashboard/ → Admin stats"""
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

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def admin_users(self, request):
        """ List all users (admin only)"""
        users = get_user_model().objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def change_role(self, request,user_id):
        """PATCH /api/v1/users/{id}/change_role/ → Change user role"""
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
    
    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        """
        POST /api/v1/u/users/{id}/set-password/
        Change password for a logged-in user.
        """
        user = self.get_object()
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': 'Current password and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {'message': 'Password updated successfully.'},
            status=status.HTTP_200_OK
        )

