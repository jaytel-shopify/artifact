"use client";

import { useState } from "react";
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

type DialogType = "url" | "titleCard" | null;

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

  // Build context if both projectId and pageId are provided
  const defaultContext =
    projectId && pageId ? { projectId, pageId } : undefined;

  // Use centralized upload hook - handles artifact creation internally
  const {
    uploadState,
    fileInputRef,
    pendingFiles,
    showPreviewDialog,
    handleFileInputChange,
    confirmFileUpload,
    clearPendingFiles,
    confirmUrlUpload,
    handleTitleCardUpload,
    openFilePicker,
  } = useArtifactUpload({
    defaultContext,
    onArtifactCreated,
  });

  const { uploading, totalFiles, currentFileIndex, currentProgress, error } =
    uploadState;

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

  return (
    <>
      {/* Hidden file input for media uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileInputChange}
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
          <DropdownMenuItem onClick={openFilePicker} className="cursor-pointer">
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
