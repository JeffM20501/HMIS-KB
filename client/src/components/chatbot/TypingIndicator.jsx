export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-border rounded-2xl rounded-tl-sm w-fit px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-secondary/50 animate-bounce"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
