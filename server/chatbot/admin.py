from django.contrib import admin

from chatbot.models import ArticleChunk, Conversation


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user', 'session_key', 'is_archived', 'updated_at']
    list_filter = ['is_archived']
    search_fields = ['title', 'user__username', 'session_key']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ArticleChunk)
class ArticleChunkAdmin(admin.ModelAdmin):
    # Deliberately not showing the raw `embedding` vector in the admin list
    # or as an editable field — a 384-float array is meaningless to look at
    # and editing it by hand would desync it from `content` silently.
    list_display = ['article', 'chunk_index', 'token_count', 'embedding_model', 'updated_at']
    list_filter = ['embedding_model']
    search_fields = ['article__title', 'content']
    readonly_fields = ['embedding', 'created_at', 'updated_at']
    autocomplete_fields = ['article']
