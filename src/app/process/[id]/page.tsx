import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { processes, tags, processTags, attachments } from "@/lib/schema";
import { eq, ne, and, sql, inArray } from "drizzle-orm";

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

  // Find related processes that share tags with this one
  let relatedProcesses: {
    id: number;
    title: string;
    author: string;
    category: string | null;
    sharedTags: string[];
    totalShared: number;
  }[] = [];

  if (tagNames.length > 0) {
    // Get tag IDs for this process's tags
    const tagRows = await db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(inArray(tags.name, tagNames));

    const tagIds = tagRows.map((t) => t.id);
    const tagIdToName = Object.fromEntries(tagRows.map((t) => [t.id, t.name]));

    if (tagIds.length > 0) {
      // Find other processes that share any of these tags
      const sharedRows = await db
        .select({
          processId: processTags.processId,
          tagId: processTags.tagId,
        })
        .from(processTags)
        .where(
          and(
            inArray(processTags.tagId, tagIds),
            ne(processTags.processId, processId)
          )
        );

      // Group by process and count shared tags
      const processMap = new Map<number, string[]>();
      for (const row of sharedRows) {
        const existing = processMap.get(row.processId) || [];
        existing.push(tagIdToName[row.tagId]);
        processMap.set(row.processId, existing);
      }

      // Sort by number of shared tags (most shared first), limit to 6
      const sorted = [...processMap.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 6);

      if (sorted.length > 0) {
        const relatedIds = sorted.map(([pid]) => pid);
        const relatedRows = await db
          .select({
            id: processes.id,
            title: processes.title,
            author: processes.author,
            category: processes.category,
          })
          .from(processes)
          .where(inArray(processes.id, relatedIds));

        relatedProcesses = sorted.map(([pid, shared]) => {
          const p = relatedRows.find((r) => r.id === pid)!;
          return {
            ...p,
            sharedTags: shared,
            totalShared: shared.length,
          };
        }).filter((p) => p.title); // filter out any missing
      }
    }
  }

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
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                {process.title}
              </h1>
              <Link
                href={`/process/${processId}/edit`}
                className="shrink-0 px-4 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 border border-yellow-600 dark:border-yellow-500 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
              >
                Edit
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
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

      {/* Related Items */}
      {relatedProcesses.length > 0 && (
        <div className="mt-8">
          <h2
            className="text-2xl text-stone-900 dark:text-stone-100 mb-4 tracking-wide"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            RELATED ITEMS
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            Other entries that share tags with this one
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedProcesses.map((rp) => (
              <Link
                key={rp.id}
                href={`/process/${rp.id}`}
                className="block bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 p-4 hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors group"
              >
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 mb-1 line-clamp-2">
                  {rp.title}
                </h3>
                <div className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                  by {rp.author}
                  {rp.category && <span> &middot; {rp.category}</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {rp.sharedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
