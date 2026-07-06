from django.urls import path, include
from rest_framework.routers import DefaultRouter
from analytics.views import AuditLogViewSet

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

app_name = 'analytics'

urlpatterns = [
    path('', include(router.urls)),
]