"use client";

import useSWR from "swr";
import { useCallback } from "react";
import {
  getPages,
  createPage as createPageDB,
  updatePage as updatePageDB,
  deletePage as deletePageDB,
  reorderPages as reorderPagesDB,
  getNextPosition,
} from "@/lib/quick-db";
import { Page } from "@/types";

/**
 * Fetcher function for SWR
 */
async function fetcher(projectId: string): Promise<Page[]> {
  return await getPages(projectId);
}

export function usePages(projectId: string | undefined) {
  const { data: pages = [], error, isLoading, mutate } = useSWR<Page[]>(
    projectId ? `pages-${projectId}` : null,
    () => (projectId ? fetcher(projectId) : []),
    { revalidateOnFocus: false }
  );

  const createPage = useCallback(
    async (name: string) => {
      if (!projectId) return null;

      try {
        // Get next available position
        const nextPosition = await getNextPosition("pages", projectId, "project_id");

        // Create the page
        const page = await createPageDB({
          project_id: projectId,
          name,
          position: nextPosition,
        });

        // Revalidate
        await mutate();
        return page;
      } catch (error) {
        console.error("Failed to create page:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  const updatePage = useCallback(
    async (pageId: string, updates: Partial<Pick<Page, "name" | "position">>) => {
      if (!projectId) return null;

      try {
        const page = await updatePageDB(pageId, updates);
        await mutate();
        return page;
      } catch (error) {
        console.error("Failed to update page:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      if (!projectId) return;

      try {
        await deletePageDB(pageId);
        await mutate();
      } catch (error) {
        console.error("Failed to delete page:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  const reorderPages = useCallback(
    async (reorderedPages: Page[]) => {
      if (!projectId) return;

      // Optimistic update
      mutate(reorderedPages, false);

      try {
        // Update positions in database
        const updates = reorderedPages.map((page, index) => ({
          id: page.id,
          position: index,
        }));
        
        await reorderPagesDB(updates);
        await mutate();
      } catch (error) {
        // Revert on error
        await mutate();
        console.error("Failed to reorder pages:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

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
