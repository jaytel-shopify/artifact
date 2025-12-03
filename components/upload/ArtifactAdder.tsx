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
import {
  VIEWPORTS,
  DEFAULT_VIEWPORT_KEY,
  type ViewportKey,
} from "@/lib/viewports";
import { useArtifactUpload } from "@/hooks/useArtifactUpload";
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
  const [url, setUrl] = useState("");
  const [viewport, setViewport] = useState<ViewportKey>(DEFAULT_VIEWPORT_KEY);
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");

  // Build context if both projectId and pageId are provided
  const defaultContext = projectId && pageId ? { projectId, pageId } : undefined;

  // Use centralized upload hook - handles artifact creation internally
  const {
    uploadState,
    fileInputRef,
    handleFileInputChange,
    handleUrlUpload,
    handleTitleCardUpload,
    openFilePicker,
  } = useArtifactUpload({
    defaultContext,
    onArtifactCreated,
  });

  const {
    uploading,
    totalFiles,
    currentFileIndex,
    currentFileName,
    currentProgress,
    error,
  } = uploadState;

  function resetUrlState() {
    setUrl("");
    setViewport(DEFAULT_VIEWPORT_KEY);
  }

  function resetTitleCardState() {
    setHeadline("");
    setSubheadline("");
  }

  // Handle URL submission
  async function handleUrlSubmit() {
    if (!url) return;
    try {
      await handleUrlUpload(url, viewport);
      setOpenDialog(null);
      resetUrlState();
    } catch {
      // Error already handled by hook
    }
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

      {/* URL Dialog */}
      <Dialog
        open={openDialog === "url"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpenDialog(null);
            resetUrlState();
          }
        }}
      >
        <DialogContent
          className="w-full max-w-2xl"
          showCloseButton={!uploading}
        >
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Embed via URL
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/artifact"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <p className="text-small text-text-primary/70">Viewport</p>
              <div className="flex flex-wrap gap-2 text-small">
                {Object.entries(VIEWPORTS).map(([key, vp]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setViewport(key as ViewportKey)}
                    disabled={uploading}
                    className={`rounded-full px-3 py-1 border transition cursor-pointer border-border bg-secondary text-text-primary disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {vp.label}
                  </button>
                ))}
              </div>
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
                resetUrlState();
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUrlSubmit}
              disabled={uploading || !url}
              variant="primary"
            >
              {uploading ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="space-y-2">
              <label className="text-small text-text-primary/70">
                Headline
              </label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Enter headline"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-small text-text-primary/70">
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

      {/* Upload Progress Dialog */}
      <Dialog open={uploading} onOpenChange={() => {}}>
        <DialogContent className="w-full max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Uploading Files
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {totalFiles > 1 && (
              <div className="text-small text-text-primary/70">
                File {currentFileIndex} of {totalFiles}
              </div>
            )}

            {currentFileName && (
              <div className="text-small text-text-primary/90 truncate">
                {currentFileName}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-small">
                <span className="text-text-primary/70">Progress</span>
                <span className="text-text-primary/90">
                  {Math.round(currentProgress)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-text-primary/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-text-primary transition-all duration-300 ease-out"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
