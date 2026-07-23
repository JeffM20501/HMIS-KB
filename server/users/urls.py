from django.urls import path
from rest_framework.routers import DefaultRouter
from django.urls import include

from users.views import UserViewSet, ResetPasswordView,RequestPasswordResetView,VerifyOtpView
router=DefaultRouter()

router.register(r'users', UserViewSet, basename='user')


app_name='users'

urlpatterns = [
    path('', include(router.urls)),
    path('auth/request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('auth/verify-otp/',VerifyOtpView.as_view(),name='verify-otp'),
    
]
