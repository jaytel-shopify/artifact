"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { mutate as globalMutate } from "swr";
import { usePublicArtifacts } from "@/hooks/usePublicArtifacts";
import { useArtifactUpload, type UploadContext } from "@/hooks/useArtifactUpload";
import { useAuth } from "@/components/auth/AuthProvider";
import { cacheKeys } from "@/lib/cache-keys";
import UploadPreviewDialog from "./UploadPreviewDialog";
import type { Artifact } from "@/types";

export default function DropzoneUploader() {
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { addArtifact } = usePublicArtifacts();

  // Handle artifact creation - add to public feed if published
  const handleArtifactCreated = useCallback(
    (artifact: Artifact) => {
      if (artifact.published) {
        addArtifact(artifact);
      }
    },
    [addArtifact]
  );

  // Refresh caches after upload completes based on context
  const refreshCachesForContext = useCallback(
    (context?: UploadContext) => {
      if (context?.projectId) {
        globalMutate(cacheKeys.projectData(context.projectId));
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
    handleUrlUpload,
  } = useArtifactUpload({
    onArtifactCreated: handleArtifactCreated,
  });

  const { uploading, currentFileIndex, currentProgress, totalFiles } = uploadState;

  // Determine if we're on a page that requires project selection
  const requireProjectSelection = pathname === "/projects/" || pathname === "/folder/";

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
      handleUrlUpload(url, undefined, context);
    },
    [getUploadContext, handleUrlUpload]
  );

  // Wrap confirmFileUpload to also refresh caches
  const handleConfirmUpload = useCallback(
    async (uploads: Parameters<typeof confirmFileUpload>[0], context?: UploadContext) => {
      await confirmFileUpload(uploads, context);
      refreshCachesForContext(context || pendingFiles?.context);
    },
    [confirmFileUpload, refreshCachesForContext, pendingFiles?.context]
  );

  // Handle paste events for files and URLs
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
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

    function handleDragEnter(evt: DragEvent) {
      if (!hasFilesOrUrl(evt)) return;
      dragDepth.current += 1;
      setDragging(true);
    }

    function handleDragOver(evt: DragEvent) {
      if (!hasFilesOrUrl(evt)) return;
      evt.preventDefault();
    }

    function handleDragLeave(evt: DragEvent) {
      if (!hasFilesOrUrl(evt)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setDragging(false);
      }
    }

    async function handleDrop(evt: DragEvent) {
      if (!hasFilesOrUrl(evt)) return;
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
        handleUrlAdd(uri.trim());
      }
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background/10 border border-text-primary/20">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6 text-text-primary"
                >
                  <path
                    d="M12 16v-8m0 0 3 3m-3-3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 17.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-medium">Drop to upload your artifacts</div>
              <div className="text-small text-text-secondary">
                Images or videos up to 50MB each
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-background/10">
                <div className="h-full w-full animate-[progress_1.2s_linear_infinite] bg-text-primary" />
              </div>
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
    </>
  );
}
