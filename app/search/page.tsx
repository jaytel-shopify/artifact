"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { searchResources, SearchResults, SearchMode } from "@/lib/search";
import { waitForQuick } from "@/lib/quick";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import { useSetHeader } from "@/components/layout/HeaderContext";
import Logo from "@/components/layout/header/Logo";
import ViewToggle from "@/components/layout/header/ViewToggle";
import SearchBar from "@/components/layout/header/SearchBar";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import { FileText, FolderOpen, Presentation } from "lucide-react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const modeParam = searchParams?.get("mode");

  // Validate and parse mode parameter
  const mode: SearchMode =
    modeParam === "public" || modeParam === "dashboard" ? modeParam : "all";

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set header content - pass the same mode to maintain consistency
  useSetHeader({
    left: (
      <>
        <Logo />
        <ViewToggle />
      </>
    ),
    center: <SearchBar mode={mode} />,
    right: <DarkModeToggle />,
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
        // Get user email from quick.id
        const quick = await waitForQuick();
        const email = quick.id.email;

        // Perform search with mode
        const searchResults = await searchResources(query, email, mode);
        setResults(searchResults);
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search");
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, mode]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">
          Searching for &quot;{query}&quot;...
        </h1>
        <p className="text-text-secondary">Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Search Error</h1>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        <p className="text-text-secondary">
          Enter a search query to get started
        </p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        <p className="text-text-secondary">No results found</p>
      </div>
    );
  }

  const totalResults =
    results.publicArtifacts.length +
    results.folders.length +
    results.projects.length +
    results.personalArtifacts.length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {mode === "public" && "Published artifacts for "}
          {mode === "dashboard" && "Your content for "}
          {mode === "all" && "Search results for "}
          &quot;{query}&quot;
        </h1>
        <p className="text-text-secondary">
          Found {totalResults} result{totalResults !== 1 ? "s" : ""}
          {mode === "public" && " in published artifacts"}
          {mode === "dashboard" && " in your folders, projects, and artifacts"}
        </p>
      </div>

      {/* Projects */}
      {results.projects.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Presentation className="h-5 w-5 text-text-secondary" />
            <h2 className="text-xl font-semibold">
              Projects ({results.projects.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.projects.map((project) => (
              <Link key={project.id} href={`/p/?id=${project.id}`}>
                <Card className="p-4 transition-colors cursor-pointer">
                  <h3 className="font-medium mb-1">{project.name}</h3>
                  <p className="text-sm text-text-secondary">
                    {project.pages?.length || 0} page
                    {project.pages?.length !== 1 ? "s" : ""}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Folders */}
      {results.folders.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="h-5 w-5 text-text-secondary" />
            <h2 className="text-xl font-semibold">
              Folders ({results.folders.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.folders.map((folder) => (
              <Link key={folder.id} href={`/folder/?id=${folder.id}`}>
                <Card className="p-4 transition-colors cursor-pointer">
                  <h3 className="font-medium">{folder.name}</h3>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Public Artifacts */}
      {results.publicArtifacts.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-text-secondary" />
            <h2 className="text-xl font-semibold">
              Public Artifacts ({results.publicArtifacts.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.publicArtifacts.map((artifact) => (
              <Card
                key={artifact.id}
                className="grid relative cursor-pointer overflow-hidden h-fit outline-none"
              >
                <ArtifactThumbnail
                  artifact={artifact}
                  className="w-full row-start-1 row-span-2 col-start-1 col-span-1"
                />

                <div className="row-start-2 col-start-1 col-span-1 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <Link
                    href={`/a/?id=${artifact.id}`}
                    className="after:content-[''] after:absolute after:inset-0"
                  >
                    <h3 className="font-medium text-text-primary line-clamp-1">
                      {artifact.name}
                    </h3>
                    <p className="text-sm text-text-secondary capitalize">
                      {artifact.type}
                    </p>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Personal Artifacts */}
      {results.personalArtifacts.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-text-secondary" />
            <h2 className="text-xl font-semibold">
              Your Artifacts ({results.personalArtifacts.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.personalArtifacts.map((artifact) => (
              <Card
                key={artifact.id}
                className="grid relative cursor-pointer overflow-hidden h-fit outline-none"
              >
                <ArtifactThumbnail
                  artifact={artifact}
                  className="w-full row-start-1 row-span-2 col-start-1 col-span-1"
                />

                <div className="row-start-2 col-start-1 col-span-1 bg-gradient-to-t from-background/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <Link
                    href={`/a/?id=${artifact.id}`}
                    className="after:content-[''] after:absolute after:inset-0"
                  >
                    <h3 className="font-medium text-text-primary line-clamp-1">
                      {artifact.name}
                    </h3>
                    <p className="text-sm text-text-secondary capitalize">
                      {artifact.type}
                    </p>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

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
