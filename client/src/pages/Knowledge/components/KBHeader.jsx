import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import RoleGate from "../../../components/common/RoleGate.jsx";
import { ROLES } from "../../../utils/constants.js";

export default function KBHeader() {
    const navigate = useNavigate();

    return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Knowledge Base</h1>
        <p className="text-sm mt-1" style={{ color: "#696E7A" }}>
            SOPs, how-to guides, troubleshooting articles, and release notes for HMIS and healthcare products.
        </p>
        </div>
        <RoleGate allow={[ROLES.EDITOR, ROLES.ADMIN]}>
        <button
            onClick={() => navigate("/app/articles/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: "#F22F46", color: "white" }}
        >
            <PlusCircle size={15} /> New article
        </button>
        </RoleGate>
    </div>
    );
}