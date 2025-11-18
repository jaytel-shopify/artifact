import { useState, useEffect } from "react";
import { Folder } from "@/types";

export function useCurrentPage(pages: Folder[], projectId?: string) {
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  // Initialize with first page when pages load
  useEffect(() => {
    if (pages.length > 0 && !currentPageId) {
      const firstPage = pages.find((p) => p.position === 0) || pages[0];
      setCurrentPageId(firstPage.id);
    }
  }, [pages, currentPageId]);

  // Get current page object
  const currentPage =
    pages.find((p) => p.id === currentPageId) || pages[0] || null;

  const selectPage = (pageId: string) => {
    setCurrentPageId(pageId);
  };

  const selectNextPage = () => {
    if (!currentPage || pages.length <= 1) return;

    const currentIndex = pages.findIndex((p) => p.id === currentPage.id);
    const nextIndex = (currentIndex + 1) % pages.length;
    setCurrentPageId(pages[nextIndex].id);
  };

  const selectPreviousPage = () => {
    if (!currentPage || pages.length <= 1) return;

    const currentIndex = pages.findIndex((p) => p.id === currentPage.id);
    const prevIndex = currentIndex === 0 ? pages.length - 1 : currentIndex - 1;
    setCurrentPageId(pages[prevIndex].id);
  };

  return {
    currentPageId,
    currentPage,
    selectPage,
    selectNextPage,
    selectPreviousPage,
  };
}
