import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { processes, tags, processTags, attachments } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProcessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const processId = parseInt(id);

  const [process] = await db
    .select()
    .from(processes)
    .where(eq(processes.id, processId));

  if (!process) {
    notFound();
  }

  const pTags = await db
    .select({ name: tags.name })
    .from(tags)
    .innerJoin(processTags, eq(processTags.tagId, tags.id))
    .where(eq(processTags.processId, processId));

  const tagNames = pTags.map((t) => t.name);

  const pAttachments = await db
    .select({
      id: attachments.id,
      filename: attachments.filename,
      mimeType: attachments.mimeType,
      size: attachments.size,
    })
    .from(attachments)
    .where(eq(attachments.processId, processId));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-stone-500 dark:text-stone-400 mb-6">
        <Link href="/" className="hover:text-yellow-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-stone-900 dark:text-stone-100">{process.title}</span>
      </nav>

      <article className="bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                {process.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                <span>by {process.author}</span>
                {process.category && (
                  <>
                    <span>&middot;</span>
                    <span>{process.category}</span>
                  </>
                )}
                <span>&middot;</span>
                <span>
                  Created {new Date(process.createdAt).toLocaleDateString()}
                </span>
                {process.updatedAt !== process.createdAt && (
                  <>
                    <span>&middot;</span>
                    <span>
                      Updated{" "}
                      {new Date(process.updatedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Link
              href={`/process/${processId}/edit`}
              className="shrink-0 px-4 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 border border-yellow-600 dark:border-yellow-500 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
            >
              Edit
            </Link>
          </div>

          {/* Tags */}
          {tagNames.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tagNames.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 text-sm rounded-full bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="prose prose-lg prose-stone dark:prose-invert max-w-none p-6"
          dangerouslySetInnerHTML={{ __html: process.content }}
        />

        {/* Attachments */}
        {pAttachments.length > 0 && (
          <div className="p-6 border-t border-stone-100 dark:border-stone-800">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3">
              Attachments ({pAttachments.length})
            </h2>
            <div className="space-y-2">
              {pAttachments.map((att) => (
                <a
                  key={att.id}
                  href={`/api/attachments/${att.id}`}
                  download={att.filename}
                  className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors group"
                >
                  <span className="text-xl shrink-0">
                    {att.mimeType.startsWith("image/")
                      ? "\ud83d\uddbc\ufe0f"
                      : att.mimeType === "application/pdf"
                      ? "\ud83d\udcc4"
                      : att.mimeType.includes("spreadsheet") || att.mimeType.includes("excel")
                      ? "\ud83d\udcca"
                      : att.mimeType.includes("document") || att.mimeType.includes("word")
                      ? "\ud83d\udcdd"
                      : "\ud83d\udcce"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate group-hover:text-yellow-700 dark:group-hover:text-yellow-400">
                      {att.filename}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {att.size < 1024
                        ? att.size + " B"
                        : att.size < 1024 * 1024
                        ? (att.size / 1024).toFixed(1) + " KB"
                        : (att.size / (1024 * 1024)).toFixed(1) + " MB"}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-stone-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
