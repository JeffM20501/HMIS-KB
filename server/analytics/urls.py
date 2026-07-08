from django.urls import path, include
from rest_framework.routers import DefaultRouter
from analytics.views import AuditLogViewSet,FeedbackViewSet,ChatLogViewSet,SearchLogViewSet,NotificationViewSet

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'feedbacks', FeedbackViewSet, basename='feedback')
router.register(r'chat-logs', ChatLogViewSet, basename='chat-log')
router.register(r'search-logs', SearchLogViewSet, basename='search-log')
router.register(r'notification', NotificationViewSet, basename='notification')

app_name = 'analytics'

urlpatterns = [
    path('', include(router.urls)),
]