import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { changePassword } from "../../../api/users.js";
import ErrorBanner from "../../../components/common/ErrorBanner.jsx";
import PasswordStrength from "./PasswordStrength.jsx";
import SavedBadge from "./SavedBadge.jsx";

export default function PasswordTab({ user }) {
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
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
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
                <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, [f.key]: !s[f.key] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9EA6B3" }}
                >
                {show[f.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {f.key === "next" && <PasswordStrength password={newPassword} />}
            </div>
        ))}
        <div className="flex items-center gap-3 pt-2">
            <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-70 transition-opacity"
            style={{ background: "#F22F46", color: "white" }}
            >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Update password
            </button>
            <SavedBadge show={saved} />
        </div>
        </form>
    </div>
    );
}