import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Shield, Calendar, Mail, Building2, User as UserIcon } from "lucide-react";
import { getUser, updateUserRole } from "../api/users";
import { ROLE_LABELS, ROLES } from "../utils/constants";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import Spinner from "../components/common/Spinner.jsx";
import useAuth from "../hooks/useAuth";

const roleColors = {
    admin: { bg: "#FDEEF0", color: "#F22F46" },
    editor: { bg: "#E8F0FD", color: "#0263E0" },
    viewer: { bg: "#F4F4F6", color: "#696E7A" },
};

export default function UserDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState(false);
    const [selectedRole, setSelectedRole] = useState("");

    useEffect(() => {
    const fetchUser = async () => {
        try {
        const data = await getUser(id);
        setUser(data);
        setSelectedRole(data.role);
        } catch (err) {
        setError(err.message || "Failed to load user.");
        } finally {
        setLoading(false);
        }
    };
    fetchUser();
    }, [id]);

    const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole === user.role) return;
    if (!window.confirm(`Change ${user.name}'s role from ${ROLE_LABELS[user.role]} to ${ROLE_LABELS[newRole]}?`)) return;
    setUpdating(true);
    try {
        await updateUserRole(user.id, newRole);
        setUser({ ...user, role: newRole });
        setSelectedRole(newRole);
    } catch (err) {
        setError(err.message);
    } finally {
        setUpdating(false);
    }
    };

    if (loading) return <div className="flex justify-center py-20"><Spinner label="Loading user…" /></div>;
    if (error && !user) return <div className="max-w-3xl mx-auto px-6 py-10"><ErrorBanner message={error} /></div>;
    if (!user) return <div className="max-w-3xl mx-auto px-6 py-10"><p className="text-center text-gray-500">User not found.</p></div>;

    const roleCfg = roleColors[user.role] || roleColors.viewer;

    return (
    <div className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs mb-6 hover:underline text-gray-500">
        <ArrowLeft size={13} /> Back
        </button>

        <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-full text-lg font-bold w-14 h-14 bg-red-500 text-white">
                {user.avatar ?? user.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className="inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: roleCfg.bg, color: roleCfg.color }}>
                {ROLE_LABELS[user.role] || user.role}
                </span>
            </div>
            </div>
            {currentUser?.role === ROLES.ADMIN && (
            <div className="flex items-center gap-2">
                <label htmlFor="role-select" className="text-xs font-medium text-gray-600">Role</label>
                <select
                id="role-select"
                value={selectedRole}
                onChange={handleRoleChange}
                disabled={updating}
                className="text-sm border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                style={{ borderColor: "#E1E3EA" }}
                >
                {Object.entries(ROLE_LABELS).map(([r, l]) => (
                    <option key={r} value={r}>{l}</option>
                ))}
                </select>
                {updating && <Loader2 size={16} className="animate-spin text-gray-400" />}
            </div>
            )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6 border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon size={16} className="text-gray-400" />
            <span className="font-medium">Username:</span> {user.username}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 size={16} className="text-gray-400" />
            <span className="font-medium">Department:</span> {user.department || "—"}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-gray-400" />
            <span className="font-medium">Joined:</span> {new Date(user.date_joined).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield size={16} className="text-gray-400" />
            <span className="font-medium">Status:</span> {user.isActive ? "Active" : "Inactive"}
            </div>
        </div>

        {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
        </div>
    </div>
    );
}