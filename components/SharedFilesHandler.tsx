"use client";

import { useEffect } from "react";
import { useArtifactUpload } from "@/hooks/useArtifactUpload";
import UploadPreviewDialog from "@/components/upload/UploadPreviewDialog";

// Type declarations for the File Handling API (launchQueue)
// https://developer.mozilla.org/en-US/docs/Web/API/Launch_Handler_API
interface LaunchParams {
  files: FileSystemFileHandle[];
  targetURL?: string;
}

interface LaunchQueue {
  setConsumer(callback: (launchParams: LaunchParams) => void): void;
}

declare global {
  interface Window {
    launchQueue?: LaunchQueue;
  }
}

/**
 * Handles files from:
 * 1. PWA Share Target API (via service worker postMessage)
 * 2. PWA File Handlers API (via launchQueue when files are opened with the app)
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

  const {
    uploading,
    totalFiles,
    currentFileIndex,
    currentProgress,
    currentProgressType,
  } = uploadState;

  // Handle files from Share Target API (service worker messages)
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

  // Handle files from File Handlers API (launchQueue)
  // This handles files opened directly with the app (e.g., double-click → Open With)
  useEffect(() => {
    if (!window.launchQueue) return;

    window.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams.files || launchParams.files.length === 0) return;

      const files: File[] = [];

      for (const fileHandle of launchParams.files) {
        try {
          const file = await fileHandle.getFile();
          files.push(file);
        } catch (err) {
          console.error("Failed to get file from launch handle:", err);
        }
      }

      if (files.length > 0) {
        // Stage files for upload with project selection required
        stageFilesForUpload(files, undefined, true);
      }
    });
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
              type: currentProgressType,
            }
          : undefined
      }
      requireProjectSelection={pendingFiles?.requireProjectSelection}
    />
  );
}
