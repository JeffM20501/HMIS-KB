export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm w-fit px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
