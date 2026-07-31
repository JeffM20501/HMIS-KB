from django.urls import include, path
from rest_framework.routers import DefaultRouter

from chatbot.views.chatbot_views import ChatbotView
from chatbot.views.conversation_views import ConversationViewSet

app_name = 'chatbot'

router = DefaultRouter()
router.register('conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', ChatbotView.as_view(), name='chatbot'),
    path('', include(router.urls)),
]
