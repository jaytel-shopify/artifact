"use client";

import { useEffect } from "react";
import { useArtifactUpload } from "@/hooks/useArtifactUpload";
import UploadPreviewDialog from "@/components/upload/UploadPreviewDialog";

/**
 * Handles files shared via the PWA Share Target API.
 * Listens for postMessage from the service worker and opens the upload dialog.
 */
export function SharedFilesHandler() {
  const {
    uploadState,
    pendingFiles,
    showPreviewDialog,
    stageFilesForUpload,
    confirmFileUpload,
    clearPendingFiles,
  } = useArtifactUpload({
    // No default context - user will select project in dialog or create standalone
  });

  const { uploading, totalFiles, currentFileIndex, currentProgress } =
    uploadState;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SHARED_FILES") {
        const files = event.data.files as File[];
        if (files && files.length > 0) {
          // Stage files for upload - this opens the preview dialog
          // requireProjectSelection=true so user can choose where to save
          stageFilesForUpload(files, undefined, true);
        }
      }
    };

    // Listen for messages from the service worker
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, [stageFilesForUpload]);

  return (
    <UploadPreviewDialog
      files={pendingFiles?.files || []}
      isOpen={showPreviewDialog}
      onClose={clearPendingFiles}
      onConfirm={confirmFileUpload}
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
    />
  );
}

