"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFigmaImport } from "@/hooks/useFigmaImport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FolderPlus,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  ImageIcon,
  X,
} from "lucide-react";
import type { FigmaFrame } from "@/types/figma-import";

type ProjectMode = "existing" | "new";

export default function FigmaImportPage() {
  const { user, loading: isAuthLoading } = useAuth();

  const {
    state,
    frames,
    progress,
    error,
    projects,
    pages,
    isLoadingProjects,
    loadProjects,
    loadPages,
    importFrames,
    reset,
    addFramesFromFiles,
  } = useFigmaImport();

  // Form state
  const [projectMode, setProjectMode] = useState<ProjectMode>("new");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [importResult, setImportResult] = useState<{
    projectId: string;
    projectName: string;
  } | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle paste from Figma plugin clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Try to get text data first (JSON from Figma plugin)
      const text = e.clipboardData?.getData("text/plain");

      if (text) {
        try {
          const data = JSON.parse(text);

          // Check if this is data from our Figma plugin
          if (data.type === "artifact-figma-import" && Array.isArray(data.frames)) {
            e.preventDefault();

            // Convert the frames to files and add them
            const files: File[] = [];

            for (const frame of data.frames) {
              try {
                // Handle both data URL and raw base64 formats
                const imageData = frame.imageData.startsWith("data:")
                  ? frame.imageData
                  : `data:image/png;base64,${frame.imageData}`;

                const response = await fetch(imageData);
                const blob = await response.blob();
                const file = new File([blob], `${frame.name}.png`, {
                  type: "image/png",
                });
                files.push(file);
              } catch (err) {
                console.error(`Failed to process frame ${frame.name}:`, err);
              }
            }

            if (files.length > 0) {
              await addFramesFromFiles(files);
            }

            return;
          }
        } catch {
          // Not JSON, might be regular paste - ignore
        }
      }

      // Fallback: handle image paste from clipboard (standard image copy)
      const items = e.clipboardData?.items;
      if (items) {
        const imageFiles: File[] = [];

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          e.preventDefault();
          await addFramesFromFiles(imageFiles);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [addFramesFromFiles]);

  // Load projects when user is ready
  useEffect(() => {
    if (user?.id && !isAuthLoading) {
      loadProjects();
    }
  }, [user?.id, isAuthLoading, loadProjects]);

  // Load pages when project selection changes
  useEffect(() => {
    if (selectedProjectId && projectMode === "existing") {
      loadPages(selectedProjectId);
    }
  }, [selectedProjectId, projectMode, loadPages]);

  // Auto-select first page when pages load
  useEffect(() => {
    if (pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );

      if (files.length > 0) {
        await addFramesFromFiles(files);
      }
    },
    [addFramesFromFiles]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) =>
        f.type.startsWith("image/")
      );

      if (files.length > 0) {
        await addFramesFromFiles(files);
      }

      // Reset input
      e.target.value = "";
    },
    [addFramesFromFiles]
  );

  // Handle import
  const handleImport = async () => {
    const result = await importFrames({
      projectId: projectMode === "existing" ? selectedProjectId : null,
      pageId: projectMode === "existing" ? selectedPageId : null,
      newProjectName: projectMode === "new" ? newProjectName : undefined,
    });

    if (result) {
      setImportResult(result);
    }
  };

  // Check if import can proceed
  const canImport =
    frames.length > 0 &&
    (projectMode === "new"
      ? newProjectName.trim().length > 0
      : selectedProjectId && selectedPageId);

  // Not logged in
  if (!isAuthLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-card bg-primary p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-text-secondary" />
          <h1 className="text-xlarge mb-2">Sign In Required</h1>
          <p className="text-small text-text-secondary">
            Please sign in to import frames from Figma.
          </p>
        </div>
      </div>
    );
  }

  // Loading auth
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xlarge mb-2">Import from Figma</h1>
          <p className="text-small text-text-secondary">
            {state === "waiting"
              ? "Drag and drop images or connect from Figma"
              : state === "frames_received"
                ? `${frames.length} frame${frames.length !== 1 ? "s" : ""} ready to import`
                : state === "importing"
                  ? `Importing ${progress.completed + 1} of ${progress.total}...`
                  : state === "complete"
                    ? "Import complete!"
                    : "An error occurred"}
          </p>
        </div>

        {/* Main Content */}
        <div className="rounded-card bg-primary p-6 shadow-lg">
          {/* Waiting State - Paste Zone */}
          {state === "waiting" && (
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                flex min-h-[320px] flex-col items-center justify-center rounded-card-inner border-2 border-dashed
                transition-colors duration-200
                ${isDragging ? "border-text-primary bg-secondary/10" : "border-border"}
              `}
            >
              {/* Big Keyboard Shortcut */}
              <div className="mb-6 flex items-center gap-2">
                <kbd className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-800 text-2xl font-semibold text-white shadow-lg ring-1 ring-white/10">
                  ⌘
                </kbd>
                <span className="text-2xl font-light text-text-secondary">+</span>
                <kbd className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-800 text-2xl font-semibold text-white shadow-lg ring-1 ring-white/10">
                  V
                </kbd>
              </div>

              <p className="text-large font-medium mb-2">
                {isDragging ? "Drop images here" : "Paste from Figma"}
              </p>
              <p className="text-small text-text-secondary mb-6 max-w-[280px] text-center">
                Copy frames from the Figma plugin, then paste here
              </p>

              <div className="flex items-center gap-2 text-small text-text-secondary">
                <span className="h-px w-8 bg-border" />
                <span>or</span>
                <span className="h-px w-8 bg-border" />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <Button variant="ghost" size="sm" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Browse Files
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          )}

          {/* Frames Received - Preview and Project Selection */}
          {state === "frames_received" && (
            <div className="space-y-6">
              {/* Frame Previews */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-medium">Frames to Import</h2>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {frames.map((frame) => (
                    <FramePreview key={frame.id} frame={frame} />
                  ))}
                </div>
              </div>

              {/* Project Selection */}
              <div className="space-y-4 border-t border-border pt-6">
                <h2 className="text-medium">Destination</h2>

                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={projectMode === "new" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setProjectMode("new")}
                  >
                    <FolderPlus className="h-4 w-4" />
                    New Project
                  </Button>
                  <Button
                    variant={projectMode === "existing" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setProjectMode("existing")}
                    disabled={projects.length === 0}
                  >
                    Existing Project
                  </Button>
                </div>

                {/* New Project Form */}
                {projectMode === "new" && (
                  <div className="space-y-2">
                    <label className="text-small text-text-secondary">
                      Project Name
                    </label>
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="My Figma Import"
                      autoFocus
                    />
                  </div>
                )}

                {/* Existing Project Selection */}
                {projectMode === "existing" && (
                  <div className="space-y-4">
                    {isLoadingProjects ? (
                      <div className="flex items-center gap-2 text-small text-text-secondary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading projects...
                      </div>
                    ) : projects.length === 0 ? (
                      <p className="text-small text-text-secondary">
                        No projects found. Create a new one instead.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-small text-text-secondary">
                            Project
                          </label>
                          <Select
                            value={selectedProjectId}
                            onValueChange={(value) => {
                              setSelectedProjectId(value);
                              setSelectedPageId("");
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedProjectId && pages.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-small text-text-secondary">
                              Page
                            </label>
                            <Select
                              value={selectedPageId}
                              onValueChange={setSelectedPageId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a page" />
                              </SelectTrigger>
                              <SelectContent>
                                {pages.map((page) => (
                                  <SelectItem key={page.id} value={page.id}>
                                    {page.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Import Button */}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleImport}
                  disabled={!canImport}
                >
                  Import {frames.length} Frame{frames.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          )}

          {/* Importing State */}
          {state === "importing" && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-text-secondary" />
              <p className="text-medium mb-2">
                Importing {progress.currentFrameName || "..."}
              </p>
              <p className="text-small text-text-secondary">
                {progress.completed} of {progress.total} complete
              </p>
              <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary/20">
                <div
                  className="h-full bg-text-primary transition-all duration-300"
                  style={{
                    width: `${(progress.completed / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Complete State */}
          {state === "complete" && importResult && (
            <div className="flex flex-col items-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-medium mb-2">Import Complete!</p>
              <p className="text-small text-text-secondary mb-6">
                {frames.length} frame{frames.length !== 1 ? "s" : ""} added to{" "}
                <strong>{importResult.projectName}</strong>
              </p>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  href={`/p/?id=${importResult.projectId}`}
                >
                  View Project
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Import More
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="flex flex-col items-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-medium mb-2">Import Failed</p>
              <p className="text-small text-text-secondary mb-6">
                {error || "An unexpected error occurred"}
              </p>
              <Button variant="ghost" onClick={reset}>
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-small text-text-secondary">
          Copy frames from the Figma plugin and paste here (⌘V), or drag and drop images directly.
        </p>
      </div>
    </div>
  );
}

/**
 * Individual frame preview component
 */
function FramePreview({ frame }: { frame: FigmaFrame }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-card-inner bg-secondary/10">
      {imageError ? (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-6 w-6 text-text-secondary" />
        </div>
      ) : (
        <img
          src={frame.imageData}
          alt={frame.name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-small text-white">{frame.name}</p>
        <p className="text-small text-white/70">
          {frame.width}×{frame.height}
        </p>
      </div>
    </div>
  );
}

