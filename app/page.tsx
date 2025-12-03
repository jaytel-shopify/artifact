"use client";

import { useSetHeader } from "@/components/layout/HeaderContext";
import Logo from "@/components/layout/header/Logo";
import ViewToggle from "@/components/layout/header/ViewToggle";
import SearchBar from "@/components/layout/header/SearchBar";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import ArtifactAdder from "@/components/upload/ArtifactAdder";
import { usePublicArtifacts } from "@/hooks/usePublicArtifacts";
import ArtifactFeed from "@/components/presentation/ArtifactFeed";
import HeaderUserAvatar from "@/components/layout/header/HeaderUserAvatar";
import type { Artifact } from "@/types";

export default function Home() {
  const {
    artifacts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    addArtifact,
  } = usePublicArtifacts();

  // Handle artifact creation - add to feed optimistically
  const handleArtifactCreated = (artifact: Artifact) => {
    addArtifact(artifact);
  };

  // Set header content
  useSetHeader({
    left: (
      <>
        <Logo />
        <ViewToggle />
      </>
    ),
    center: <SearchBar mode="public" />,
    right: (
      <>
        <ArtifactAdder onArtifactCreated={handleArtifactCreated} />
        <HeaderUserAvatar />
        <DarkModeToggle />
      </>
    ),
  });

  return (
    <ArtifactFeed
      artifacts={artifacts}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      onLoadMore={loadMore}
      error={error}
      emptyMessage="No public artifacts yet"
    />
  );
}
