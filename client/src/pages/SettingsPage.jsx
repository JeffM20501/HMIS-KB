import { useEffect, useState } from "react";
import {
  User, Lock, Bell, Eye, EyeOff, Loader2,
  CheckCircle2, Check, BellOff, Clock,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { updateProfile, changePassword } from "../api/users";
import { listNotifications, markNotificationRead } from "../api/analytics";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import Spinner from "../components/common/Spinner.jsx";
import { DEPARTMENTS, ROLE_LABELS } from "../utils/constants";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "password", label: "Password", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
];

function PasswordStrength({ password }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const colors = ["#E1E3EA", "#F22F46", "#E87722", "#F7C948", "#00A368"];
  if (!password) return null;
  return (
    <div className="mt-2 flex gap-1">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex-1 h-1 rounded-full" style={{ background: n <= checks ? colors[checks] : "#E1E3EA" }} />
      ))}
    </div>
  );
}

function SavedBadge({ show }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#00A368" }}>
      <CheckCircle2 size={15} /> Saved
    </span>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#696E7A" }}>Manage your account, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <nav className="space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                style={{ background: active ? "#FDEEF0" : "transparent", color: active ? "#F22F46" : "#455A77" }}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </nav>

        <div>
          {activeTab === "profile" && <ProfileTab user={user} refreshUser={refreshUser} />}
          {activeTab === "password" && <PasswordTab user={user} />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, refreshUser }) {
  const [form, setForm] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
    department: user?.department ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateProfile(user.id, { username: form.username, department: form.department });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
      <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: "#F4F4F6" }}>
        <div className="flex items-center justify-center rounded-full text-lg font-bold" style={{ width: 56, height: 56, background: "#F22F46", color: "white" }}>
          {user?.avatar}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#121C2D" }}>{user?.name}</p>
          <p className="text-xs" style={{ color: "#9EA6B3" }}>{user?.email}</p>
          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ background: "#F4F4F6", color: "#696E7A" }}>
            {ROLE_LABELS[user?.role] ?? user?.role}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Username</label>
          <input value={form.username} onChange={(e) => set("username", e.target.value)} className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none" style={{ borderColor: "#E1E3EA", color: "#121C2D" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Email</label>
          <input value={form.email} disabled className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none opacity-60" style={{ borderColor: "#E1E3EA", color: "#696E7A" }} />
          <p className="text-xs mt-1" style={{ color: "#9EA6B3" }}>Contact an Admin to change your email address.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Department</label>
          <select value={form.department} onChange={(e) => set("department", e.target.value)} className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none" style={{ borderColor: "#E1E3EA", color: "#121C2D" }}>
            <option value="">Select department…</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-70 transition-opacity" style={{ background: "#F22F46", color: "white" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save changes
          </button>
          <SavedBadge show={saved} />
        </div>
      </form>
    </div>
  );
}

function PasswordTab({ user }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("New passwords do not match.");
    setSaving(true);
    try {
      await changePassword(user.id, currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
      <h2 className="text-sm font-semibold mb-1" style={{ color: "#121C2D" }}>Change password</h2>
      <p className="text-xs mb-5" style={{ color: "#9EA6B3" }}>
        Access tokens are short-lived and refreshed automatically; refresh tokens are revoked when you sign out.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <ErrorBanner message={error} />
        {[
          { key: "current", label: "Current password", value: currentPassword, set: setCurrentPassword },
          { key: "next", label: "New password", value: newPassword, set: setNewPassword },
          { key: "confirm", label: "Confirm new password", value: confirmPassword, set: setConfirmPassword },
        ].map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>{f.label}</label>
            <div className="relative">
              <input
                type={show[f.key] ? "text" : "password"}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
              />
              <button type="button" onClick={() => setShow((s) => ({ ...s, [f.key]: !s[f.key] }))} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9EA6B3" }}>
                {show[f.key] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {f.key === "next" && <PasswordStrength password={newPassword} />}
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-70 transition-opacity" style={{ background: "#F22F46", color: "white" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Update password
          </button>
          <SavedBadge show={saved} />
        </div>
      </form>

      <p className="text-xs mt-4" style={{ color: "#9EA6B3" }}>
        Note: this calls <code>POST /u/users/&#123;id&#125;/set-password/</code>, which doesn't exist in your
        urls.py yet — add a <code>set_password</code> @action to <code>UserViewSet</code> (or tell me the route
        you'd rather use) and this will work as-is.
      </p>
    </div>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listNotifications()
      .then((data) => setNotifications(data.results ?? data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
      <h2 className="text-sm font-semibold mb-1" style={{ color: "#121C2D" }}>Notifications</h2>
      <p className="text-xs mb-5" style={{ color: "#9EA6B3" }}>
        From <code>GET /analytics/notification/</code> — article approvals, low ratings, and category updates.
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
            <button
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className="flex items-start gap-3 w-full text-left px-4 py-3 rounded-md border transition-colors"
              style={{
                borderColor: "#E1E3EA",
                background: n.is_read ? "white" : "#FDEEF0",
              }}
            >
              {!n.is_read && <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#F22F46" }} />}
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "#121C2D" }}>{n.message ?? n.title ?? "Notification"}</p>
                <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#9EA6B3" }}>
                  <Clock size={11} /> {n.created_at ?? n.createdAt ?? ""}
                </p>
              </div>
              {n.is_read && <Check size={13} style={{ color: "#00A368", flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}