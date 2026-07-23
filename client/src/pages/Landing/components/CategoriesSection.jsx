export default function CategoriesSection({ categoryDisplay }) {
    return (
    <section id="categories" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-3 text-ink-darkest tracking-tight">Structured for healthcare workflows</h2>
            <p className="text-sm text-ink-light">8 top-level categories covering every aspect of HMIS and healthcare product operation.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoryDisplay.map((cat) => (
            <div key={cat.name} className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-default">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <div>
                <div className="text-sm font-medium text-ink-darkest">{cat.name}</div>
                <div className="text-xs text-ink-lighter">{cat.count} articles</div>
                </div>
            </div>
            ))}
        </div>
        </div>
    </section>
    );
}