from django.apps import AppConfig


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'

    def ready(self):
        # Import triggers the @receiver registrations in signals.py — this
        # is the standard Django pattern for wiring signals at app startup
        # (previously not done at all; the embedding pipeline had no
        # automatic trigger anywhere).
        import chatbot.signals  # noqa: F401
