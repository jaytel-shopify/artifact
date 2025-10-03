"use client";

import useSWR from "swr";
import { useCallback } from "react";
import {
  getArtifactsByPage,
  createArtifact as createArtifactDB,
  updateArtifact as updateArtifactDB,
  deleteArtifact as deleteArtifactDB,
  reorderArtifacts as reorderArtifactsDB,
  getNextPosition,
} from "@/lib/quick-db";
import { Artifact } from "@/types";

/**
 * Fetcher function for SWR
 */
async function fetcher(pageId: string): Promise<Artifact[]> {
  return await getArtifactsByPage(pageId);
}

export function usePageArtifacts(projectId: string | undefined, pageId: string | undefined) {
  const { data: artifacts = [], error, isLoading, mutate } = useSWR<Artifact[]>(
    pageId ? `page-artifacts-${pageId}` : null,
    () => (pageId ? fetcher(pageId) : []),
    { revalidateOnFocus: false }
  );

  const createArtifact = useCallback(
    async (artifactData: {
      type: "figma" | "url" | "image" | "video" | "pdf";
      source_url: string;
      file_path?: string | null;
      name?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!projectId || !pageId) return null;

      try {
        // Get next available position
        const nextPosition = await getNextPosition("artifacts", pageId, "page_id");

        // Create the artifact
        const artifact = await createArtifactDB({
          project_id: projectId,
          page_id: pageId,
          type: artifactData.type,
          source_url: artifactData.source_url,
          file_path: artifactData.file_path || undefined,
          name: artifactData.name || "Untitled",
          position: nextPosition,
          metadata: artifactData.metadata || {},
        });

        // Revalidate
        await mutate();
        return artifact;
      } catch (error) {
        console.error("Failed to create artifact:", error);
        throw error;
      }
    },
    [projectId, pageId, mutate]
  );

  const reorderArtifacts = useCallback(
    async (reorderedArtifacts: Artifact[]) => {
      if (!projectId || !pageId) return;

      // Optimistic update
      mutate(reorderedArtifacts, false);

      try {
        // Update positions in database
        const updates = reorderedArtifacts.map((artifact, index) => ({
          id: artifact.id,
          position: index,
        }));

        await reorderArtifactsDB(updates);
        await mutate();
      } catch (error) {
        // Revert on error
        await mutate();
        console.error("Failed to reorder artifacts:", error);
        throw error;
      }
    },
    [projectId, pageId, mutate]
  );

  const updateArtifact = useCallback(
    async (artifactId: string, updates: { name?: string; metadata?: Record<string, unknown> }) => {
      if (!projectId) return null;

      try {
        const artifact = await updateArtifactDB(artifactId, updates);
        await mutate();
        return artifact;
      } catch (error) {
        console.error("Failed to update artifact:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  const deleteArtifact = useCallback(
    async (artifactId: string): Promise<void> => {
      if (!projectId) return;

      try {
        await deleteArtifactDB(artifactId);
        await mutate();
      } catch (error) {
        console.error("Failed to delete artifact:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  return {
    artifacts,
    isLoading,
    error,
    createArtifact,
    reorderArtifacts,
    updateArtifact,
    deleteArtifact,
    refetch: mutate,
  };
}
