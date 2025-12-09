"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Image, Link, Type } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useArtifactUpload } from "@/hooks/useArtifactUpload";
import UploadPreviewDialog from "./UploadPreviewDialog";
import UrlPreviewDialog from "./UrlPreviewDialog";
import type { Artifact, ArtifactWithPosition } from "@/types";
import { useSearchParams } from "next/navigation";

type DialogType = "url" | "titleCard" | "media" | null;

interface ArtifactAdderProps {
  projectId?: string;
  pageId?: string;
  variant?: "default" | "icon";
  /** Called after artifact is created. Receives the created artifact. */
  onArtifactCreated?: (artifact: Artifact | ArtifactWithPosition) => void;
}

export default function ArtifactAdder({
  projectId,
  pageId,
  variant = "default",
  onArtifactCreated,
}: ArtifactAdderProps) {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");

  const searchParams = useSearchParams();
  useEffect(() => {
    const newParam = searchParams.get("new");
    if (newParam === "url") {
      setOpenDialog("url");
    } else if (newParam === "media") {
      setOpenDialog("media");
    }
  }, [searchParams]);

  // Build context if both projectId and pageId are provided
  const defaultContext =
    projectId && pageId ? { projectId, pageId } : undefined;

  // Use centralized upload hook - handles artifact creation internally
  const {
    uploadState,
    pendingFiles,
    showPreviewDialog,
    stageFilesForUpload,
    confirmFileUpload,
    clearPendingFiles,
    confirmUrlUpload,
    handleTitleCardUpload,
  } = useArtifactUpload({
    defaultContext,
    onArtifactCreated,
  });

  const { uploading, totalFiles, currentFileIndex, currentProgress, error } =
    uploadState;

  // Media dialog is open if explicitly set OR if there are pending files from hook
  const isMediaDialogOpen = openDialog === "media" || showPreviewDialog;

  // Hidden file input ref for fallback when showOpenFilePicker is not supported
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle opening file picker using native API or fallback
  const handleOpenFilePicker = useCallback(async () => {
    // Check if showOpenFilePicker is supported (File System Access API)
    const windowWithPicker = window as Window & {
      showOpenFilePicker?: (options?: {
        multiple?: boolean;
        types?: Array<{
          description?: string;
          accept: Record<string, string[]>;
        }>;
      }) => Promise<FileSystemFileHandle[]>;
    };

    if (windowWithPicker.showOpenFilePicker) {
      try {
        const fileHandles = await windowWithPicker.showOpenFilePicker({
          multiple: true,
          types: [
            {
              description: "Media files",
              accept: {
                "image/*": [".png", ".gif", ".jpeg", ".jpg", ".webp", ".svg"],
                "video/*": [".mp4", ".webm", ".mov", ".avi"],
              },
            },
          ],
        });

        // Get File objects from handles
        const files = await Promise.all(
          fileHandles.map((handle: FileSystemFileHandle) => handle.getFile())
        );

        if (files.length > 0) {
          stageFilesForUpload(files);
        }
      } catch (err) {
        // User cancelled the picker - that's fine, do nothing
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        // For other errors, fall back to input
        fileInputRef.current?.click();
      }
    } else {
      // Fallback to traditional file input
      fileInputRef.current?.click();
    }
  }, [stageFilesForUpload]);

  // Handle file input change (fallback)
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        stageFilesForUpload(files);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [stageFilesForUpload]
  );

  function resetTitleCardState() {
    setHeadline("");
    setSubheadline("");
  }

  // Handle Title Card submission
  async function handleTitleCardSubmit() {
    try {
      await handleTitleCardUpload(headline, subheadline);
      setOpenDialog(null);
      resetTitleCardState();
    } catch {
      // Error already handled by hook
    }
  }

  // Handle closing media dialog - clears both local state and pending files
  const handleMediaDialogClose = () => {
    setOpenDialog(null);
    clearPendingFiles();
  };

  // Handle files added from within the dialog
  const handleFilesAdded = (files: File[]) => {
    stageFilesForUpload(files);
  };

  return (
    <>
      {/* Hidden file input for fallback */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="primary"
            size={variant === "icon" ? "icon" : "default"}
            aria-label="Add artifact"
          >
            {variant === "icon" ? <Plus className="h-4 w-4" /> : "Upload"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={handleOpenFilePicker}
            className="cursor-pointer"
          >
            <Image className="h-4 w-4 mr-2" />
            Media
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenDialog("url")}
            className="cursor-pointer"
          >
            <Link className="h-4 w-4 mr-2" />
            URL
          </DropdownMenuItem>
          {projectId && pageId && (
            <DropdownMenuItem
              onClick={() => setOpenDialog("titleCard")}
              className="cursor-pointer"
            >
              <Type className="h-4 w-4 mr-2" />
              Title Card
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upload Preview Dialog */}
      <UploadPreviewDialog
        files={pendingFiles?.files || []}
        isOpen={isMediaDialogOpen}
        onClose={handleMediaDialogClose}
        onConfirm={(uploads, context) => {
          confirmFileUpload(uploads, context);
          setOpenDialog(null);
        }}
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
        allowEmptyOpen
        onFilesAdded={handleFilesAdded}
      />

      {/* URL Preview Dialog */}
      <UrlPreviewDialog
        isOpen={openDialog === "url"}
        onClose={() => setOpenDialog(null)}
        onConfirm={async (url, name, description, viewport) => {
          await confirmUrlUpload(url, name, description, viewport);
          setOpenDialog(null);
        }}
        uploading={uploading}
        initialContext={defaultContext}
        showQuickSites
      />

      {/* Title Card Dialog */}
      <Dialog
        open={openDialog === "titleCard"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpenDialog(null);
            resetTitleCardState();
          }
        }}
      >
        <DialogContent
          className="w-full max-w-2xl"
          showCloseButton={!uploading}
        >
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Create Title Card
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="gap-2 flex flex-col">
              <label className="text-small text-text-secondary">Headline</label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Enter headline"
                disabled={uploading}
              />
            </div>

            <div className="gap-2 flex flex-col">
              <label className="text-small text-text-secondary">
                Subheadline
              </label>
              <Input
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="Enter subheadline"
                disabled={uploading}
              />
            </div>

            {error && (
              <div className="text-small text-destructive">{error}</div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setOpenDialog(null);
                resetTitleCardState();
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleTitleCardSubmit}
              disabled={uploading || (!headline && !subheadline)}
            >
              {uploading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
