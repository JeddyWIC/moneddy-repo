import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import TagCloud from "@/components/TagCloud";
import ProcessCard from "@/components/ProcessCard";
import RandomQuote from "@/components/RandomQuote";

async function getRecentProcesses() {
  try {
    const { db } = await import("@/lib/db");
    const { processes, tags, processTags } = await import("@/lib/schema");
    const { desc, eq } = await import("drizzle-orm");

    const results = await db
      .select({
        id: processes.id,
        title: processes.title,
        author: processes.author,
        category: processes.category,
        createdAt: processes.createdAt,
        updatedAt: processes.updatedAt,
      })
      .from(processes)
      .orderBy(desc(processes.updatedAt))
      .limit(12);

    const withTags = await Promise.all(
      results.map(async (p) => {
        const pTags = await db
          .select({ name: tags.name })
          .from(tags)
          .innerJoin(processTags, eq(processTags.tagId, tags.id))
          .where(eq(processTags.processId, p.id));
        return { ...p, tags: pTags.map((t) => t.name) };
      })
    );

    return withTags;
  } catch {
    return [];
  }
}

async function getPopularTags() {
  try {
    const { db } = await import("@/lib/db");
    const { tags, processTags } = await import("@/lib/schema");
    const { eq, sql } = await import("drizzle-orm");

    return await db
      .select({
        id: tags.id,
        name: tags.name,
        count: sql<number>`count(${processTags.processId})`.as("count"),
      })
      .from(tags)
      .leftJoin(processTags, eq(processTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(sql`count DESC`)
      .limit(30);
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const [recentProcesses, popularTags] = await Promise.all([
    getRecentProcesses(),
    getPopularTags(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* ① Search — top priority, big and centered */}
      <div className="text-center mb-6">
        <RandomQuote />
        <SearchBar />
      </div>

      {/* ② Add — clear call-to-action right below search */}
      <div className="flex justify-center mb-10">
        <Link
          href="/process/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Entry
        </Link>
      </div>

      {/* Recent entries — full-width centered grid */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
          {recentProcesses.length > 0 ? "Recent" : "Getting Started"}
        </h2>
        {recentProcesses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProcesses.map((p) => (
              <ProcessCard key={p.id} {...p} category={p.category || ""} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
            <p className="text-stone-500 dark:text-stone-400 mb-4">
              Nothing here yet. Start documenting.
            </p>
            <Link
              href="/process/new"
              className="inline-block px-6 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-medium transition-colors"
            >
              Create First Entry
            </Link>
          </div>
        )}
      </section>

      {/* ③ Tags — compact section at the bottom, not competing with content */}
      {popularTags.length > 0 && (
        <section className="border-t border-stone-200 dark:border-stone-800 pt-8">
          <TagCloud tags={popularTags} />
        </section>
      )}
    </div>
  );
}
