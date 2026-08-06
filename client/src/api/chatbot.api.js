import api from './axios';

export const sendChatMessage = (payload) => api.post('/chat/', payload).then((r) => r.data);

export const listConversations = (params) =>
    api.get('/chat/conversations/', { params }).then((r) => r.data);

export const getConversationMessages = (id) =>
    api.get(`/chat/conversations/${id}/messages/`).then((r) => r.data);

export const renameConversation = (id, title) =>
    api.patch(`/chat/conversations/${id}/rename/`, { title }).then((r) => r.data);

export const archiveConversation = (id) =>
    api.patch(`/chat/conversations/${id}/archive/`).then((r) => r.data);

export const unarchiveConversation = (id) =>
    api.patch(`/chat/conversations/${id}/unarchive/`).then((r) => r.data);

export const deleteConversation = (id) =>
    api.delete(`/chat/conversations/${id}/`).then((r) => r.data);