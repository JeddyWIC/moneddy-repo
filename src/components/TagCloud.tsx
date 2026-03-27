"use client";

import { useState } from "react";
import Link from "next/link";

interface Tag {
  id: number;
  name: string;
  count: number;
}

export default function TagCloud({ tags }: { tags: Tag[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!tags.length) return null;

  const maxCount = Math.max(...tags.map((t) => t.count));
  const visibleTags = expanded ? tags : tags.slice(0, 15);

  const getSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-sm font-semibold";
    if (ratio > 0.4) return "text-sm font-medium";
    if (ratio > 0.2) return "text-xs font-medium";
    return "text-xs";
  };

  const getOpacity = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.5) return "opacity-100";
    if (ratio > 0.2) return "opacity-80";
    return "opacity-60";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Tags
        </h2>
        <Link
          href="/insights"
          className="text-xs text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 font-medium transition-colors"
        >
          View Insights →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <Link
            key={tag.id}
            href={`/search?tag=${encodeURIComponent(tag.name)}`}
            className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-stone-200 dark:border-stone-700 hover:border-yellow-400 dark:hover:border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all ${getOpacity(tag.count)}`}
          >
            <span
              className={`text-stone-700 dark:text-stone-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors ${getSize(tag.count)}`}
            >
              #{tag.name}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 tabular-nums">
              {tag.count}
            </span>
          </Link>
        ))}
      </div>

      {tags.length > 15 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
        >
          {expanded ? "Show fewer" : `+${tags.length - 15} more tags`}
        </button>
      )}
    </div>
  );
}
