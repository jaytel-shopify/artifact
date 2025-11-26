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
      ? "Search published..."
      : mode === "dashboard"
        ? "Search your content..."
        : "Search...";

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-64 h-10 bg-primary rounded-button"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 border-[0.5px] border-border h-full rounded-button"
      />
    </form>
  );
}
