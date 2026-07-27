from rest_framework import permissions


class IsConversationOwner(permissions.BasePermission):
    """
    Object-level permission for Conversation rename/archive/delete/detail —
    a conversation belongs to whoever asked the questions in it (an
    authenticated user, or an anonymous visitor identified by session key).
    This is the guard against the "never allow one user to access another
    user's private information" requirement, applied to conversation
    history specifically (chat message content itself never crosses users
    since retrieval only ever reads published articles, which are public
    by definition).
    """

    def has_object_permission(self, request, view, obj):
        return obj.owned_by(request)
