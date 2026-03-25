"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import ProcessCard from "@/components/ProcessCard";
import { Suspense } from "react";

interface ProcessResult {
  id: number;
  title: string;
  author: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [category, setCategory] = useState("ALL");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!q && !tag) {
      setResults([]);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    if (category !== "ALL") params.set("category", category);

    fetch(`/api/processes?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setResults([]);
        setLoading(false);
      });
  }, [q, tag, category]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchBar initialQuery={q || tag} />
      </div>

      {/* Filters */}
      {categories.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm text-stone-500 dark:text-stone-400">Filter:</span>
          <button
            onClick={() => setCategory("ALL")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              category === "ALL"
                ? "bg-yellow-600 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.name)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                category === cat.name
                  ? "bg-yellow-600 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {(q || tag) && (
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
          {loading
            ? "Searching..."
            : `${results.length} result${results.length !== 1 ? "s" : ""} for "${q || `#${tag}`}"`}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <ProcessCard key={p.id} {...p} />
          ))}
        </div>
      ) : q || tag ? (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
          <p className="text-stone-500 dark:text-stone-400">
            Nothing found. Try different keywords or tags.
          </p>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800">
          <p className="text-stone-500 dark:text-stone-400">
            Enter a search term or click a tag to find entries.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
