from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from chatbot.models import Conversation
from chatbot.permissions.conversation_permissions import IsConversationOwner
from chatbot.serializers.conversation_serializers import (
    ConversationMessageSerializer,
    ConversationRenameSerializer,
    ConversationSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    """
    Backs the chat-history requirements: list conversations, load a
    previous conversation's messages, rename, archive, and delete.

    Scoped per-requester in get_queryset (not just via object permission)
    so the list endpoint itself never returns another user's conversations
    — object-level permission alone only protects retrieve/update/delete
    of a specific id you already know, not enumeration via the list view.
    """

    serializer_class = ConversationSerializer
    permission_classes = [IsConversationOwner]
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        request = self.request
        if request.user.is_authenticated:
            qs = Conversation.objects.filter(user=request.user)
        else:
            session_key = request.session.session_key
            qs = Conversation.objects.filter(session_key=session_key) if session_key else Conversation.objects.none()
        include_archived = request.query_params.get('include_archived', '').lower() == 'true'
        return qs if include_archived else qs.filter(is_archived=False)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        logs = conversation.messages.order_by('created_at')
        serializer = ConversationMessageSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def rename(self, request, pk=None):
        conversation = self.get_object()
        serializer = ConversationRenameSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation.title = serializer.validated_data['title']
        conversation.save(update_fields=['title', 'updated_at'])
        return Response(ConversationSerializer(conversation).data)

    @action(detail=True, methods=['patch'])
    def archive(self, request, pk=None):
        conversation = self.get_object()
        conversation.is_archived = True
        conversation.save(update_fields=['is_archived', 'updated_at'])
        return Response(ConversationSerializer(conversation).data)

    @action(detail=True, methods=['patch'])
    def unarchive(self, request, pk=None):
        conversation = self.get_object()
        conversation.is_archived = False
        conversation.save(update_fields=['is_archived', 'updated_at'])
        return Response(ConversationSerializer(conversation).data)

    def destroy(self, request, *args, **kwargs):
        conversation = self.get_object()
        conversation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
