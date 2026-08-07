const DEFAULT_SUGGESTIONS = [
  'How do I register a new patient?',
  'How do I reverse a discharge entry?',
  'How do I reset my facility login?',
  'How do I submit an NHIF claim?',
];

export default function SuggestedQuestions({ onSelect, suggestions = DEFAULT_SUGGESTIONS }) {
  return (
    <div className="px-4 pb-3 flex flex-wrap gap-2">
      {suggestions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
}