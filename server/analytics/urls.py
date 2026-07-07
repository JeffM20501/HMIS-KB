from django.urls import path, include
from rest_framework.routers import DefaultRouter
from analytics.views import AuditLogViewSet,FeedbackViewSet,ChatLogViewSet

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'feedbacks', FeedbackViewSet, basename='feedback')
router.register(r'chat-logs', ChatLogViewSet, basename='chat-log')

app_name = 'analytics'

urlpatterns = [
    path('', include(router.urls)),
]