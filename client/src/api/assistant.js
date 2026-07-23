import client from "./client";

/**
 * POST /api/v1/chat/
 * This is the main chatbot endpoint (RAGPipeline).
 *
 * Request:
 *   { question: string, conversation_id?: string }
 *
 * Response:
 *   {
 *     answer: string,
 *     article_ref: { id, title, slug } | null,
 *     was_grounded: boolean,
 *     confidence_score: number | null,
 *     chat_log_id: number
 *   }
 */
export const askAssistant = (question, conversationId = null) =>
  client
    .post("/chat/", {
      question,
      conversation_id: conversationId || `conv_${Date.now()}`,
    })
    
      .then((res) => ({
        id: res.data.chat_log_id,
        content: res.data.answer,
        sources: res.data.article_ref,
        was_grounded: res.data.was_grounded,
    }));

/**
 * PATCH /api/v1/analytics/chat-logs/:id/ — FR-5.10 "was this helpful"
 * This updates the chat log with user feedback.
 */
export const rateAssistantMessage = (chatLogId, helpful) =>
  client.patch(`/analytics/chat-logs/${chatLogId}/`, { was_helpful: helpful })
  .then((res) => res.data);

/**
 * POST /api/v1/analytics/feedbacks/ — alternative way to add feedback
 * Use this if you want to create a feedback entry instead of updating chat log.
 */
export const provideChatFeedback = (chatLogId, helpful, comment = "") =>
  client
    .post("/analytics/feedbacks/", {
      content_type: "chat",
      object_id: chatLogId,
      helpful,
      comment,
    })
    
      .then((res) => res.data);

/**
 * Escalation is not yet implemented (FR-5.11 is P2).
 * Placeholder for future: POST /analytics/chat-logs/:id/escalate/
 */
export const escalateAssistantSession = (chatLogId) =>
  Promise.reject(new Error("Escalation isn't wired up on the backend yet."));