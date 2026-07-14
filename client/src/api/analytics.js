import client from "./client";


// FEEDBACK


export const listFeedback = (params = {}) => client.get("/analytics/feedbacks/", { params }).then((res) => res.data);

export const createFeedback = (payload) => client.post("/analytics/feedbacks/", payload).then((res) => res.data);

export const getFeedbackStats = (contentType, objectId) =>
  client
    .get("/analytics/feedbacks/stats/", { params: { content_type: contentType, object_id: objectId } })
    .then((res) => res.data);

export const getMyFeedback = (params = {}) =>
  client.get("/analytics/feedbacks/my_feedback/", { params }).then((res) => res.data);

// SEARCH LOGS (FR-2.6)

export const listSearchLogs = (params = {}) => client.get("/analytics/search-logs/", { params }).then((res) => res.data);

export const createSearchLog = (payload) => client.post("/analytics/search-logs/", payload).then((res) => res.data);

export const getSearchStats = () => client.get("/analytics/search-logs/stats/").then((res) => res.data);

export const getMySearches = (params = {}) =>
  client.get("/analytics/search-logs/my_searches/", { params }).then((res) => res.data);


// CHAT LOGS (FR-5.7, FR-5.8)


export const listChatLogs = (params = {}) => client.get("/analytics/chat-logs/", { params }).then((res) => res.data);

export const getChatLog = (id) => client.get(`/analytics/chat-logs/${id}/`).then((res) => res.data);

export const getConversation = (conversationId) =>
  client.get("/analytics/chat-logs/conversation/", { params: { conversation_id: conversationId } }).then((res) => res.data);

export const getUnansweredQuestions = () => client.get("/analytics/chat-logs/unanswered/").then((res) => res.data);

export const getChatStats = () => client.get("/analytics/chat-logs/stats/").then((res) => res.data);

// AUDIT LOGS (FR-3.6)

export const listAuditLogs = (params = {}) => client.get("/analytics/audit-logs/", { params }).then((res) => res.data);

export const getAuditStats = () => client.get("/analytics/audit-logs/stats/").then((res) => res.data);


// NOTIFICATION


export const listNotifications = (params = {}) =>
  client.get("/analytics/notification/", { params }).then((res) => res.data);

export const markNotificationRead = (id) =>
  client.patch(`/analytics/notification/${id}/mark_read/`).then((res) => res.data);

export const markNotificationUnread = (id) =>
  client.patch(`/analytics/notification/${id}/mark_unread/`).then((res) => res.data);

export const markAllNotificationRead = () =>
  client.patch("/analytics/notification/mark_all_read/").then((res) => res.data);

export const getUnreadNotificationCount = () =>
  client.get("/analytics/notification/unread_count/").then((res) => res.data);


// DASHBOARD AGGREGATION

export const getPublicStats = () => client.get("/stats/").then((res) => res.data);

export async function getDashboardAnalytics() {
  const [feedback, searchLogs] = await Promise.all([
    listFeedback({ page_size: 200 }).catch(() => ({ results: [] })),
    listSearchLogs({ page_size: 200 }).catch(() => ({ results: [] })),
  ]);

  const feedbackList = feedback.results ?? feedback ?? [];
  const searchList = searchLogs.results ?? searchLogs ?? [];

  const ratings = feedbackList.filter((f) => typeof f.rating === "number");
  const avgRating = ratings.length ? ratings.reduce((s, f) => s + f.rating, 0) / ratings.length : 0;

  const ratingBuckets = [5, 4, 3, 2, 1].map((stars) => ({
    stars: `${stars}★`,
    count: ratings.filter((f) => f.rating === stars).length,
    color: ["#00A368", "#7EC86A", "#F7C948", "#E87722", "#F22F46"][5 - stars],
  }));

  const withResults = searchList.filter((s) => (s.result_count ?? 0) > 0).length;
  const searchSuccessRate = searchList.length ? Math.round((withResults / searchList.length) * 100) : 0;

  return {
    avgRating,
    ratingDistribution: ratingBuckets,
    searchSuccessRate,
    totalSearches: searchList.length,
    totalFeedback: feedbackList.length,
    timeSeries: [],
  };
}