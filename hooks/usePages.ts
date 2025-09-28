import useSWR from "swr";
import { useState, useCallback } from "react";
import { Page } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePages(projectId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ pages: Page[] }>(
    projectId ? `/api/projects/${projectId}/pages` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const pages = data?.pages ?? [];

  const createPage = useCallback(async (name: string) => {
    if (!projectId) return null;

    const response = await fetch(`/api/projects/${projectId}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create page');
    }

    const result = await response.json();
    await mutate();
    return result.page;
  }, [projectId, mutate]);

  const updatePage = useCallback(async (pageId: string, updates: Partial<Pick<Page, 'name' | 'position'>>) => {
    if (!projectId) return null;

    const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update page');
    }

    const result = await response.json();
    await mutate();
    return result.page;
  }, [projectId, mutate]);

  const deletePage = useCallback(async (pageId: string) => {
    if (!projectId) return;

    const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete page');
    }

    await mutate();
  }, [projectId, mutate]);

  const reorderPages = useCallback(async (reorderedPages: Page[]) => {
    if (!projectId) return;

    // Update positions locally first for optimistic updates
    const optimisticData = {
      pages: reorderedPages.map((page, index) => ({
        ...page,
        position: index,
      })),
    };
    
    await mutate(optimisticData, false);

    // Then update on server
    try {
      await Promise.all(
        reorderedPages.map((page, index) =>
          fetch(`/api/projects/${projectId}/pages/${page.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: index }),
          })
        )
      );
    } catch (error) {
      // Revert on error
      await mutate();
      throw error;
    }
  }, [projectId, mutate]);

  return {
    pages,
    isLoading,
    error,
    createPage,
    updatePage,
    deletePage,
    reorderPages,
    refetch: mutate,
  };
}
