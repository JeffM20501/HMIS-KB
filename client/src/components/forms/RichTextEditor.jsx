import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { Markdown } from 'tiptap-markdown';
import RichTextToolbar from './RichTextToolbar.jsx';

/**
 * Uncontrolled by design: `initialContent` (Markdown) seeds the document once on mount.
 * Pass a `key` prop from the parent (e.g. the article slug) to force a remount when
 * switching between articles, rather than fighting the editor's internal ProseMirror
 * state with a controlled `value`. `onChange` fires with the current Markdown string
 * on every update, which the parent stores in its form state.
 */
export default function RichTextEditor({ initialContent = '', onChange, editable = true, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Placeholder.configure({ placeholder: placeholder || 'Start writing your article…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
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
      {editable && <RichTextToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
