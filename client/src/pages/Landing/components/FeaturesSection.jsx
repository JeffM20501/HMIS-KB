import { features } from "../constants.js";

export default function FeaturesSection() {
    return (
    <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
            <h2 className="text-3xl font-semibold mb-3 text-ink-darkest tracking-tight">Everything your team needs</h2>
            <p className="text-base text-ink-light max-w-[480px] mx-auto">
            Purpose-built for healthcare IT — not adapted from a generic wiki. Every feature is shaped around how clinical and support staff actually work.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
            const Icon = f.icon;
            return (
                <div key={f.title} className="rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-center rounded-lg mb-4 w-10 h-10" style={{ background: `${f.color}12` }}>
                    <Icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="text-sm font-semibold mb-2 text-ink-darkest">{f.title}</h3>
                <p className="text-sm leading-relaxed text-ink-light">{f.desc}</p>
                </div>
            );
            })}
        </div>
        </div>
    </section>
    );
}