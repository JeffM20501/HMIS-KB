from django.contrib import admin
from .models import Feedback,ChatLog,SearchLog,Notification


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'content_type', 'object_id', 'rating', 'helpful', 'created_at']
    list_filter = ['content_type', 'rating', 'helpful', 'created_at']
    search_fields = ['user__username', 'comment']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Object', {'fields': ('content_type', 'object_id')}),
        ('Feedback', {'fields': ('rating', 'helpful', 'comment')}),
        ('Timestamps', {'fields': ('created_at',)}),
    )

@admin.register(ChatLog)
class ChatLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'conversation_id', 'question_preview', 'was_helpful', 'created_at']
    list_filter = ['was_helpful', 'created_at', 'user']
    search_fields = ['user__username', 'question', 'answer']
    readonly_fields = ['created_at']
    
    def question_preview(self, obj):
        return obj.question[:50] + '...' if len(obj.question) > 50 else obj.question
    question_preview.short_description = 'Question'
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Conversation', {'fields': ('conversation_id',)}),
        ('Content', {'fields': ('question', 'answer')}),
        ('Reference', {'fields': ('article_ref',)}),
        ('Feedback', {'fields': ('was_helpful',)}),
        ('Metadata', {'fields': ('response_time', 'confidence_score')}),
        ('Timestamps', {'fields': ('created_at',)}),
    )

@admin.register(SearchLog)
class SearchLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'query_preview', 'result_count', 'created_at']
    list_filter = ['created_at', 'user']
    search_fields = ['user__username', 'query']
    readonly_fields = ['created_at']
    
    def query_preview(self, obj):
        return obj.query[:30] + '...' if len(obj.query) > 30 else obj.query
    query_preview.short_description = 'Query'
    

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'sender', 'title', 'notification_type', 'read', 'created_at']
    list_filter = ['notification_type', 'read', 'created_at']
    search_fields = ['recipient__username', 'sender__username', 'title', 'message']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Recipients', {
            'fields': ('recipient', 'sender')
        }),
        ('Notification', {
            'fields': ('notification_type', 'title', 'message', 'link')
        }),
        ('Status', {
            'fields': ('read', 'read_at', 'email_sent')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
