import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Send, Bot, User, ExternalLink, ThumbsUp, ThumbsDown, Loader2, LifeBuoy } from "lucide-react";
import { askAssistant, rateAssistantMessage, escalateAssistantSession } from "../../api/assistant";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm the HealthKB Assistant. Ask me anything about HMIS — patient registration, clinical modules, troubleshooting, or system administration. I only answer from published Knowledge Base articles.",
  sources: [],
};

function makeSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function KBAssistant({ onClose }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(makeSessionId);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const query = input.trim();
    if (!query || isTyping) return;
    setInput("");

    const userMsg = { id: `u_${Date.now()}`, role: "user", content: query };
    const loadingId = `a_${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: loadingId, role: "assistant", content: "", loading: true }]);
    setIsTyping(true);

    try {
      const data = await askAssistant(query, sessionId, { screen: location.pathname });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                loading: false,
                content:
                  data.content ??
                  "I couldn't find relevant information in the knowledge base for that question. You can rephrase, browse the Knowledge Base, or escalate to support.",
                sources: data.sources ?? [],
                helpful: null,
              }
            : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                loading: false,
                content: err.message || "The assistant is temporarily unavailable. Please try again shortly.",
                sources: [],
                error: true,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const markHelpful = (id, val) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, helpful: val } : m)));
    rateAssistantMessage(id, val).catch(() => {});
  };

  const handleEscalate = async () => {
    try {
      const data = await escalateAssistantSession(sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          role: "assistant",
          content: data.ticketId
            ? `Escalated to support — ticket #${data.ticketId} created with this conversation attached.`
            : "Escalated to support with this conversation attached.",
          sources: [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          role: "assistant",
          content: "Couldn't reach the support desk automatically — please open a ticket manually for now.",
          sources: [],
          error: true,
        },
      ]);
    }
  };

  return (
    <div
      className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
      style={{ width: 360, height: 500, background: "white", border: "1px solid #E1E3EA" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: "#06033A", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-center rounded-full" style={{ width: 30, height: 30, background: "#F22F46" }}>
          <Bot size={15} color="white" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "white" }}>KB Assistant</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00A368" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Always answers from KB only</span>
          </div>
        </div>
        <button className="ml-auto hover:opacity-70 transition-opacity" onClick={onClose}>
          <X size={16} color="rgba(255,255,255,0.6)" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: "#F9FAFB" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 26,
                height: 26,
                background: msg.role === "assistant" ? "#F22F46" : "#E8E8EC",
                alignSelf: "flex-start",
                marginTop: 2,
              }}
            >
              {msg.role === "assistant" ? <Bot size={13} color="white" /> : <User size={13} color="#696E7A" />}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="rounded-lg px-3 py-2.5 text-sm leading-relaxed"
                style={{
                  background: msg.role === "user" ? "#F22F46" : "white",
                  color: msg.role === "user" ? "white" : msg.error ? "#C21B2E" : "#121C2D",
                  border: msg.role === "assistant" ? "1px solid #E1E3EA" : "none",
                  maxWidth: "100%",
                }}
              >
                {msg.loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin" style={{ color: "#9EA6B3" }} />
                    <span style={{ color: "#9EA6B3" }}>Searching knowledge base…</span>
                  </span>
                ) : (
                  <div
                    className="assistant-response"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                    style={{
                      wordBreak: "break-word",
                      fontSize: "0.875rem",
                      lineHeight: "1.6",
                    }}
                  />
                )}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.sources.map((src) => (
                    <button
                      key={src.id}
                      onClick={() => navigate(`/app/knowledge-base/${src.slug ?? src.id}`)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-white transition-colors w-full text-left"
                      style={{ background: "rgba(2,99,224,0.04)", border: "1px solid rgba(2,99,224,0.12)", color: "#0263E0" }}
                    >
                      <ExternalLink size={11} />
                      <span className="truncate">{src.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {msg.role === "assistant" && !msg.loading && msg.id !== "welcome" && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: "#9EA6B3" }}>Helpful?</span>
                  <button
                    onClick={() => markHelpful(msg.id, true)}
                    className="p-1 rounded transition-colors hover:bg-green-50"
                    style={{ color: msg.helpful === true ? "#00A368" : "#9EA6B3" }}
                  >
                    <ThumbsUp size={12} />
                  </button>
                  <button
                    onClick={() => markHelpful(msg.id, false)}
                    className="p-1 rounded transition-colors hover:bg-red-50"
                    style={{ color: msg.helpful === false ? "#F22F46" : "#9EA6B3" }}
                  >
                    <ThumbsDown size={12} />
                  </button>
                  {(!msg.sources || msg.sources.length === 0) && (
                    <button
                      onClick={handleEscalate}
                      className="ml-auto flex items-center gap-1 text-xs hover:underline"
                      style={{ color: "#F22F46" }}
                    >
                      <LifeBuoy size={12} /> Escalate to support
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t bg-white" style={{ borderColor: "#E1E3EA" }}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask a question..."
            className="flex-1 px-3 py-2 text-sm rounded-md border outline-none"
            style={{ borderColor: "#E1E3EA", color: "#121C2D", fontSize: 13 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#F22F46")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E1E3EA")}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="flex items-center justify-center rounded-md transition-opacity disabled:opacity-40"
            style={{ width: 34, height: 34, background: "#F22F46", flexShrink: 0 }}
          >
            <Send size={14} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}