import { Loader2 } from "lucide-react";

export default function Spinner({ label, size = 20 }) {
  return (
    <div className="flex items-center gap-2.5" style={{ color: "#696E7A" }}>
      <Loader2 size={size} className="animate-spin" style={{ color: "#F22F46" }} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
