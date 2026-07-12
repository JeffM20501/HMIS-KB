export default function StatCard({ icon: Icon, label, value, sub, color, badge = "this month" }) {
  return (
    <div className="bg-white rounded-lg p-5 border" style={{ borderColor: "#E1E3EA" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center rounded-md" style={{ width: 36, height: 36, background: `${color}14` }}>
          <Icon size={17} style={{ color }} />
        </div>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F4F4F6", color: "#696E7A" }}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold mb-0.5" style={{ color: "#121C2D" }}>{value}</div>
      <div className="text-sm" style={{ color: "#696E7A" }}>{label}</div>
      {sub && <div className="text-xs mt-1.5" style={{ color: "#9EA6B3" }}>{sub}</div>}
    </div>
  );
}