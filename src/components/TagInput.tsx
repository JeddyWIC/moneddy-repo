"use client";

import { useState, useEffect, useRef } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.length < 1) {
      setSuggestions([]);
      return;
    }
    const clean = input.replace(/^#/, "");
    if (!clean) return;

    const controller = new AbortController();
    fetch(`/api/tags?q=${encodeURIComponent(clean)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setSuggestions(data.filter((t: { name: string }) => !tags.includes(t.name))))
      .catch(() => {});

    return () => controller.abort();
  }, [input, tags]);

  const addTag = (name: string) => {
    const normalized = name.toLowerCase().trim().replace(/^#/, "");
    if (normalized && !tags.includes(normalized)) {
      onChange([...tags, normalized]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (name: string) => {
    onChange(tags.filter((t) => t !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === "," || e.key === " ") && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 min-h-[44px] focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 rounded-full text-sm"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-yellow-950 dark:hover:text-yellow-100"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? "Add tags (e.g., #home #auto #diy)" : "Add more..."}
          className="flex-1 min-w-[150px] outline-none text-sm text-stone-900 dark:text-stone-100 bg-transparent placeholder:text-stone-400 dark:placeholder:text-stone-500"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(s.name)}
              className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-yellow-50 hover:text-yellow-800 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-300"
            >
              #{s.name}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
        Press Enter, comma, or space to add a tag
      </p>
    </div>
  );
}
