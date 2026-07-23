// src/pages/Landing/components/TestimonialsSection.jsx
import { Star } from "lucide-react";
import { testimonials } from "../constants.js";

export default function TestimonialsSection() {
    return (
    <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-3 text-ink-darkest tracking-tight">Trusted by healthcare teams</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} className="fill-yellow-500 text-yellow-500" />
                ))}
                </div>
                <blockquote className="text-sm leading-relaxed mb-5 text-ink-dark">&ldquo;{t.quote}&rdquo;</blockquote>
                <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 w-8 h-8 bg-navy-900 text-white">
                    {t.avatar}
                </div>
                <div>
                    <div className="text-xs font-semibold text-ink-darkest">{t.name}</div>
                    <div className="text-xs text-ink-lighter">{t.role}</div>
                </div>
                </div>
            </div>
            ))}
        </div>
        </div>
    </section>
    );
}