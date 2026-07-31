import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Markdown } from 'tiptap-markdown';
import EditorToolbar from './Toolbar.jsx';
import { UploadImage } from './extensions/ImageExtension.js';
import { Callout } from './extensions/CalloutExtension.js';

/**
 * Uncontrolled by design: `initialContent` (Markdown — always Markdown,
 * never HTML, see ADR below) seeds the document once on mount. Pass a
 * `key` prop from the parent (e.g. the article slug) to force a remount
 * when switching between articles, rather than fighting the editor's
 * internal ProseMirror state with a controlled `value`. `onChange` fires
 * with the current Markdown string on every update.
 *
 * --- ADR: why Markdown, not HTML, is the canonical content format ---
 * `tiptap-markdown` intercepts both directions: `content` is parsed from
 * Markdown into the ProseMirror doc on load, and `editor.storage.markdown
 * .getMarkdown()` serializes the doc back to Markdown on every update.
 * HTML is never produced, stored in React state, or sent to the backend.
 * This matters beyond "cleaner storage" — it's what makes the knowledge
 * base viable as a future RAG source: Markdown tokenizes predictably,
 * chunks along semantic boundaries (headings, paragraphs, list items)
 * without carrying markup noise into the embedding, diffs cleanly for
 * version history, and is trivially portable if the content ever needs
 * to move to a different rendering stack.
 */
export default function RichTextEditor({ initialContent = '', onChange, editable = true, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      UploadImage,
      Callout,
      Placeholder.configure({ placeholder: placeholder || 'Start writing your article…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Markdown.configure({ html: false, transformPastedText: true, transformCopiedText: true }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: 'kb-prose max-w-none min-h-[460px] px-6 py-6 focus:outline-none',
      },
    },
  });

  return (
    <div>
      {editable && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
