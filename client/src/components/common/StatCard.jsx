import { useMemo } from "react";

export default function StatCard({
  label,
  value,
  sub,
  badgePct,
  color,
  sparkline = [],
  sparklineKey = "value",
  icon: Icon,
}) {
  const sparkData = useMemo(() => {
    if (!sparkline || sparkline.length < 2) return null;
    const values = sparkline.map((d) => d[sparklineKey] ?? 0);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const height = 56;
    const width = 120;
    const step = width / (values.length - 1);

    const points = values.map((v, i) => ({
      x: 4 + i * step,
      y: height - 4 - ((v - min) / range) * height,
    }));

    const last = points[points.length - 1];
    const polygonPoints = [
      { x: 4, y: height - 4 },
      ...points,
      { x: last.x, y: height - 4 },
    ];

    return { points, polygonPoints };
  }, [sparkline, sparklineKey]);

  return (
    <div
      className="bg-white rounded-xl border p-5 transition-shadow hover:shadow-md"
      style={{ borderColor: "#E8E8EC" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#9EA6B3" }}>
            {label}
          </p>
          <p className="text-3xl font-bold mt-1 tracking-tight" style={{ color: "#121C2D" }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "#696E7A" }}>
              {sub}
            </p>
          )}
        </div>
        {/* Render icon if provided – use Icon directly */}
        {Icon && (
          <div className="flex-shrink-0 ml-3 mt-1">
            <Icon size={20} style={{ color: color || "#9EA6B3" }} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Badge (trend) */}
      {badgePct !== undefined && badgePct !== null && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background: badgePct >= 0 ? "#E6F7F1" : "#FEF3E7",
              color: badgePct >= 0 ? "#00A368" : "#E87722",
            }}
          >
            {badgePct >= 0 ? "↑" : "↓"} {Math.abs(badgePct)}%
          </span>
          <span style={{ color: "#9EA6B3" }}>vs previous period</span>
        </div>
      )}

      {/* Sparkline with filled area */}
      {sparkData && sparkData.points.length > 1 && (
        <div className="mt-4 h-[60px] w-full">
          <svg viewBox="0 0 128 64" preserveAspectRatio="none" className="w-full h-full">
            <polygon
              points={sparkData.polygonPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={color ? `${color}25` : "#0263E025"}
              stroke="none"
            />
            <polyline
              points={sparkData.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={color || "#0263E0"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}