export default function StatsSection({ statsDisplay, loading }) {
    return (
    <section className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {statsDisplay.map((s) => (
            <div key={s.label} className="text-center">
            {loading ? (
                <div className="h-8 w-16 mx-auto bg-gray-200 animate-pulse rounded" />
            ) : (
                <div className="text-2xl font-semibold mb-0.5 text-ink-darkest">{s.value}</div>
            )}
            <div className="text-xs text-ink-light">{s.label}</div>
            </div>
        ))}
        </div>
    </section>
    );
}