import api from './axios';

// POST /api/v1/chat/
// payload: { message, conversation_id?, context?: { module, screen } }
// response: { conversation_id, answer, sources: [{article_slug,title,confidence}], escalate_suggested }
export const sendChatMessage = (payload) => api.post('/chat/', payload).then((r) => r.data);
