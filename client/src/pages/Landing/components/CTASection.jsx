// src/pages/Landing/components/CTASection.jsx
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { trustBadges } from "../constants.js";

export default function CTASection() {
    return (
    <section className="py-20 bg-navy-900">
        <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-semibold mb-4 text-white tracking-tight">Ready to centralize your HMIS knowledge?</h2>
        <p className="text-base mb-8 text-white/55">
            Set up your knowledge base in minutes. Your team can start finding answers the same day.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="flex items-center justify-center gap-2 px-7 py-3 rounded-md text-sm font-medium transition-opacity hover:opacity-90 bg-red-500 text-white">
            Create your account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="flex items-center justify-center gap-2 px-7 py-3 rounded-md text-sm font-medium border border-white/15 text-white/70 transition-colors hover:bg-white/5">
            Sign in
            </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-10 text-xs text-white/35">
            {trustBadges.map((item) => (
            <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 size={12} /> {item}
            </span>
            ))}
        </div>
        </div>
    </section>
    );
}