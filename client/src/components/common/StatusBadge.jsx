import { STATUS_CONFIG } from "../../utils/constants";

export default function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] ?? { label: status, bg: "#F4F4F6", color: "#696E7A" };
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
