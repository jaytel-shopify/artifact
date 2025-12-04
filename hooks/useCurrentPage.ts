import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Page } from "@/types";

export function useCurrentPage(pages: Page[], projectId?: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const pageIdFromUrl = searchParams?.get("page");
  const [currentPageId, setCurrentPageId] = useState<string | null>(
    pageIdFromUrl
  );

  // Update URL with pageId
  const updateUrl = useCallback(
    (pageId: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("page", pageId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Initialize from URL on first load only - don't override valid state
  useEffect(() => {
    if (pages.length === 0) return;
    if (currentPageId && pages.find((p) => p.id === currentPageId)) return;

    const pageFromUrl = pageIdFromUrl
      ? pages.find((p) => p.id === pageIdFromUrl)
      : null;

    if (pageFromUrl) {
      setCurrentPageId(pageFromUrl.id);
    } else {
      const firstPage = pages.find((p) => p.position === 0) || pages[0];
      setCurrentPageId(firstPage.id);
      updateUrl(firstPage.id);
    }
  }, [pages, pageIdFromUrl, currentPageId, updateUrl]);

  // Get current page object
  const currentPage =
    pages.find((p) => p.id === currentPageId) || pages[0] || null;

  const selectPage = useCallback(
    (pageId: string) => {
      setCurrentPageId(pageId);
      updateUrl(pageId);
    },
    [updateUrl]
  );

  const selectNextPage = useCallback(() => {
    if (!currentPage || pages.length <= 1) return;

    const currentIndex = pages.findIndex((p) => p.id === currentPage.id);
    const nextIndex = (currentIndex + 1) % pages.length;
    const nextPageId = pages[nextIndex].id;
    setCurrentPageId(nextPageId);
    updateUrl(nextPageId);
  }, [currentPage, pages, updateUrl]);

  const selectPreviousPage = useCallback(() => {
    if (!currentPage || pages.length <= 1) return;

    const currentIndex = pages.findIndex((p) => p.id === currentPage.id);
    const prevIndex = currentIndex === 0 ? pages.length - 1 : currentIndex - 1;
    const prevPageId = pages[prevIndex].id;
    setCurrentPageId(prevPageId);
    updateUrl(prevPageId);
  }, [currentPage, pages, updateUrl]);

  return {
    currentPageId,
    currentPage,
    selectPage,
    selectNextPage,
    selectPreviousPage,
  };
}
