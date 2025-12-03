"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useTransitionRouter } from "@/hooks/useTransitionRouter";
import { Input } from "@/components/ui/input";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="13"
      viewBox="0 0 12 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M0 4.99252C0 7.74805 2.21858 9.98617 4.94759 9.98617C5.96248 9.98617 6.8939 9.67133 7.67038 9.13996L10.4628 11.9633C10.6375 12.1397 10.8691 12.2238 11.1129 12.2238C11.6301 12.2238 12 11.8292 12 11.3133C12 11.0706 11.9117 10.8441 11.7447 10.6755L8.97384 7.86275C9.55397 7.0573 9.89516 6.06705 9.89516 4.99252C9.89516 2.23812 7.67661 0 4.94759 0C2.21858 0 0 2.23812 0 4.99252ZM1.2636 4.99252C1.2636 2.94285 2.91462 1.27536 4.94649 1.27536C6.98053 1.27536 8.63048 2.94285 8.63048 4.99252C8.63048 7.0433 6.98053 8.71079 4.94649 8.71079C2.91462 8.71079 1.2636 7.0433 1.2636 4.99252Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function SearchBar() {
  const router = useTransitionRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/search/?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-primary rounded-button relative h-10 w-64"
    >
      <SearchIcon className="text-text-secondary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-border rounded-button h-full border pl-9"
      />
    </form>
  );
}
