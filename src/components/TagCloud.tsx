"use client";

import Link from "next/link";

interface Tag {
  id: number;
  name: string;
  count: number;
}

export default function TagCloud({ tags }: { tags: Tag[] }) {
  if (!tags.length) return null;

  const maxCount = Math.max(...tags.map((t) => t.count));

  const getSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-sm font-bold";
    if (ratio > 0.4) return "text-sm font-semibold";
    if (ratio > 0.2) return "text-xs font-medium";
    return "text-xs";
  };

  const getBarWidth = (count: number) => {
    return Math.max(20, Math.round((count / maxCount) * 100));
  };

  return (
    <aside className="w-full">
      <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
        Tags
      </h2>
      <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/search?tag=${encodeURIComponent(tag.name)}`}
            className="group flex items-center gap-2 py-1 px-2 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`truncate text-stone-700 dark:text-stone-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors ${getSize(tag.count)}`}
                >
                  #{tag.name}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 tabular-nums flex-shrink-0">
                  {tag.count}
                </span>
              </div>
              <div className="mt-0.5 h-[2px] rounded-full bg-stone-100 dark:bg-stone-800">
                <div
                  className="h-full rounded-full bg-yellow-400/60 dark:bg-yellow-600/40 group-hover:bg-yellow-500 dark:group-hover:bg-yellow-500/60 transition-colors"
                  style={{ width: `${getBarWidth(tag.count)}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/insights"
        className="mt-3 block text-center text-xs text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 font-medium transition-colors"
      >
        View Tag Insights →
      </Link>
    </aside>
  );
}
