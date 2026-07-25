import { useRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote, Table as TableIcon, Link2, Image as ImageIcon,
  Undo2, Redo2, Minus, Loader2,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import * as mediaApi from '../../api/media.api';

const BTN = 'p-1.5 rounded hover:bg-gray-100 text-text-secondary hover:text-text-primary transition-colors';
const BTN_ACTIVE = 'bg-primary-50 text-primary hover:bg-primary-50';

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(BTN, active && BTN_ACTIVE, disabled && 'opacity-30 pointer-events-none')}
    >
      {children}
    </button>
  );
}

export default function RichTextToolbar({ editor }) {
  const fileInputRef = useRef(null);

  const uploadMutation = useMutation({
    mutationFn: (file) => mediaApi.uploadMedia(file, { context: 'article' }),
    onSuccess: (data) => {
      const src = data.url || data.file || data.file_url;
      if (src) editor.chain().focus().setImage({ src, alt: data.name || 'image' }).run();
    },
    onError: () => toast.error('Image upload failed. Please try again.'),
  });

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertCallout = (label, emoji) => {
    editor
      .chain()
      .focus()
      .insertContent(`<blockquote><p>${emoji} <strong>${label}:</strong> </p></blockquote><p></p>`)
      .run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border flex-wrap bg-gray-50/60">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bulleted list">
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Checklist">
        <CheckSquare className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton onClick={insertTable} title="Insert table">
        <TableIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
        <Link2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} title="Upload image">
        {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
      </ToolbarButton>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <button type="button" onClick={() => insertCallout('Note', 'ℹ️')} className="text-xs px-2 py-1 rounded bg-primary-50 text-primary font-medium">
        Note
      </button>
      <button type="button" onClick={() => insertCallout('Warning', '⚠️')} className="text-xs px-2 py-1 rounded bg-warning-bg text-warning font-medium">
        Warning
      </button>
      <button type="button" onClick={() => insertCallout('Tip', '✅')} className="text-xs px-2 py-1 rounded bg-success-bg text-success font-medium">
        Tip
      </button>

      <span className="flex-1" />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo2 className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}
