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
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <RandomQuote />
        <SearchBar />
      </div>

      {/* Main content + sidebar */}
      <div className="flex gap-8">
        {/* Main content area */}
        <div className="flex-1 min-w-0">
          <section>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
              {recentProcesses.length > 0 ? "Recent" : "Getting Started"}
            </h2>
            {recentProcesses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {recentProcesses.map((p) => (
                  <ProcessCard key={p.id} {...p} category={p.category || ""} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
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
        </div>

        {/* Right sidebar — tags */}
        {popularTags.length > 0 && (
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <TagCloud tags={popularTags} />
            </div>
          </div>
        )}
      </div>

      {/* Tags below content on mobile/tablet */}
      {popularTags.length > 0 && (
        <div className="lg:hidden mt-10">
          <TagCloud tags={popularTags} />
        </div>
      )}
    </div>
  );
}
