"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ImagePlus, Plus } from "lucide-react";
import { generateArtifactName } from "@/lib/artifactNames";
import { getArtifactTypeFromMimeType, validateFile } from "@/lib/quick-storage";
import { getProjects, getPages } from "@/lib/quick-db";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import type { ArtifactType, Project, Page } from "@/types";
import type { UploadContext } from "@/hooks/useArtifactUpload";

export interface PendingUpload {
  file: File;
  previewUrl: string;
  type: ArtifactType;
  suggestedName: string;
  name: string;
  description: string;
}

interface UploadPreviewDialogProps {
  files: File[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (uploads: PendingUpload[], context?: UploadContext) => void;
  uploading?: boolean;
  uploadProgress?: {
    currentIndex: number;
    currentProgress: number;
    totalFiles: number;
  };
  /** If true, show project/page selection */
  requireProjectSelection?: boolean;
  /** Pre-selected context (if any) */
  initialContext?: UploadContext;
  /** If true, allow opening dialog with no files and show file picker */
  allowEmptyOpen?: boolean;
  /** Called when files are added via the internal file picker */
  onFilesAdded?: (files: File[]) => void;
}

export default function UploadPreviewDialog({
  files,
  isOpen,
  onClose,
  onConfirm,
  uploading = false,
  uploadProgress,
  requireProjectSelection = false,
  initialContext,
  allowEmptyOpen = false,
  onFilesAdded,
}: UploadPreviewDialogProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  // Project/page selection state
  const [projects, setProjects] = useState<Project[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialContext?.projectId || ""
  );
  const [selectedPageId, setSelectedPageId] = useState<string>(
    initialContext?.pageId || ""
  );
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Initialize pending uploads when files change
  useEffect(() => {
    if (files.length === 0) {
      setPendingUploads([]);
      setCurrentIndex(0);
      return;
    }

    const uploads: PendingUpload[] = files.map((file) => {
      const type = getArtifactTypeFromMimeType(file.type);
      const suggestedName = generateArtifactName(type, "", file);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        type,
        suggestedName,
        name: suggestedName,
        description: "",
      };
    });

    setPendingUploads(uploads);
    setCurrentIndex(0);

    // Cleanup URLs on unmount
    return () => {
      uploads.forEach((u) => URL.revokeObjectURL(u.previewUrl));
    };
  }, [files]);

