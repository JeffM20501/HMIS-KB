// src/pages/Settings/components/ProfileTab.jsx
import { useState, useRef } from "react";
import { Loader2, Camera, Mail, Building2, Shield, User } from "lucide-react";
import { updateProfile, uploadAvatar } from "../../../api/users.js";
import { isAvatarUrl } from "../../../utils/normalize";
import ErrorBanner from "../../../components/common/ErrorBanner.jsx";
import { DEPARTMENTS, ROLE_LABELS } from "../../../utils/constants.js";
import SavedBadge from "./SavedBadge.jsx";

export default function ProfileTab({ user, refreshUser }) {
    const [form, setForm] = useState({
        username: user?.username ?? "",
        email: user?.email ?? "",
        department: user?.department ?? "",
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar ?? "");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));
    const isUrl = isAvatarUrl(avatarPreview);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.');
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setError('Image must be under 3 MB.');
            return;
        }

        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target.result);
        reader.readAsDataURL(file);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            // Update profile fields
            await updateProfile(user.id, {
                username: form.username,
                department: form.department,
            });
            
            // Upload avatar if new file selected
            if (avatarFile) {
                const result = await uploadAvatar(user.id, avatarFile);
                setAvatarPreview(result.avatar);
                setAvatarFile(null);
            }
            
            await refreshUser();
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            // Revert preview on error
            setAvatarPreview(user?.avatar ?? "");
            setError(err.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
            <h2 className="text-sm font-semibold mb-1" style={{ color: "#121C2D" }}>Profile Information</h2>
            <p className="text-xs mb-5" style={{ color: "#9EA6B3" }}>
                Update your name, department, and profile photo
            </p>

            {/* Avatar section */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: "#F4F4F6" }}>
                <div className="relative flex-shrink-0">
                    <div
                        className="flex items-center justify-center rounded-full overflow-hidden"
                        style={{ width: 80, height: 80, background: "#F4F4F6", border: "2px solid #E1E3EA" }}
                    >
                        {avatarPreview && isUrl ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : avatarPreview && !isUrl ? (
                            <span className="text-2xl font-bold" style={{ color: "#696E7A" }}>
                                {avatarPreview}
                            </span>
                        ) : (
                            <User size={32} style={{ color: "#9EA6B3" }} />
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="absolute bottom-0 right-0 p-1.5 rounded-full border transition-colors hover:bg-gray-50 disabled:opacity-50"
                        style={{ background: "white", borderColor: "#E1E3EA", color: "#696E7A" }}
                    >
                        <Camera size={14} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                </div>
                <div>
                    <p className="text-sm font-medium" style={{ color: "#121C2D" }}>Profile photo</p>
                    <p className="text-xs" style={{ color: "#9EA6B3" }}>JPG, PNG up to 3MB</p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="mt-1 text-xs font-medium hover:underline disabled:opacity-50"
                        style={{ color: "#F22F46" }}
                    >
                        {avatarFile ? "Change photo" : "Upload photo"}
                    </button>
                    {avatarFile && (
                        <span className="text-xs ml-2" style={{ color: "#00A368" }}>
                            ✓ New photo selected
                        </span>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <ErrorBanner message={error} />

                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Username</label>
                    <input
                        value={form.username}
                        onChange={(e) => set("username", e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
                        style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Work email</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9EA6B3" }} />
                        <input
                            value={form.email}
                            disabled
                            className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-md border outline-none opacity-60"
                            style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
                        />
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#9EA6B3" }}>Contact an Admin to change your email address.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Department</label>
                    <div className="relative">
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9EA6B3" }} />
                        <select
                            value={form.department}
                            onChange={(e) => set("department", e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
                            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                        >
                            <option value="">Select department…</option>
                            {DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pt-2 border-t" style={{ borderColor: "#F4F4F6" }}>
                    <div className="flex items-center gap-2">
                        <Shield size={16} style={{ color: "#9EA6B3" }} />
                        <span className="text-sm font-medium" style={{ color: "#696E7A" }}>Role</span>
                        <span className="text-sm font-semibold ml-auto" style={{ color: "#121C2D" }}>
                            {ROLE_LABELS[user?.role] ?? user?.role}
                        </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#9EA6B3" }}>
                        Role changes must be requested from an Admin.
                    </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-70 transition-opacity"
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