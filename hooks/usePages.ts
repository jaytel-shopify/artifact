"use client";

import useSWR from "swr";
import { useCallback } from "react";
import {
  createFolder,
  updateFolder,
  deleteFolder,
  updateFolders,
  getChildren,
} from "@/lib/quick/db-new";
import { Folder } from "@/types";

/**
 * Fetcher function for SWR
 */
async function fetcher(projectId: string): Promise<Folder[]> {
  return (await getChildren(projectId)) as Folder[];
}

export function usePages(projectId: string | undefined) {
  const {
    data: pages = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Folder[]>(
    projectId ? `pages-${projectId}` : null,
    () => (projectId ? fetcher(projectId) : []),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 0,
      revalidateIfStale: true,
      shouldRetryOnError: false,
    }
  );

  const createPage = useCallback(
    async (title: string) => {
      if (!projectId) return null;

      try {
        // Calculate next position from existing pages
        const existingPages = (await getChildren(projectId)) as Folder[];
        const maxPosition = existingPages.reduce(
          (max, page) => Math.max(max, page.position || 0),
          -1
        );
        const nextPosition = maxPosition + 1;

        // Create the page
        const page = await createFolder({
          parent_id: projectId,
          title,
          position: nextPosition,
          depth: 2,
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
    async (
      pageId: string,
      updates: Partial<Pick<Folder, "title" | "position">>
    ) => {
      if (!projectId) return null;

      try {
        const page = await updateFolder(pageId, updates);
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
        await deleteFolder(pageId);
        await mutate();
      } catch (error) {
        console.error("Failed to delete page:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  const reorderPages = useCallback(
    async (reorderedPages: Folder[]) => {
      if (!projectId) return;

      // Optimistic update
      mutate(reorderedPages, false);

      try {
        // Update positions in database
        const updates = reorderedPages.map((page, index) => ({
          id: page.id,
          args: { position: index },
        }));

        await updateFolders(updates);
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
