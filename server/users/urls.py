from django.urls import path
from rest_framework.routers import DefaultRouter
from django.urls import include

from users.views import UserViewSet

router=DefaultRouter()

router.register(r'users', UserViewSet, basename='user')

app_name='users'

urlpatterns = [
    path('', include(router.urls))
]
