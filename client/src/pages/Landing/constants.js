import { Search, MessageCircle, Shield, BarChart3, Zap, Lock } from "lucide-react";

export const features = [
    { icon: Search, title: "Instant Full-Text Search", desc: "Find any SOP, guide, or procedure in under 500ms. Search by title, content, tags, or category — ranked by relevance.", color: "#0263E0" },
    { icon: MessageCircle, title: "Embedded KB Assistant", desc: "A floating chatbot your staff can query right inside HMIS. Answers come only from approved KB content — never hallucinated.", color: "#F22F46" },
    { icon: Shield, title: "Role-Based Access Control", desc: "Viewer, Editor, and Admin roles with granular permissions. Clinical SOPs are gated. Audit logs for every action.", color: "#00A368" },
    { icon: BarChart3, title: "Analytics Dashboard", desc: "Track which articles are most read, what staff are searching for, and where knowledge gaps exist.", color: "#7B2FBE" },
    { icon: Zap, title: "Structured Content Templates", desc: "How-To, SOP, FAQ, Troubleshooting, Feature Reference, and Release Notes — standardized formats that prevent freeform chaos.", color: "#E87722" },
    { icon: Lock, title: "Healthcare-Grade Security", desc: "HTTPS enforced, bcrypt passwords, JWT sessions, rate-limited login, SQL injection prevention, and XSS protection.", color: "#243656" },
];

export const testimonials = [
    { quote: "New nurses used to spend 3 weeks getting comfortable with HMIS. With HealthKB, they're independent in under 10 days.", name: "Dr. Catherine Mwangi", role: "Chief Nursing Officer, Kenyatta National Hospital", avatar: "CM" },
    { quote: "The embedded chatbot is genuinely useful mid-workflow. Staff don't need to context-switch to find an answer anymore.", name: "Alex Otieno", role: "HMIS Systems Administrator", avatar: "AO" },
    { quote: "Compliance audits used to be stressful. Now every SOP is versioned, reviewed, and auditable. Game changer.", name: "Faith Njeri", role: "Compliance & Data Protection Officer", avatar: "FN" },
];

export const howItWorks = [
    { step: "01", title: "Search or ask", desc: "Type a query in the search bar or ask the KB Assistant a natural-language question directly inside HMIS." },
    { step: "02", title: "Get ranked results", desc: "Articles are ranked by relevance — title matches first, then tags, then body. The assistant cites its source every time." },
    { step: "03", title: "Read, act, give feedback", desc: "Read the article in a clean distraction-free view. Rate it, leave a comment, or escalate to support with one click." },
];

export const heroAvatars = ["AW", "GM", "SK", "FN", "DO"];

export const trustBadges = [
    "No credit card required",
    "HTTPS enforced",
    "Data stays in Kenya",
];