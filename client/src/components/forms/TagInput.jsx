import { useState } from 'react';
import Tag from '../ui/Tag.jsx';

export default function TagInput({ tags = [], onChange, placeholder = 'Add tag...' }) {
  const [value, setValue] = useState('');

  const addTag = () => {
    const clean = value.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) onChange([...tags, clean]);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !value && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="border border-border rounded px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:border-primary transition-colors">
      {tags.map((t) => (
        <Tag key={t} onRemove={() => onChange(tags.filter((x) => x !== t))}>
          {t}
        </Tag>
      ))}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={placeholder}
        className="flex-1 min-w-[100px] text-sm outline-none py-1"
      />
    </div>
  );
}
