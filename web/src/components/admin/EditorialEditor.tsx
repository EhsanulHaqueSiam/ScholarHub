import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface EditorialEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const toolbarButtonClass =
  "size-8 flex items-center justify-center border-2 border-border rounded-base transition-colors";

/**
 * EditorialEditor: TipTap WYSIWYG editor for editorial notes.
 * Uses StarterKit + Link + Placeholder extensions.
 * Toolbar with Bold, Italic, Link, Bullet List, Ordered List, H2, H3.
 */
export function EditorialEditor({ content, onChange }: EditorialEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-main underline" },
      }),
      Placeholder.configure({
        placeholder: "Add tips for applicants...",
      }),
    ],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  // Sync external content changes (e.g., when scholarship data loads)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // Only re-sync when content prop changes from outside, not on every editor update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const handleLinkToggle = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt("Enter URL:");
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const toolbarButtons = [
    {
      label: "Bold",
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      label: "Italic",
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      label: "Insert link",
      icon: LinkIcon,
      action: handleLinkToggle,
      isActive: editor.isActive("link"),
    },
    {
      label: "Bullet list",
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      label: "Heading 2",
      icon: Heading2,
      action: () =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Heading 3",
      icon: Heading3,
      action: () =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
    },
  ];

  return (
    <div className="border-2 border-border rounded-base overflow-hidden">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b-2 border-border bg-secondary-background">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            aria-label={btn.label}
            aria-pressed={btn.isActive}
            className={cn(
              toolbarButtonClass,
              btn.isActive
                ? "bg-main text-main-foreground"
                : "bg-secondary-background hover:bg-background"
            )}
          >
            <btn.icon className="size-4" />
          </button>
        ))}
      </div>

      {/* Editor content area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm p-4 min-h-[120px] bg-background focus-within:outline-none"
        aria-label="Editorial notes editor"
      />
    </div>
  );
}
