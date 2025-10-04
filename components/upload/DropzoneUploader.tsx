"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function DropzoneUploader({
  onFiles,
  onUrl,
  onDragStateChange,
}: {
  onFiles: (files: File[]) => void | Promise<void>;
  onUrl?: (url: string) => void | Promise<void>;
  onDragStateChange?: (dragging: boolean) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const setDragState = useCallback(
    (next: boolean) => {
      setDragging(next);
      onDragStateChange?.(next);
    },
    [onDragStateChange]
  );

  useEffect(() => {
    function hasFilesOrUrl(evt: DragEvent) {
      const types = Array.from(evt.dataTransfer?.types ?? []);
      return types.includes("Files") || types.includes("text/uri-list") || types.includes("text/plain");
    }

    function handleDragEnter(evt: DragEvent) {
      if (!hasFilesOrUrl(evt)) return;
      dragDepth.current += 1;
      setDragState(true);
    }

    function handleDragOver(evt: DragEvent) {
      if (!hasFilesOrUrl(evt)) return;
      evt.preventDefault();
    }

    function handleDragLeave(evt: DragEvent) {
      if (!hasFilesOrUrl(evt)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setDragState(false);
      }
    }

    async function handleDrop(evt: DragEvent) {
      if (!hasFilesOrUrl(evt)) return;
      evt.preventDefault();
      dragDepth.current = 0;
      setDragState(false);

      const files = Array.from(evt.dataTransfer?.files ?? []);
      if (files.length) {
        await onFiles(files);
        return;
      }

      const uri = evt.dataTransfer?.getData("text/uri-list") || evt.dataTransfer?.getData("text/plain");
      if (uri && onUrl) {
        await onUrl(uri.trim());
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
  }, [onFiles, onUrl, setDragState]);

  return (
    <div
      className="absolute inset-0 z-10"
      style={{ pointerEvents: dragging ? "auto" : "none" }}
    >
      {dragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-lg text-white/90 pointer-events-none">
          <div className="text-center space-y-3 w-full max-w-xs px-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white/90">
                <path d="M12 16v-8m0 0 3 3m-3-3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 17.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm font-medium">Drop to upload your artifacts</div>
            <div className="text-xs text-white/70">Images or videos up to 50MB each</div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-[progress_1.2s_linear_infinite] bg-white/70" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


