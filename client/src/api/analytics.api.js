import api from './axios';

// --- Search logs ---
export const logSearch = (payload) => api.post('/analytics/search-logs/', payload).then((r) => r.data);
export const getSearchLogStats = (params) => api.get('/analytics/search-logs/stats/', { params }).then((r) => r.data);
export const getMySearches = (params) => api.get('/analytics/search-logs/my_searches/', { params }).then((r) => r.data);

// --- Chat logs ---
export const getChatLogStats = (params) => api.get('/analytics/chat-logs/stats/', { params }).then((r) => r.data);
export const getUnansweredChats = (params) => api.get('/analytics/chat-logs/unanswered/', { params }).then((r) => r.data);
export const getChatConversation = (conversationId) =>
  api.get('/analytics/chat-logs/conversation/', { params: { conversation_id: conversationId } }).then((r) => r.data);

// --- Feedback (article ratings, "was this helpful") ---
export const submitFeedback = (payload) => api.post('/analytics/feedbacks/', payload).then((r) => r.data);
export const getFeedbackForObject = (params) => api.get('/analytics/feedbacks/for_object/', { params }).then((r) => r.data);
export const getMyFeedback = (params) => api.get('/analytics/feedbacks/my_feedback/', { params }).then((r) => r.data);
export const getFeedbackStats = (params) => api.get('/analytics/feedbacks/stats/', { params }).then((r) => r.data);

// --- Notifications ---
export const listNotifications = (params) => api.get('/analytics/notification/', { params }).then((r) => r.data);
export const markNotificationRead = (id) => api.post(`/analytics/notification/${id}/mark_read/`).then((r) => r.data);
export const markNotificationUnread = (id) => api.post(`/analytics/notification/${id}/mark_unread/`).then((r) => r.data);
export const markAllNotificationsRead = () => api.post('/analytics/notification/mark_all_read/').then((r) => r.data);
export const getUnreadNotificationCount = () => api.get('/analytics/notification/unread_count/').then((r) => r.data);

// --- Audit logs ---
export const listAuditLogs = (params) => api.get('/analytics/audit-logs/', { params }).then((r) => r.data);
export const getAuditLogStats = (params) => api.get('/analytics/audit-logs/stats/', { params }).then((r) => r.data);

// --- Article view logging + time-series (charts) ---
export const logArticleView = (articleId) => api.post('/analytics/articleviewlog/', { article: articleId }).then((r) => r.data);
export const getTimeSeriesStats = (params) => api.get('/analytics/time-series/', { params }).then((r) => r.data);
