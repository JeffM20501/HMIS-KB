import { Star } from "lucide-react";
import { useState } from "react";

export default function StarRating({ value, onChange, readOnly, size = 18 }) {
    const [hover, setHover] = useState(0);

    return (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
        <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange?.(n)}
            className={readOnly ? "cursor-default" : "cursor-pointer"}
        >
            <Star
            size={size}
            style={{
                color: (hover || value) >= n ? "#F7C948" : "#E1E3EA",
                fill: (hover || value) >= n ? "#F7C948" : "none",
            }}
            />
        </button>
        ))}
    </div>
    );
}