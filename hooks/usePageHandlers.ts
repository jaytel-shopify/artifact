import { Folder } from "@/types";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook to handle page CRUD operations
 */
export function usePageHandlers(
  pages: Folder[],
  createPage: (title: string) => Promise<Folder | null>,
  updatePage: (id: string, updates: any) => Promise<any>,
  deletePage: (id: string) => Promise<void>,
  selectPage: (id: string) => void
) {
  const handlePageCreate = useCallback(async () => {
    try {
      const newPage = await createPage(
        `Page ${String(pages.length + 1).padStart(2, "0")}`
      );
      if (newPage) {
        selectPage(newPage.id);
      }
    } catch (err) {
      toast.error("Failed to create page. Please try again.");
      console.error("Failed to create page:", err);
    }
  }, [createPage, pages.length, selectPage]);

  const handlePageDelete = useCallback(
    async (pageId: string) => {
      try {
        await deletePage(pageId);
        // selectPage will be handled automatically by useCurrentPage hook
      } catch (err) {
        toast.error("Failed to delete page. Please try again.");
        console.error("Failed to delete page:", err);
      }
    },
    [deletePage]
  );

  const handlePageRename = useCallback(
    async (pageId: string, newName: string) => {
      try {
        await updatePage(pageId, { name: newName });
      } catch (err) {
        toast.error("Failed to rename page. Please try again.");
        console.error("Failed to rename page:", err);
        throw err; // Re-throw so the component can handle the error
      }
    },
    [updatePage]
  );

  return {
    handlePageCreate,
    handlePageDelete,
    handlePageRename,
  };
}
