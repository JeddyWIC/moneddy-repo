import Link from "next/link";

interface ProcessCardProps {
  id: number;
  title: string;
  author: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ProcessCard({
  id,
  title,
  author,
  category,
  tags,
  updatedAt,
}: ProcessCardProps) {
  return (
    <Link href={`/process/${id}`} className="block">
      <div className="border border-stone-200 dark:border-stone-700 rounded p-5 hover:shadow-md hover:border-yellow-400 dark:hover:border-yellow-600 transition-all bg-white dark:bg-stone-800">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 line-clamp-2">
            {title}
          </h3>
          {category && (
            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300">
              {category}
            </span>
          )}
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          by {author} &middot; Updated{" "}
          {new Date(updatedAt).toLocaleDateString()}
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
