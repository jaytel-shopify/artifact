"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { searchResources, SearchResults } from "@/lib/search";
import { waitForQuick } from "@/lib/quick";
import { useSetHeader } from "@/components/layout/HeaderContext";
import Logo from "@/components/layout/header/Logo";
import ViewToggle from "@/components/layout/header/ViewToggle";
import SearchBar from "@/components/layout/header/SearchBar";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import HeaderUserAvatar from "@/components/layout/header/HeaderUserAvatar";
import {
  ProjectsSection,
  ArtifactsSection,
  UsersSection,
} from "@/components/projects";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set header content
  useSetHeader({
    left: (
      <>
        <Logo />
        <ViewToggle />
      </>
    ),
    center: <SearchBar />,
    right: (
      <>
        <HeaderUserAvatar />
        <DarkModeToggle />
      </>
    ),
  });

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get user ID from quick.id
        const quick = await waitForQuick();
        const user = await quick.id.waitForUser();

        // Perform search
        const searchResults = await searchResources(query, user.id);
        setResults(searchResults);
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search");
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <p className="text-text-secondary">No results found</p>
      </div>
    );
  }

  const totalResults =
    results.projects.length +
    results.publishedArtifacts.length +
    results.users.length;

  return (
    <div className="max-w-[1100px] mx-auto p-6 pb-12 mt-10 space-y-15">
      <ProjectsSection projects={results.projects} />
      <ArtifactsSection
        artifacts={results.publishedArtifacts}
        title="Artifacts"
      />
      <UsersSection users={results.users} />

      {totalResults === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary">
            No results found for &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
