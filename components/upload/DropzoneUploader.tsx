"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { mutate as globalMutate } from "swr";
import { usePublicArtifacts } from "@/hooks/usePublicArtifacts";
import {
  useArtifactUpload,
  type UploadContext,
} from "@/hooks/useArtifactUpload";
import { useAuth } from "@/components/auth/AuthProvider";
import { cacheKeys } from "@/lib/cache-keys";
import UploadPreviewDialog from "./UploadPreviewDialog";
import UrlPreviewDialog from "./UrlPreviewDialog";
import type { Artifact } from "@/types";

export default function DropzoneUploader() {
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const isInternalDrag = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { addArtifact } = usePublicArtifacts();

  // Handle artifact creation - add to public feed if published
  const handleArtifactCreated = useCallback(
    (artifact: Artifact) => {
      if (artifact.published && user) {
        // Attach creator info for proper display in feed
        addArtifact({
          ...artifact,
          creator: {
            id: user.id,
            name: user.name,
            email: user.email,
            slack_image_url: user.slack_image_url,
          },
        });
      }
    },
    [addArtifact, user]
  );

  // Refresh caches after upload completes based on context
  const refreshCachesForContext = useCallback(
    (context?: UploadContext) => {
      if (context?.projectId) {
        globalMutate(cacheKeys.projectData(context.projectId));
      }

      // Refresh page artifacts if we have a pageId (for /p/ presentation page)
      if (context?.pageId) {
        globalMutate(cacheKeys.pageArtifacts(context.pageId));
      }

      if (user?.id) {
        globalMutate(cacheKeys.projectsData(user.id));
      }

      const folderId = searchParams?.get("id");
      if (pathname === "/folder/" && folderId) {
        globalMutate(cacheKeys.folderData(folderId));
      }
    },
    [pathname, searchParams, user?.id]
  );

  // Use upload hook for drag/drop and paste uploads
  const {
    uploadState,
    pendingFiles,
    showPreviewDialog,
    stageFilesForUpload,
    confirmFileUpload,
    clearPendingFiles,
    pendingUrl,
    showUrlPreviewDialog,
    stageUrlForUpload,
    confirmUrlUpload,
    clearPendingUrl,
  } = useArtifactUpload({
    onArtifactCreated: handleArtifactCreated,
  });

  const { uploading, currentFileIndex, currentProgress, totalFiles } =
    uploadState;

  // Determine if we're on a page that requires project selection
  const requireProjectSelection =
    pathname === "/projects/" || pathname === "/folder/";

  // Get current project context from URL if on project page
  const getUploadContext = useCallback(() => {
    const projectId = searchParams?.get("id");
    const pageId = searchParams?.get("page");
    if (projectId && pageId) {
      return { projectId, pageId };
    }
    return undefined;
  }, [searchParams]);

  const handleFileUpload = useCallback(
    (files: File[]) => {
      const context = getUploadContext();
      stageFilesForUpload(files, context, requireProjectSelection);
    },
    [getUploadContext, stageFilesForUpload, requireProjectSelection]
  );

  const handleUrlAdd = useCallback(
    (url: string) => {
      const context = getUploadContext();
      stageUrlForUpload(url, context, requireProjectSelection);
    },
    [getUploadContext, stageUrlForUpload, requireProjectSelection]
  );

  // Wrap confirmFileUpload to also refresh caches
  const handleConfirmUpload = useCallback(
    async (
      uploads: Parameters<typeof confirmFileUpload>[0],
      context?: UploadContext
    ) => {
      await confirmFileUpload(uploads, context);
      refreshCachesForContext(context || pendingFiles?.context);
    },
    [confirmFileUpload, refreshCachesForContext, pendingFiles?.context]
  );

  // Wrap confirmUrlUpload to also refresh caches
  const handleConfirmUrlUpload = useCallback(
    async (
      url: string,
      name: string,
      description: string,
      viewport: Parameters<typeof confirmUrlUpload>[3],
      context?: UploadContext
    ) => {
      await confirmUrlUpload(url, name, description, viewport, context);
      refreshCachesForContext(context || pendingUrl?.context);
    },
    [confirmUrlUpload, refreshCachesForContext, pendingUrl?.context]
  );

  // Handle paste events for files and URLs
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      // Ignore paste when focus is in an input, textarea, or contenteditable element
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      // Also ignore if a dialog is open (check for radix dialog)
      if (document.querySelector("[role='dialog']")) {
        return;
      }

      const text = e.clipboardData?.getData("text/plain");
      if (text) {
        try {
          new URL(text);
          handleUrlAdd(text);
        } catch {
          // Not a valid URL, ignore
        }
      } else {
        const files = e.clipboardData?.files;
        if (files && files.length > 0) {
          handleFileUpload(Array.from(files));
        }
      }
    },
    [handleFileUpload, handleUrlAdd]
  );

  // Set up paste listener
  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  // Drag and drop handlers
  useEffect(() => {
    function hasFilesOrUrl(evt: DragEvent) {
      const types = Array.from(evt.dataTransfer?.types ?? []);
      return (
        types.includes("Files") ||
        types.includes("text/uri-list") ||
        types.includes("text/plain")
      );
    }

    // Track when drag starts from within the page
    function handleDragStart() {
      isInternalDrag.current = true;
    }

    function handleDragEnd() {
      isInternalDrag.current = false;
    }

    function handleDragEnter(evt: DragEvent) {
      if (!hasFilesOrUrl(evt) || isInternalDrag.current) return;
      dragDepth.current += 1;
      setDragging(true);
    }

    function handleDragOver(evt: DragEvent) {
      if (!hasFilesOrUrl(evt) || isInternalDrag.current) return;
      evt.preventDefault();
    }

    function handleDragLeave(evt: DragEvent) {
      if (!hasFilesOrUrl(evt) || isInternalDrag.current) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setDragging(false);
      }
    }

    async function handleDrop(evt: DragEvent) {
      // Reset internal drag flag on drop
      const wasInternalDrag = isInternalDrag.current;
      isInternalDrag.current = false;

      if (!hasFilesOrUrl(evt) || wasInternalDrag) return;
      evt.preventDefault();
      dragDepth.current = 0;
      setDragging(false);

      const files = Array.from(evt.dataTransfer?.files ?? []);
      if (files.length) {
        handleFileUpload(files);
        return;
      }

      const uri =
        evt.dataTransfer?.getData("text/uri-list") ||
        evt.dataTransfer?.getData("text/plain");
      if (uri) {
        const trimmedUri = uri.trim();
        // Validate it's a proper URL
        try {
          new URL(trimmedUri);
        } catch {
          // Not a valid URL, ignore
          return;
        }
        handleUrlAdd(trimmedUri);
      }
    }

    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragend", handleDragEnd);
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("dragend", handleDragEnd);
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleFileUpload, handleUrlAdd]);

  return (
    <>
      {/* Drag overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{ pointerEvents: dragging ? "auto" : "none" }}
      >
        {dragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/60 backdrop-blur-lg text-text-primary pointer-events-none">
            <div className="text-center space-y-3 w-full max-w-xs px-6">
              <div className="text-medium">Drop to upload your artifacts</div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Preview Dialog */}
      <UploadPreviewDialog
        files={pendingFiles?.files || []}
        isOpen={showPreviewDialog}
        onClose={clearPendingFiles}
        onConfirm={handleConfirmUpload}
        uploading={uploading}
        uploadProgress={
          uploading
            ? {
                currentIndex: currentFileIndex,
                currentProgress,
                totalFiles,
              }
            : undefined
        }
        requireProjectSelection={pendingFiles?.requireProjectSelection}
        initialContext={pendingFiles?.context}
      />

      {/* URL Preview Dialog */}
      <UrlPreviewDialog
        url={pendingUrl?.url || ""}
        isOpen={showUrlPreviewDialog}
        onClose={clearPendingUrl}
        onConfirm={handleConfirmUrlUpload}
        uploading={uploading}
        requireProjectSelection={pendingUrl?.requireProjectSelection}
        initialContext={pendingUrl?.context}
      />
    </>
  );
}
