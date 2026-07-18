import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateProfile } from "../../../api/users.js";
import ErrorBanner from "../../../components/common/ErrorBanner.jsx";
import { DEPARTMENTS, ROLE_LABELS } from "../../../utils/constants.js";
import SavedBadge from "./SavedBadge.jsx";

export default function ProfileTab({ user, refreshUser }) {
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
        <div
            className="flex items-center justify-center rounded-full text-lg font-bold"
            style={{ width: 56, height: 56, background: "#F22F46", color: "white" }}
        >
            {user?.avatar}
        </div>
        <div>
            <p className="text-sm font-semibold" style={{ color: "#121C2D" }}>{user?.name}</p>
            <p className="text-xs" style={{ color: "#9EA6B3" }}>{user?.email}</p>
            <span
            className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize"
            style={{ background: "#F4F4F6", color: "#696E7A" }}
            >
            {ROLE_LABELS[user?.role] ?? user?.role}
            </span>
        </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Username</label>
            <input
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
        </div>
        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Email</label>
            <input
            value={form.email}
            disabled
            className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none opacity-60"
            style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
            />
            <p className="text-xs mt-1" style={{ color: "#9EA6B3" }}>Contact an Admin to change your email address.</p>
        </div>
        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Department</label>
            <select
            value={form.department}
            onChange={(e) => set("department", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            >
            <option value="">Select department…</option>
            {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
            ))}
            </select>
        </div>
        <div className="flex items-center gap-3 pt-2">
            <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-70 transition-opacity"
            style={{ background: "#F22F46", color: "white" }}
            >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save changes
            </button>
            <SavedBadge show={saved} />
        </div>
        </form>
    </div>
    );
}