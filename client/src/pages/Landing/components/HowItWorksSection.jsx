// src/pages/Landing/components/HowItWorksSection.jsx
import { howItWorks } from "../constants.js";

export default function HowItWorksSection() {
    return (
    <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
            <h2 className="text-3xl font-semibold mb-3 text-ink-darkest tracking-tight">From question to answer in seconds</h2>
            <p className="text-sm text-ink-light">
            Two ways to find what you need — search the knowledge base directly, or ask the embedded assistant inside HMIS.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {howItWorks.map((s) => (
            <div key={s.step} className="flex flex-col">
                <div className="text-4xl font-bold mb-4 tabular-nums text-gray-200 tracking-tight">{s.step}</div>
                <h3 className="text-base font-semibold mb-2 text-ink-darkest">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ink-light">{s.desc}</p>
            </div>
            ))}
        </div>
        </div>
    </section>
    );
}