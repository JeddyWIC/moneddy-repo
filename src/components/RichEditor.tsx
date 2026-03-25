"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback } from "react";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
}

type EditorType = ReturnType<typeof useEditor>;

function MenuBar({ editor }: { editor: EditorType }) {
  if (!editor) return null;

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        editor?.chain().focus().setImage({ src: data.url, alt: data.filename }).run();
      }
    };
    input.click();
  }, [editor]);

  const btnClass = (active: boolean) =>
    `px-2 py-1 rounded text-sm font-medium transition-colors ${
      active
        ? "bg-yellow-600 text-white"
        : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
    }`;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 rounded-t">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>
        B
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>
        I
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))}>
        S
      </button>
      <div className="w-px bg-stone-300 dark:bg-stone-600 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive("heading", { level: 3 }))}>
        H3
      </button>
      <div className="w-px bg-stone-300 dark:bg-stone-600 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>
        &bull; List
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>
        1. List
      </button>
      <div className="w-px bg-stone-300 dark:bg-stone-600 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))}>
        Quote
      </button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)}>
        &mdash;
      </button>
      <div className="w-px bg-stone-300 dark:bg-stone-600 mx-1" />
      <button type="button" onClick={addImage} className={btnClass(false)}>
        Image
      </button>
    </div>
  );
}

export default function RichEditor({ content, onChange }: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({
        placeholder: "Write it down... processes, notes, lessons learned, whatever needs remembering.",
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none",
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          Array.from(files).forEach(async (file) => {
            if (!file.type.startsWith("image/")) return;
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
              const data = await res.json();
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: data.url, alt: data.filename });
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (pos) {
                const transaction = view.state.tr.insert(pos.pos, node);
                view.dispatch(transaction);
              }
            }
          });
          return true;
        }
        return false;
      },
    },
  });

  if (!editor) {
    return <div className="border border-stone-300 dark:border-stone-600 rounded p-4 bg-white dark:bg-stone-900 min-h-[300px]" />;
  }

  return (
    <div className="border border-stone-300 dark:border-stone-600 rounded overflow-hidden bg-white dark:bg-stone-900">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
