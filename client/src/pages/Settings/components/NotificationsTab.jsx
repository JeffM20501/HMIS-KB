// src/pages/Settings/components/NotificationsTab.jsx
import { useEffect, useState } from "react";
import { BellOff, Clock, Check, CheckCircle2, Loader2 } from "lucide-react";
import { listNotifications, markNotificationRead, markAllNotificationRead } from "../../../api/analytics.js";
import ErrorBanner from "../../../components/common/ErrorBanner.jsx";
import Spinner from "../../../components/common/Spinner.jsx";

export default function NotificationsTab() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [markingAll, setMarkingAll] = useState(false);

    const loadNotifications = () => {
    setLoading(true);
    listNotifications()
        .then((data) => setNotifications(data.results ?? data ?? []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    };

    useEffect(() => {
    loadNotifications();
    }, []);

    const handleMarkRead = async (id) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
        await markNotificationRead(id);
    } catch (err) {
        // Revert on error
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
        setError(err.message);
    }
    };

    const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
        await markAllNotificationRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
        setError(err.message);
    } finally {
        setMarkingAll(false);
    }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
    <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
        <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Notifications</h2>
        {unreadCount > 0 && (
            <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-xs font-medium hover:underline"
            style={{ color: "#F22F46" }}
            >
            {markingAll ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Mark all as read
            </button>
        )}
        </div>
        <p className="text-xs mb-5" style={{ color: "#9EA6B3" }}>
        {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
        </p>

        <ErrorBanner message={error} />

        {loading ? (
        <div className="py-8 flex justify-center"><Spinner label="Loading notifications…" /></div>
        ) : notifications.length === 0 ? (
        <div className="text-center py-10">
            <BellOff size={22} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
            <p className="text-sm" style={{ color: "#9EA6B3" }}>You're all caught up — no notifications.</p>
        </div>
        ) : (
        <div className="space-y-2">
            {notifications.map((n) => (
            <div
                key={n.id}
                className="flex items-start gap-3 px-4 py-3 rounded-md border transition-colors"
                style={{
                borderColor: "#E1E3EA",
                background: n.read ? "white" : "#FDEEF0",
                }}
            >
                {!n.read && (
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#F22F46" }} />
                )}
                <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "#121C2D" }}>{n.message ?? n.title ?? "Notification"}</p>
                <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#9EA6B3" }}>
                    <Clock size={11} /> {n.created_at ?? n.createdAt ?? ""}
                </p>
                </div>
                {!n.read ? (
                <button
                    onClick={() => handleMarkRead(n.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                    style={{ color: "#0263E0" }}
                >
                    <Check size={12} /> Mark read
                </button>
                ) : (
                <Check size={13} style={{ color: "#00A368", flexShrink: 0 }} />
                )}
            </div>
            ))}
        </div>
        )}
    </div>
    );
}