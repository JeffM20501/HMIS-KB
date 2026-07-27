from django.contrib import admin

from chatbot.models import ArticleChunk, Conversation


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user', 'session_key', 'is_archived', 'message_count', 'updated_at']
    list_filter = ['is_archived', 'created_at']
    search_fields = ['title', 'user__username', 'session_key']
    readonly_fields = ['created_at', 'updated_at']

    def message_count(self, obj):
        return obj.messages.count()


@admin.register(ArticleChunk)
class ArticleChunkAdmin(admin.ModelAdmin):
    list_display = ['id', 'article', 'chunk_index', 'token_count', 'embedding_model', 'updated_at']
    list_filter = ['embedding_model', 'created_at']
    search_fields = ['article__title', 'content']
    readonly_fields = ['created_at', 'updated_at']
    # The raw vector isn't useful to look at in admin — everything else is.
    exclude = ['embedding']
