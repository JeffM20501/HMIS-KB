from django.urls import path
from chatbot.views.chatbot_views import ChatbotView

app_name = 'chatbot'

urlpatterns = [
    path('', ChatbotView.as_view(), name='chatbot'),
]