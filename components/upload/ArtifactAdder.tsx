"use client";

import { useRef, useState } from "react";
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
  getViewportDimensions,
  type ViewportKey,
} from "@/lib/viewports";
import { useSyncedArtifacts } from "@/hooks/useSyncedArtifacts";
import { generateArtifactName } from "@/lib/artifactNames";
import {
  uploadFile,
  getArtifactTypeFromMimeType,
  validateFile,
} from "@/lib/quick-storage";
import { generateAndUploadThumbnail } from "@/lib/video-thumbnails";
import { toast } from "sonner";

type DialogType = "url" | "titleCard" | null;

export default function ArtifactAdder({
  projectId,
  pageId,
  onAdded,
  createArtifact,
}: {
  projectId?: string;
  pageId?: string;
  onAdded?: () => void;
  createArtifact: ReturnType<typeof useSyncedArtifacts>["createArtifact"];
}) {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [url, setUrl] = useState("");
  const [viewport, setViewport] = useState<ViewportKey>(DEFAULT_VIEWPORT_KEY);
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetUrlState() {
    setUrl("");
    setViewport(DEFAULT_VIEWPORT_KEY);
    setError(null);
  }

  function resetTitleCardState() {
    setHeadline("");
    setSubheadline("");
    setError(null);
  }

  // Handle media file selection
  async function handleMediaFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setUploading(true);
    setTotalFiles(files.length);
    setCurrentFileIndex(0);
    setUploadProgress(0);

    try {
      // Validate all files first (50MB limit)
      for (const file of files) {
        const validation = validateFile(file, { maxSizeMB: 250 });
        if (!validation.valid) {
          toast.error(validation.error || "File too large");
          setUploading(false);
          return;
        }
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileName(file.name);
        setCurrentFileIndex(i + 1);
        setUploadProgress(0);

        // Upload file to Quick.fs
        const upResult = await uploadFile(file, (progress) => {
          setUploadProgress(progress.percentage);
        });

        // Determine file type from MIME type
        const type = getArtifactTypeFromMimeType(upResult.mimeType);

        // Set default metadata for videos (muted, loop, hide controls)
        const defaultMetadata =
          type === "video" ? { hideUI: true, loop: true, muted: true } : {};

        // Create artifact using the hook with generated name
        const artifactName = generateArtifactName(type, upResult.fullUrl, file);
        const artifact = await createArtifact({
          type,
          source_url: upResult.fullUrl, // Use fullUrl for display
          file_path: upResult.url, // Store relative url
          name: artifactName,
          metadata: defaultMetadata,
        });

        // Generate thumbnail asynchronously for videos (don't await)
        if (type === "video" && artifact) {
          generateAndUploadThumbnail(file, artifact.id).catch((err) => {
            console.error("Thumbnail generation failed:", err);
          });
        }
      }

      toast.success(
        `Successfully uploaded ${files.length} file${files.length > 1 ? "s" : ""}`
      );
      onAdded?.();
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setCurrentFileName("");
      setCurrentFileIndex(0);
      setTotalFiles(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // Handle URL submission
  async function handleUrlSubmit() {
    if (!url) return;

    setError(null);
    setUploading(true);

    try {
      const dims = getViewportDimensions(viewport);

      // Create URL artifact using the hook with generated name
      const artifactName = generateArtifactName("url", url);
      await createArtifact({
        type: "url",
        source_url: url,
        name: artifactName,
        metadata: {
          viewport,
          width: dims.width,
          height: dims.height,
        },
      });

      toast.success("Successfully added URL artifact");
      setOpenDialog(null);
      resetUrlState();
      onAdded?.();
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || "Failed to add URL. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // Handle Title Card submission
  async function handleTitleCardSubmit() {
    if (!headline && !subheadline) {
      setError("Please enter at least a headline or subheadline");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create title card artifact
      await createArtifact({
        type: "titleCard",
        source_url: "", // No source URL for title cards
        name: headline || "Title Card",
        metadata: {
          headline,
          subheadline,
        },
      });

      toast.success("Successfully added title card");
      setOpenDialog(null);
      resetTitleCardState();
      onAdded?.();
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || "Failed to add title card. Please try again.");
    } finally {
      setUploading(false);
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
        onChange={handleMediaFiles}
      />

      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Add artifact">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
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
          <DropdownMenuItem
            onClick={() => setOpenDialog("titleCard")}
            className="cursor-pointer"
          >
            <Type className="h-4 w-4 mr-2" />
            Title Card
          </DropdownMenuItem>
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
          className="w-full max-w-2xl text-white border-white/10"
          style={{ backgroundColor: "var(--color-background-secondary)" }}
          showCloseButton={!uploading}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Embed via URL</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/artifact"
                className="w-full bg-white/5 border-white/15 text-white placeholder:text-white/60 focus:border-white/30 focus:ring-white/20"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-white/70">Viewport</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(VIEWPORTS).map(([key, vp]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setViewport(key as ViewportKey)}
                    disabled={uploading}
                    className={`rounded-full px-3 py-1 border transition cursor-pointer ${
                      viewport === key
                        ? "border-white/40 bg-white/20 text-white"
                        : "border-white/15 bg-white/5 text-white/70 hover:border-white/30"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {vp.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setOpenDialog(null);
                resetUrlState();
              }}
              disabled={uploading}
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUrlSubmit}
              disabled={uploading || !url}
              className="bg-white text-black hover:bg-white/90"
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
          className="w-full max-w-2xl text-white border-white/10"
          style={{ backgroundColor: "var(--color-background-secondary)" }}
          showCloseButton={!uploading}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Create Title Card</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Headline</label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Enter headline"
                className="w-full bg-white/5 border-white/15 text-white placeholder:text-white/60 focus:border-white/30 focus:ring-white/20"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Subheadline</label>
              <Input
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="Enter subheadline"
                className="w-full bg-white/5 border-white/15 text-white placeholder:text-white/60 focus:border-white/30 focus:ring-white/20"
                disabled={uploading}
              />
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setOpenDialog(null);
                resetTitleCardState();
              }}
              disabled={uploading}
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTitleCardSubmit}
              disabled={uploading || (!headline && !subheadline)}
              className="bg-white text-black hover:bg-white/90"
            >
              {uploading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Progress Dialog */}
      <Dialog open={uploading} onOpenChange={() => {}}>
        <DialogContent
          className="w-full max-w-md text-white border-white/10"
          style={{ backgroundColor: "var(--color-background-secondary)" }}
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Uploading Files</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {totalFiles > 1 && (
              <div className="text-sm text-white/70">
                File {currentFileIndex} of {totalFiles}
              </div>
            )}

            {currentFileName && (
              <div className="text-sm text-white/90 truncate">
                {currentFileName}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Progress</span>
                <span className="text-white/90">
                  {Math.round(uploadProgress)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
