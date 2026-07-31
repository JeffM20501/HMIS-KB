import { useState } from 'react';

export default function Tooltip({ label, children }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 shadow-popover">
          {label}
        </span>
      )}
    </span>
  );
}
