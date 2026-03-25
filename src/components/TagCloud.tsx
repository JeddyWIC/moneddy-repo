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
    if (ratio > 0.7) return "text-xl font-bold";
    if (ratio > 0.4) return "text-lg font-semibold";
    if (ratio > 0.2) return "text-base font-medium";
    return "text-sm";
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/search?tag=${encodeURIComponent(tag.name)}`}
          className={`inline-block px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 transition-colors ${getSize(tag.count)}`}
        >
          #{tag.name}
          <span className="ml-1 text-xs text-yellow-500 dark:text-yellow-500">({tag.count})</span>
        </Link>
      ))}
    </div>
  );
}
