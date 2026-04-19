"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback } from "react";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  processId?: number;
}

type EditorType = ReturnType<typeof useEditor>;

const MAX_IMAGES = 3;

function countImages(editor: EditorType): number {
  if (!editor) return 0;
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "image") count++;
  });
  return count;
}

// Compress image client-side before uploading
function compressImage(file: File, maxWidth = 800, quality = 0.5): Promise<File> {
  return new Promise((resolve) => {
    // Skip non-image or small files
    if (!file.type.startsWith("image/") || file.size < 100 * 1024) {
      resolve(file);
      return;
    }

    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

function MenuBar({ editor, processId }: { editor: EditorType; processId?: number }) {
  if (!editor) return null;

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files) return;

      const current = countImages(editor);
      const allowed = MAX_IMAGES - current;
      if (allowed <= 0) {
        alert(`Maximum ${MAX_IMAGES} images allowed per entry. Use Attachments for additional files.`);
        return;
      }

      const toUpload = Array.from(files).slice(0, allowed);
      if (toUpload.length < files.length) {
        alert(`Only adding ${toUpload.length} of ${files.length} images (max ${MAX_IMAGES} total). Use Attachments for additional files.`);
      }

      for (const rawFile of toUpload) {
        const file = await compressImage(rawFile);
        const formData = new FormData();
        formData.append("file", file);
        if (processId) formData.append("processId", String(processId));

        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) {
            console.error("Image upload failed");
            continue;
          }
          const data = await res.json();
          const src = data.url || data.data;
          editor?.chain().focus().setImage({ src, alt: data.filename }).run();
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      }
    };
    input.click();
  }, [editor, processId]);

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

export default function RichEditor({ content, onChange, processId }: RichEditorProps) {
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
      transformPastedHTML: (html) => {
        // Strip inline color / background styles that get pasted from
        // sources like Google Docs, Notion, Word — they make links blue
        // on our dark backgrounds.
        if (typeof window === "undefined") return html;
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
          const style = el.getAttribute("style") || "";
          const cleaned = style
            .split(";")
            .map((decl) => decl.trim())
            .filter((decl) => {
              const prop = decl.split(":")[0]?.trim().toLowerCase();
              return (
                prop &&
                prop !== "color" &&
                prop !== "background" &&
                prop !== "background-color"
              );
            })
            .join("; ");
          if (cleaned) el.setAttribute("style", cleaned);
          else el.removeAttribute("style");
        });
        // Also drop legacy color attributes.
        doc.querySelectorAll<HTMLElement>("[color]").forEach((el) => {
          el.removeAttribute("color");
        });
        return doc.body.innerHTML;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
          if (imageFiles.length === 0) return false;
          event.preventDefault();
          const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });

          // Upload sequentially with limit
          (async () => {
            let current = 0;
            view.state.doc.descendants((node) => {
              if (node.type.name === "image") current++;
            });
            const allowed = MAX_IMAGES - current;
            if (allowed <= 0) {
              alert(`Maximum ${MAX_IMAGES} images allowed per entry. Use Attachments for additional files.`);
              return;
            }
            const toUpload = imageFiles.slice(0, allowed);

            for (const rawFile of toUpload) {
              const file = await compressImage(rawFile);
              const formData = new FormData();
              formData.append("file", file);
              if (processId) formData.append("processId", String(processId));
              try {
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                if (!res.ok) continue;
                const data = await res.json();
                const src = data.url || data.data;
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src, alt: data.filename });
                const pos = dropPos?.pos ?? view.state.doc.content.size;
                const transaction = view.state.tr.insert(pos, node);
                view.dispatch(transaction);
              } catch (err) {
                console.error("Image drop upload failed:", err);
              }
            }
          })();
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
      <MenuBar editor={editor} processId={processId} />
      <EditorContent editor={editor} />
    </div>
  );
}
