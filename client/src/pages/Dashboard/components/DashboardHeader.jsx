import { useNavigate } from "react-router-dom";
import { Search, PlusCircle } from "lucide-react";
import RoleGate from "../../../components/common/RoleGate.jsx";
import { ROLES } from "../../../utils/constants.js";

export default function DashboardHeader() {
    const navigate = useNavigate();

    return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#696E7A" }}>
            Overview of your knowledge base — articles, activity, and content health
        </p>
        </div>
        <div className="flex items-center gap-2.5">
        <button
            onClick={() => navigate("/app/knowledge-base")}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E1E3EA", color: "#243656" }}
        >
            <Search size={15} /> Browse KB
        </button>
        <RoleGate allow={[ROLES.EDITOR, ROLES.ADMIN]}>
            <button
            onClick={() => navigate("/app/articles/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "#F22F46", color: "white" }}
            >
            <PlusCircle size={15} /> New article
            </button>
        </RoleGate>
        </div>
    </div>
    );
}