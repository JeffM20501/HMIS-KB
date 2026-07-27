from django.apps import AppConfig


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'

    def ready(self):
        # Registers the post_save/post_delete signal receivers that keep
        # ArticleChunk embeddings synchronized with Article changes. Must be
        # imported here (not at module import time) — Django's signal
        # dispatch relies on receivers being connected during app startup,
        # and importing signals.py anywhere else risks it happening before
        # the app registry is ready or, worse, not happening at all if that
        # module is never otherwise imported.
        import chatbot.signals  # noqa: F401
