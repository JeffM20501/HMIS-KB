import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
    Bold, Italic, Strikethrough, List, ListOrdered,
    Heading1, Heading2, Quote, Link as LinkIcon,
    Image as ImageIcon, Undo, Redo, Code,
} from "lucide-react";

const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
    <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-colors ${
        isActive
        ? "bg-red-100 text-red-600"
        : "hover:bg-gray-100 text-gray-600"
    } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
    {children}
    </button>
);

export default function RichTextEditor({ content, onChange, placeholder = "Write your content here…" }) {
    const editor = useEditor({
    extensions: [
        StarterKit.configure({
        heading: {
            levels: [1, 2, 3],
        },
        }),
        Image,
        Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: "text-blue-600 underline",
        },
        }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
    },
    editorProps: {
        attributes: {
        class:
            "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
        },
    },
    });

    if (!editor) return null;

    const toggleHeading = (level) => {
    editor.chain().focus().toggleHeading({ level }).run();
    };

    const setLink = () => {
    const url = window.prompt("Enter the URL:");
    if (url) {
        editor.chain().focus().setLink({ href: url }).run();
    }
    };

    const addImage = () => {
    const url = window.prompt("Enter the image URL:");
    if (url) {
        editor.chain().focus().setImage({ src: url }).run();
    }
    };

    return (
    <div className="border rounded-md overflow-hidden" style={{ borderColor: "#E1E3EA" }}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-gray-50/50" style={{ borderColor: "#E1E3EA" }}>
        {/* Headings */}
        <ToolbarButton
            onClick={() => toggleHeading(1)}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
        >
            <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
            onClick={() => toggleHeading(2)}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
        >
            <Heading2 size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Formatting */}
        <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
        >
            <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
        >
            <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
        >
            <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Inline code"
        >
            <Code size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Lists */}
        <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet list"
        >
            <List size={16} />
        </ToolbarButton>
        <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered list"
        >
            <ListOrdered size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Blockquote */}
        <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Quote"
        >
            <Quote size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Link & Image */}
        <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive("link")}
            title="Insert link"
        >
            <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
            onClick={addImage}
            title="Insert image"
        >
            <ImageIcon size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
        >
            <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
        >
            <Redo size={16} />
        </ToolbarButton>
        </div>

        {/* Editor content */}
        <EditorContent editor={editor} />
    </div>
    );
}