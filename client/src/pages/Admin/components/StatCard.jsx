// src/pages/Admin/StatCard.jsx
import { useMemo } from "react";
import { Line } from "react-chartjs-2";

export default function StatCard({ label, value, sub, badgePct, color, sparkline, sparklineKey }) {
    const hasSparkline = sparkline && sparkline.length > 0;

    const chartData = useMemo(() => {
    if (!hasSparkline) return null;
    return {
        labels: sparkline.map((d) => d.date || ""),
        datasets: [
        {
            label: label,
            data: sparkline.map((d) => d[sparklineKey] || 0),
            borderColor: color,
            backgroundColor: color + "20",
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
        },
        ],
    };
    }, [sparkline, sparklineKey, label, color, hasSparkline]);

    const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    animation: { duration: 300 },
    };

    return (
    <div className="bg-white rounded-lg p-5 border" style={{ borderColor: "#E1E3EA" }}>
        <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: "#696E7A" }}>{label}</span>
        {badgePct !== null && badgePct !== undefined && (
            <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
                background: badgePct >= 0 ? "#E6F7F1" : "#FDEEF0",
                color: badgePct >= 0 ? "#00A368" : "#F22F46",
            }}
            >
            {badgePct >= 0 ? "+" : ""}{badgePct}%
            </span>
        )}
        </div>
        <div className="text-2xl font-semibold mb-0.5" style={{ color: "#121C2D" }}>{value}</div>
        <div className="text-xs mb-3" style={{ color: "#9EA6B3" }}>{sub}</div>
        {hasSparkline && (
        <div className="h-10 w-full">
            <Line data={chartData} options={chartOptions} />
        </div>
        )}
    </div>
    );
}