  // Reset project selection when dialog opens/closes or initial context changes
  useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(initialContext?.projectId || "");
      setSelectedPageId(initialContext?.pageId || "");
    }
  }, [isOpen, initialContext?.projectId, initialContext?.pageId]);

  // Handle adding files (validates and creates pending uploads)
  const handleAddFiles = useCallback(
    (newFiles: File[]) => {
      if (newFiles.length === 0) return;

      // Validate files
      const validFiles: File[] = [];
      for (const file of newFiles) {
        const validation = validateFile(file, { maxSizeMB: 250 });
        if (!validation.valid) {
          toast.error(validation.error || `File "${file.name}" is too large`);
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      // If parent is managing files, delegate to them
      if (onFilesAdded) {
        onFilesAdded(validFiles);
        return;
      }

      // Otherwise add to local pending uploads
      const newUploads: PendingUpload[] = validFiles.map((file) => {
        const type = getArtifactTypeFromMimeType(file.type);
        const suggestedName = generateArtifactName(type, "", file);
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          type,
          suggestedName,
          name: suggestedName,
          description: "",
        };
      });

      setPendingUploads((prev) => [...prev, ...newUploads]);
      // Navigate to first new file if we had no files before
      if (pendingUploads.length === 0) {
        setCurrentIndex(0);
      }
    },
    [onFilesAdded, pendingUploads.length]
  );

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      handleAddFiles(selectedFiles);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleAddFiles]
  );

  // Load projects when dialog opens and project selection is required
  useEffect(() => {
    if (isOpen && requireProjectSelection && user?.id) {
      setIsLoadingProjects(true);
      getProjects(user.id)
        .then((p) => {
          setProjects(p);
          // Check if initialContext has a valid project - if so, don't override
          // We check initialContext directly because state updates from other effects
          // may not have been applied yet in the same render cycle
          const initialProjectValid = initialContext?.projectId && 
            p.some((proj) => proj.id === initialContext.projectId);
          if (!initialProjectValid && p.length > 0) {
            setSelectedProjectId(p[0].id);
          }
        })
        .catch((err) => {
          console.error("Failed to load projects:", err);
        })
        .finally(() => setIsLoadingProjects(false));
    }
  }, [isOpen, requireProjectSelection, user?.id, initialContext?.projectId]);

  // Load pages when project changes
  useEffect(() => {
    if (selectedProjectId && requireProjectSelection) {
      getPages(selectedProjectId)
        .then((p) => {
          setPages(p);
          // Check if initialContext has a valid page for this project - if so, don't override
          // We check initialContext directly because state updates from other effects
          // may not have been applied yet in the same render cycle
          const initialPageValid = initialContext?.pageId && 
            initialContext?.projectId === selectedProjectId &&
            p.some((page) => page.id === initialContext.pageId);
          if (!initialPageValid) {
            if (p.length > 0) {
              setSelectedPageId(p[0].id);
            } else {
              setSelectedPageId("");
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load pages:", err);
        });
    } else {
      setPages([]);
      setSelectedPageId("");
    }
  }, [selectedProjectId, requireProjectSelection, initialContext?.projectId, initialContext?.pageId]);

  const currentUpload = pendingUploads[currentIndex];
  const isMultiple = pendingUploads.length > 1;

  const updateCurrentUpload = (updates: Partial<PendingUpload>) => {
    setPendingUploads((prev) =>
      prev.map((upload, i) =>
        i === currentIndex ? { ...upload, ...updates } : upload
      )
    );
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(pendingUploads.length - 1, prev + 1));
  };

  const handleConfirm = () => {
    // Build context from selection if project selection is required
    const context: UploadContext | undefined =
      requireProjectSelection && selectedProjectId && selectedPageId
        ? { projectId: selectedProjectId, pageId: selectedPageId }
        : initialContext;

    onConfirm(pendingUploads, context);
  };

  const handleClose = () => {
    // Cleanup preview URLs
    pendingUploads.forEach((u) => URL.revokeObjectURL(u.previewUrl));
    setIsDragging(false);
    dragDepth.current = 0;
    onClose();
  };

  // Drag and drop handlers for the empty state dropzone
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    if (e.dataTransfer?.types?.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragDepth.current = 0;

      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      handleAddFiles(droppedFiles);
    },
    [handleAddFiles]
  );

  // Calculate overall progress when uploading
  const overallProgress = useMemo(() => {
    if (!uploadProgress || uploadProgress.totalFiles === 0) return 0;
    const completedFiles = uploadProgress.currentIndex - 1;
    const currentFileProgress = uploadProgress.currentProgress / 100;
    return (
      ((completedFiles + currentFileProgress) / uploadProgress.totalFiles) * 100
    );
  }, [uploadProgress]);

  // Determine if confirm button should be disabled
  const isConfirmDisabled = useMemo(() => {
    if (uploading) return true;
    if (!currentUpload?.name.trim()) return true;
    if (requireProjectSelection && (!selectedProjectId || !selectedPageId))
      return true;
    return false;
  }, [
    uploading,
    currentUpload?.name,
    requireProjectSelection,
    selectedProjectId,
    selectedPageId,
  ]);

  // If no files and not allowed to open empty, return null
  if (!currentUpload && !allowEmptyOpen) return null;

  const hasFiles = pendingUploads.length > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !uploading && handleClose()}
    >
      <DialogContent
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        showCloseButton={!uploading}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <DialogHeader>
          <DialogTitle className="text-text-primary">
            {uploading
              ? "Uploading..."
              : !hasFiles
                ? "Add Media"
                : isMultiple
                  ? `Upload ${pendingUploads.length} Files`
                  : "Upload File"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-4">
          {/* Empty state with dropzone */}
          {!hasFiles && !uploading ? (
            <div
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors py-12 ${
                isDragging
                  ? "border-text-primary bg-text-primary/5"
                  : "border-border hover:border-text-secondary"
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-text-primary/10 flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-text-secondary" />
                </div>
                <div className="space-y-1">
                  <p className="text-body text-text-primary">
                    Drop images or videos here
                  </p>
                  <p className="text-small text-text-secondary">
                    or click to browse
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={openFilePicker}
                  className="mt-2"
                >
                  Choose Files
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Media Preview */}
              <div
                className={`relative flex items-center justify-center rounded-xl transition-colors ${
                  isDragging && !uploading
                    ? "bg-text-primary/5 ring-2 ring-text-primary ring-dashed"
                    : ""
                }`}
                onDragEnter={!uploading ? handleDragEnter : undefined}
                onDragOver={!uploading ? handleDragOver : undefined}
                onDragLeave={!uploading ? handleDragLeave : undefined}
                onDrop={!uploading ? handleDrop : undefined}
              >
                <div className="size-40 flex items-center justify-center">
                  {currentUpload?.type === "video" ? (
                    <video
                      src={currentUpload.previewUrl}
                      className="object-contain rounded-button-inner shadow-lg rotate-3 max-w-40 max-h-40 mx-auto"
                      controls
                      muted
                      playsInline
                    />
                  ) : currentUpload ? (
                    <img
                      src={currentUpload.previewUrl}
                      alt={currentUpload.name}
                      className="object-contain rounded-button-inner shadow-lg rotate-3 max-w-40 max-h-40 mx-auto"
                    />
                  ) : null}
                </div>

                {/* Navigation arrows for multiple files */}
                {isMultiple && !uploading && (
                  <>
                    <button
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentIndex === pendingUploads.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* File counter */}
                {isMultiple && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 text-small">
                    {currentIndex + 1} / {pendingUploads.length}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Project/Page Selection - only show when there are files */}
          {hasFiles && requireProjectSelection && !uploading && (
            <div>
              {isLoadingProjects ? (
                <p className="text-small text-text-secondary">
                  Loading projects...
                </p>
              ) : projects.length === 0 ? (
                <p className="text-small text-text-secondary">
                  No projects found. Create a project first to upload.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4">
                  <div className="gap-2 flex flex-col">
                    <label className="sr-only text-small text-text-secondary">
                      Project
                    </label>
                    <Select
                      value={selectedProjectId}
                      onValueChange={setSelectedProjectId}
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

                  <div className="gap-2 flex flex-col">
                    <label className="sr-only text-small text-text-secondary">
                      Page
                    </label>
                    <Select
                      value={selectedPageId}
                      onValueChange={setSelectedPageId}
                      disabled={!selectedProjectId || pages.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            pages.length === 0 ? "No pages" : "Select a page"
                          }
                        />
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
                </div>
              )}
            </div>
          )}

          {/* Name input - only show when there are files */}
          {hasFiles && currentUpload && (
            <div className="gap-2 flex flex-col">
              <label className="sr-only text-small text-text-secondary">Name</label>
              <Input
                value={currentUpload.name}
                onChange={(e) => updateCurrentUpload({ name: e.target.value })}
                placeholder="Enter a name for this artifact"
                disabled={uploading}
              />
            </div>
          )}

          {/* Description input - only show when there are files */}
          {hasFiles && currentUpload && (
            <div className="gap-2 flex flex-col">
              <label className="sr-only text-small text-text-secondary">
                Description (optional)
              </label>
              <textarea
                value={currentUpload.description}
                onChange={(e) =>
                  updateCurrentUpload({ description: e.target.value })
                }
                placeholder="Add a description..."
                disabled={uploading}
                rows={3}
                className="w-full min-w-0 rounded-button border border-border bg-background p-3 text-text-primary placeholder:text-text-secondary transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-small resize-none"
              />
            </div>
          )}

          {/* Upload progress */}
          {uploading && uploadProgress && (
            <div className="gap-2 flex flex-col">
              <div className="flex justify-between text-small">
                <span className="text-text-secondary">
                  Uploading {uploadProgress.currentIndex} of{" "}
                  {uploadProgress.totalFiles}
                </span>
                <span className="text-text-primary/90">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-text-primary/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-text-primary transition-all duration-300 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Thumbnail navigation for multiple files - with add more button */}
          {hasFiles && pendingUploads.length <= 10 && !uploading && (
            <div className="flex gap-2 overflow-x-auto py-2 -mx-6 px-8 scrollbar-hide">
              {pendingUploads.map((upload, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                    index === currentIndex
                      ? "border-text-primary"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {upload.type === "video" ? (
                    <video
                      src={upload.previewUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={upload.previewUrl}
                      alt={upload.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
              {/* Add more files button */}
              <button
                onClick={openFilePicker}
                className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-text-secondary transition flex items-center justify-center text-text-secondary hover:text-text-primary"
                title="Add more files"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          {hasFiles ? (
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className="w-full"
            >
              {uploading
                ? "Adding..."
                : isMultiple
                  ? `Add ${pendingUploads.length} Artifacts`
                  : "Add Artifact"}
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleClose} className="w-full">
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
