import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { heroAvatars } from "../constants.js";

export default function HeroSection() {
    return (
    <section className="relative overflow-hidden bg-navy-900">
        <div
        className="absolute inset-0 pointer-events-none"
        style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
        }}
        />
        <div
        className="absolute top-[-120px] right-[-80px] w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(242,47,70,0.18) 0%, transparent 70%)" }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
        <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-medium border border-red-900/30 bg-red-900/15 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Built for HMIS &amp; Healthcare Products &middot; Kenya
            </div>

            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight mb-6 text-white tracking-tight">
            The knowledge base your <span className="text-red-500">clinical staff</span> actually use
            </h1>

            <p className="text-lg mb-10 leading-relaxed text-white/60 max-w-[560px]">
            A centralized, searchable repository of SOPs, how-to guides, and troubleshooting content — with an embedded AI assistant that answers questions right inside your HMIS.
            </p>

            <div className="flex flex-wrap gap-3">
            <Link to="/register" className="flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-opacity hover:opacity-90 bg-red-500 text-white">
                Get started free <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border border-white/15 text-white/70 transition-colors hover:bg-white/5">
                Sign in to your account
            </Link>
            </div>

            <div className="flex items-center gap-4 mt-10">
            <div className="flex -space-x-2">
                {heroAvatars.map((i) => (
                <div key={i} className="flex items-center justify-center rounded-full text-xs font-bold border-2 border-navy-900 w-7 h-7 bg-red-500 text-white">
                    {i}
                </div>
                ))}
            </div>
            <p className="text-xs text-white/45">
                Used daily by nurses, lab techs, and IT administrators
            </p>
            </div>
        </div>
        </div>
    </section>
    );
}