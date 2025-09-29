import useSWR from "swr";
import { useCallback } from "react";
import { Artifact } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePageArtifacts(projectId: string | undefined, pageId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ artifacts: Artifact[] }>(
    projectId && pageId ? `/api/projects/${projectId}/pages/${pageId}/artifacts` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const artifacts = data?.artifacts ?? [];

  const createArtifact = useCallback(async (artifactData: {
    type: string;
    source_url: string;
    file_path?: string | null;
    name?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (!projectId || !pageId) return null;

    const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/artifacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artifactData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create artifact');
    }

    const result = await response.json();
    await mutate();
    return result.artifact;
  }, [projectId, pageId, mutate]);

  const reorderArtifacts = useCallback(async (reorderedArtifacts: Artifact[]) => {
    if (!projectId || !pageId) return;

    // Store original data for potential rollback
    const originalData = data;
    
    // Update positions locally first for optimistic updates
    const optimisticData = {
      artifacts: reorderedArtifacts.map((artifact, index) => ({
        ...artifact,
        position: index,
      })),
    };
    
    // Apply optimistic update
    mutate(optimisticData, false);

    // Then update on server
    try {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}/artifacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: reorderedArtifacts.map(a => a.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update artifact order');
      }
      
      // Success - keep the optimistic update and just refresh to ensure server consistency
      // but don't await it to avoid overwriting our optimistic changes too quickly
      mutate();
    } catch (error) {
      // Revert to original data on error
      mutate(originalData, false);
      throw error;
    }
  }, [projectId, pageId, mutate, data]);

  const updateArtifact = useCallback(async (artifactId: string, updates: { name?: string; metadata?: Record<string, unknown> }) => {
    if (!projectId) return null;

    const response = await fetch(`/api/projects/${projectId}/artifacts/${artifactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update artifact');
    }

    const result = await response.json();
    await mutate(); // Refresh the data
    return result.artifact;
  }, [projectId, mutate]);

  const deleteArtifact = useCallback(async (artifactId: string): Promise<void> => {
    if (!projectId) return;

    const response = await fetch(`/api/projects/${projectId}/artifacts/${artifactId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete artifact');
    }

    await mutate(); // Refresh the data
  }, [projectId, mutate]);

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
