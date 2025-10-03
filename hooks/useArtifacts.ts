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
import type { Artifact } from "@/types";

/**
 * Fetcher function for SWR
 */
async function fetcher(pageId: string): Promise<Artifact[]> {
  return await getArtifactsByPage(pageId);
}

/**
 * Hook to manage artifacts for a specific page
 */
export function useArtifacts(projectId: string | undefined, pageId: string | undefined) {
  const { data: artifacts = [], error, isLoading, mutate } = useSWR<Artifact[]>(
    pageId ? `artifacts-${pageId}` : null,
    () => (pageId ? fetcher(pageId) : []),
    { revalidateOnFocus: false }
  );

  /**
   * Create a new artifact
   */
  const createArtifact = useCallback(
    async (data: {
      type: "figma" | "url" | "image" | "video" | "pdf";
      source_url: string;
      file_path?: string;
      name: string;
      metadata?: any;
    }) => {
      if (!projectId || !pageId) return null;

      try {
        // Get next available position
        const nextPosition = await getNextPosition("artifacts", pageId, "page_id");

        // Create the artifact
        const artifact = await createArtifactDB({
          project_id: projectId,
          page_id: pageId,
          type: data.type,
          source_url: data.source_url,
          file_path: data.file_path,
          name: data.name,
          position: nextPosition,
          metadata: data.metadata || {},
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

  /**
   * Update an artifact
   */
  const updateArtifact = useCallback(
    async (artifactId: string, updates: Partial<Artifact>) => {
      try {
        const artifact = await updateArtifactDB(artifactId, updates);
        await mutate();
        return artifact;
      } catch (error) {
        console.error("Failed to update artifact:", error);
        throw error;
      }
    },
    [mutate]
  );

  /**
   * Delete an artifact
   */
  const deleteArtifact = useCallback(
    async (artifactId: string) => {
      try {
        await deleteArtifactDB(artifactId);
        await mutate();
      } catch (error) {
        console.error("Failed to delete artifact:", error);
        throw error;
      }
    },
    [mutate]
  );

  /**
   * Reorder artifacts
   */
  const reorderArtifacts = useCallback(
    async (reorderedArtifacts: Artifact[]) => {
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
    [mutate]
  );

  return {
    artifacts,
    isLoading,
    error,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    reorderArtifacts,
    refetch: mutate,
  };
}


