from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from rest_framework import permissions,viewsets

from .serializers import GroupSerializer, UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
        API endpoint that allows users to be viewed or edited
    """
    
    queryset = get_user_model().objects.all().order_by("-date_joined")
    serializer_class=UserSerializer
    permission_classes=[permissions.IsAuthenticated]

class GroupViewSet(viewsets.ModelViewSet):
    """
        API endpoint allows groups to ba viewed or edited
    """
    queryset=Group.objects.all().order_by("name")
    serializer_class=GroupSerializer
    permission_classes=[permissions.IsAuthenticated]

def index(response):
    return HttpResponse('Users Views')