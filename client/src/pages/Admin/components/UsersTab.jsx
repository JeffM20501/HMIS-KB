// src/pages/Admin/UsersTab.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, Eye, Trash2 } from "lucide-react";
import { ROLE_LABELS } from "../../../utils/constants";

const roleColors = {
  admin: { bg: "#FDEEF0", color: "#F22F46" },
  editor: { bg: "#E8F0FD", color: "#0263E0" },
  viewer: { bg: "#F4F4F6", color: "#696E7A" },
};

export default function UsersTab({ users, busyId, onDeleteUser }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    const filtered = useMemo(
    () => users.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())),
    [users, search]
    );

    const counts = useMemo(() => {
    const c = {};
    Object.keys(ROLE_LABELS).forEach((role) => { c[role] = 0; });
    users.forEach((u) => { c[u.role] = (c[u.role] || 0) + 1; });
    return c;
    }, [users]);

    return (
    <div>
        <div className="relative max-w-sm mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9EA6B3" }} />
        <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border outline-none"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
        />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
            const cfg = roleColors[role];
            const count = counts[role] || 0;
            return (
            <div key={role} className="bg-white rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
                <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{label}</span>
                <Shield size={13} style={{ color: "#D1D5DB" }} />
                </div>
                <p className="text-xl font-semibold" style={{ color: "#121C2D" }}>{count}</p>
                <p className="text-xs" style={{ color: "#9EA6B3" }}>user{count !== 1 ? "s" : ""}</p>
            </div>
            );
        })}
        </div>

        <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto" style={{ borderColor: "#E1E3EA" }}>
        <table className="w-full">
            <thead>
            <tr style={{ background: "#FAFAFA" }}>
                {["User", "Email", "Role", "Department", "Last Active", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "#9EA6B3" }}>{h}</th>
                ))}
            </tr>
            </thead>
            <tbody>
            {filtered.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F4F4F6" }}>
                <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0" style={{ width: 30, height: 30, background: "#F22F46", color: "white" }}>
                        {u.avatar ?? u.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#121C2D" }}>
                        {u.name}
                    </span>
                    </div>
                </td>
                <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>
                    {u.email}
                </td>
                <td className="px-5 py-3.5">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={{ background: roleColors[u.role]?.bg || "#F4F4F6", color: roleColors[u.role]?.color || "#696E7A" }}>
                    {ROLE_LABELS[u.role] || u.role}
                    </span>
                </td>
                <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>
                    {u.department || "—"}
                </td>
                <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#9EA6B3" }}>
                    {u.lastActive || "—"}
                </td>
                <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/app/users/${u.id}`)} className="p-1.5 rounded hover:bg-blue-50 transition-colors" style={{ color: "#0263E0" }}>
                        <Eye size={14} />
                    </button>
                    <button onClick={() => onDeleteUser(u)} disabled={busyId === u.id} className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40" style={{ color: "#9EA6B3" }}>
                        <Trash2 size={13} />
                    </button>
                    </div>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
    );
}