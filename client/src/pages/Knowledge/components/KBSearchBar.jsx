import { Search, SlidersHorizontal } from "lucide-react";

export default function KBSearchBar({ query, setQuery, showFilters, setShowFilters }) {
    return (
    <div className="flex gap-2.5 mb-6">
        <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#9EA6B3" }} />
        <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, SOPs, troubleshooting guides…"
            className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border outline-none transition-all"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#F22F46")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E1E3EA")}
        />
        </div>
        <button
        onClick={() => setShowFilters((v) => !v)}
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition-colors flex-shrink-0"
        style={{
            borderColor: showFilters ? "#F22F46" : "#E1E3EA",
            color: showFilters ? "#F22F46" : "#243656",
            background: showFilters ? "#FDEEF0" : "white",
        }}
        >
        <SlidersHorizontal size={15} /> Filters
        </button>
    </div>
    );
}