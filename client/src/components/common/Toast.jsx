// src/components/common/Toast.jsx
import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

const Toast = ({ message, type = "info", duration = 3000, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
    const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    const icons = {
    success: <CheckCircle2 size={18} style={{ color: "#00A368" }} />,
    error: <AlertCircle size={18} style={{ color: "#F22F46" }} />,
    info: <Info size={18} style={{ color: "#0263E0" }} />,
    };

    const bgColors = {
    success: "#E6F7F1",
    error: "#FDEEF0",
    info: "#E8F0FD",
    };

    const textColors = {
    success: "#00A368",
    error: "#F22F46",
    info: "#0263E0",
    };

    return (
    <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-slide-down"
        style={{
        background: bgColors[type] || bgColors.info,
        borderColor: textColors[type] || textColors.info,
        color: textColors[type] || textColors.info,
        }}
    >
        {icons[type] || icons.info}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
        onClick={() => {
            setVisible(false);
            if (onClose) setTimeout(onClose, 300);
        }}
        className="p-1 hover:bg-black/5 rounded transition-colors"
        >
        <X size={14} />
        </button>
    </div>
    );
};

export default Toast;