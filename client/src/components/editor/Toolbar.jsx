import { useRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Code2,
  List, ListOrdered, CheckSquare, Quote, Table as TableIcon, Link2, Image as ImageIcon,
  Undo2, Redo2, Minus, Loader2, ChevronDown, Highlighter, Eraser,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Info, AlertTriangle, ShieldAlert, Lightbulb,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import * as uploadsApi from '../../api/uploads.api';
import Dropdown from '../ui/Dropdown.jsx';

const BTN = 'p-1.5 rounded hover:bg-gray-100 text-text-secondary hover:text-text-primary transition-colors shrink-0';
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

const HEADING_LABELS = { 0: 'Paragraph', 1: 'Heading 1', 2: 'Heading 2', 3: 'Heading 3' };

const CALLOUT_OPTIONS = [
  { type: 'tip', label: 'Tip', icon: Lightbulb },
  { type: 'warning', label: 'Warning', icon: AlertTriangle },
  { type: 'danger', label: 'Danger', icon: ShieldAlert },
  { type: 'info', label: 'Info', icon: Info },
];

export default function EditorToolbar({ editor }) {
  const fileInputRef = useRef(null);

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadsApi.uploadImage(file),
    onSuccess: ({ url, name }) => editor.chain().focus().setImage({ src: url, alt: name }).run(),
    onError: (err) => toast.error(err.message || 'Image upload failed. Please try again.'),
  });

  if (!editor) return null;

  const currentHeadingLevel = [1, 2, 3].find((l) => editor.isActive('heading', { level: l })) || 0;

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

  const insertTable = () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  const clearFormatting = () => editor.chain().focus().unsetAllMarks().clearNodes().run();

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border flex-wrap bg-gray-50/60 overflow-visible">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Shift+Z)">
        <Redo2 className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <Dropdown
        trigger={
          <button type="button" className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100 text-sm text-text-secondary hover:text-text-primary">
            {HEADING_LABELS[currentHeadingLevel]} <ChevronDown className="w-3.5 h-3.5" />
          </button>
        }
        align="left"
        items={[
          { label: 'Paragraph', onClick: () => editor.chain().focus().setParagraph().run() },
          { label: 'Heading 1', onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
          { label: 'Heading 2', onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
          { label: 'Heading 3', onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        ]}
      />

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <Highlighter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify className="w-4 h-4" />
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
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
        <Code2 className="w-4 h-4" />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton onClick={insertTable} title="Insert table">
        <TableIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link (Ctrl+K)">
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

      <Dropdown
        trigger={
          <button type="button" className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100 text-sm text-text-secondary hover:text-text-primary" title="Insert callout">
            <Info className="w-4 h-4" /> Callout <ChevronDown className="w-3.5 h-3.5" />
          </button>
        }
        align="left"
        items={CALLOUT_OPTIONS.map((c) => ({
          label: c.label,
          icon: c.icon,
          onClick: () => editor.chain().focus().setCallout(c.type).run(),
        }))}
      />

      <span className="flex-1" />

      <ToolbarButton onClick={clearFormatting} title="Clear formatting">
        <Eraser className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}
