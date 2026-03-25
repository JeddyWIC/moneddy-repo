"use client";

import { useState, useRef, useCallback } from "react";

interface AttachmentInfo {
  id?: number;
  filename: string;
  mimeType: string;
  size: number;
  file?: File;
}

interface FileAttachmentsProps {
  processId?: number;
  existingAttachments?: AttachmentInfo[];
  onAttachmentsChange?: (pending: File[]) => void;
  readOnly?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "\ud83d\uddbc\ufe0f";
  if (mimeType === "application/pdf") return "\ud83d\udcc4";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "\ud83d\udcca";
  if (mimeType.includes("document") || mimeType.includes("word")) return "\ud83d\udcdd";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "\ud83d\udcfd\ufe0f";
  if (mimeType.startsWith("video/")) return "\ud83c\udfa5";
  if (mimeType.startsWith("text/")) return "\ud83d\udcc3";
  return "\ud83d\udcce";
}

export default function FileAttachments({
  existingAttachments = [],
  onAttachmentsChange,
  readOnly = false,
}: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState<AttachmentInfo[]>(existingAttachments);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newFiles: File[] = [];
      const newAttachments: AttachmentInfo[] = [];

      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          setError(`"${file.name}" exceeds 10MB limit`);
          continue;
        }

        const isDuplicate =
          pendingFiles.some((f) => f.name === file.name && f.size === file.size) ||
          attachments.some((a) => a.filename === file.name && a.size === file.size);

        if (isDuplicate) continue;

        newFiles.push(file);
        newAttachments.push({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          file,
        });
      }

      if (newFiles.length > 0) {
        const updatedPending = [...pendingFiles, ...newFiles];
        setPendingFiles(updatedPending);
        setAttachments((prev) => [...prev, ...newAttachments]);
        onAttachmentsChange?.(updatedPending);
      }
    },
    [pendingFiles, attachments, onAttachmentsChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      setError("");
      if (readOnly) return;
      addFiles(e.dataTransfer.files);
    },
    [addFiles, readOnly]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!readOnly) setDragOver(true);
    },
    [readOnly]
  );

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      if (e.target.files) {
        addFiles(e.target.files);
      }
      e.target.value = "";
    },
    [addFiles]
  );

  const removeAttachment = useCallback(
    async (index: number) => {
      const attachment = attachments[index];

      if (attachment.id) {
        try {
          await fetch(`/api/attachments/${attachment.id}`, { method: "DELETE" });
        } catch {
          setError("Failed to delete attachment");
          return;
        }
      }

      if (attachment.file) {
        const updatedPending = pendingFiles.filter((f) => f !== attachment.file);
        setPendingFiles(updatedPending);
        onAttachmentsChange?.(updatedPending);
      }

      setAttachments((prev) => prev.filter((_, i) => i !== index));
    },
    [attachments, pendingFiles, onAttachmentsChange]
  );

  void uploading;
  void setUploading;

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
              : "border-stone-300 dark:border-stone-600 hover:border-yellow-400 dark:hover:border-yellow-500 hover:bg-stone-50 dark:hover:bg-stone-800"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-3xl mb-2">{dragOver ? "\ud83d\udce5" : "\ud83d\udcce"}</div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            <span className="font-medium text-yellow-600 dark:text-yellow-400">
              Click to browse
            </span>{" "}
            or drag &amp; drop files here
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
            PDF, Word, Excel, images, and more. Max 10MB per file.
          </p>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={attachment.id || `pending-${index}`}
              className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700"
            >
              <span className="text-xl shrink-0">
                {getFileIcon(attachment.mimeType)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                  {attachment.filename}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {formatSize(attachment.size)}
                  {attachment.file && (
                    <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                      (pending upload)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {attachment.id && (
                  <a
                    href={`/api/attachments/${attachment.id}`}
                    download={attachment.filename}
                    className="p-1.5 text-stone-500 hover:text-yellow-600 dark:text-stone-400 dark:hover:text-yellow-400 transition-colors"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(index);
                    }}
                    className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export async function uploadAttachments(
  processId: number,
  files: File[]
): Promise<void> {
  if (files.length === 0) return;

  const formData = new FormData();
  formData.append("processId", processId.toString());
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch("/api/attachments", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Upload failed");
  }
}
