"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export type SearchMode = "public" | "dashboard" | "all";

interface SearchBarProps {
  /**
   * Search mode:
   * - "public": Only search published artifacts (for homepage)
   * - "dashboard": Only search user's folders, projects, and personal artifacts
   * - "all": Search everything (default)
   */
  mode?: SearchMode;
}

export default function SearchBar({ mode = "all" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      const modeParam = mode !== "all" ? `&mode=${mode}` : "";
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}${modeParam}`);
    }
  };

  const placeholder =
    mode === "public"
      ? "Search Artifacts..."
      : mode === "dashboard"
        ? "Search your content..."
        : "Search...";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-primary rounded-button relative h-10 w-64"
    >
      <Search className="text-text-secondary pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-border rounded-button h-full border pl-9"
      />
    </form>
  );
}
