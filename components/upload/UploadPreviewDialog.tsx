"use client";

import { useState, useEffect, useMemo } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { generateArtifactName } from "@/lib/artifactNames";
import { getArtifactTypeFromMimeType } from "@/lib/quick-storage";
import { getProjects, getPages } from "@/lib/quick-db";
import { useAuth } from "@/components/auth/AuthProvider";
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
}: UploadPreviewDialogProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);

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

  // Load projects when dialog opens and project selection is required
  useEffect(() => {
    if (isOpen && requireProjectSelection && user?.id) {
      setIsLoadingProjects(true);
      getProjects(user.id)
        .then((p) => {
          setProjects(p);
          // Auto-select first project if none selected
          if (p.length > 0 && !selectedProjectId) {
            setSelectedProjectId(p[0].id);
          }
        })
        .catch((err) => {
          console.error("Failed to load projects:", err);
        })
        .finally(() => setIsLoadingProjects(false));
    }
  }, [isOpen, requireProjectSelection, user?.id]);

  // Load pages when project changes
  useEffect(() => {
    if (selectedProjectId && requireProjectSelection) {
      getPages(selectedProjectId)
        .then((p) => {
          setPages(p);
          // Auto-select first page
          if (p.length > 0) {
            setSelectedPageId(p[0].id);
          } else {
            setSelectedPageId("");
          }
        })
        .catch((err) => {
          console.error("Failed to load pages:", err);
        });
    } else {
      setPages([]);
      setSelectedPageId("");
    }
  }, [selectedProjectId, requireProjectSelection]);

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
    onClose();
  };

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

  if (!currentUpload) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !uploading && handleClose()}
    >
      <DialogContent
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        showCloseButton={!uploading}
      >
        <DialogHeader>
          <DialogTitle className="text-text-primary">
            {uploading
              ? "Uploading..."
              : isMultiple
                ? `Upload ${pendingUploads.length} Files`
                : "Upload File"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto">
          {/* Media Preview */}
          <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
            {currentUpload.type === "video" ? (
              <video
                src={currentUpload.previewUrl}
                className="max-w-full max-h-full object-contain"
                controls
                muted
                playsInline
              />
            ) : (
              <img
                src={currentUpload.previewUrl}
                alt={currentUpload.name}
                className="max-w-full max-h-full object-contain"
              />
            )}

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

          {/* File info */}
          <div className="text-small text-text-secondary">
            {currentUpload.file.name} (
            {(currentUpload.file.size / 1024 / 1024).toFixed(2)} MB)
          </div>

          {/* Project/Page Selection */}
          {requireProjectSelection && !uploading && (
            <div className="space-y-4 p-4 bg-secondary rounded-lg">
              <div className="text-small font-medium text-text-primary">
                Upload to Project
              </div>

              {isLoadingProjects ? (
                <p className="text-small text-text-secondary">
                  Loading projects...
                </p>
              ) : projects.length === 0 ? (
                <p className="text-small text-text-secondary">
                  No projects found. Create a project first to upload.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-small text-text-primary/70">
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

                  <div className="space-y-2">
                    <label className="text-small text-text-primary/70">
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

          {/* Name input */}
          <div className="space-y-2">
            <label className="text-small text-text-primary/70">Name</label>
            <Input
              value={currentUpload.name}
              onChange={(e) => updateCurrentUpload({ name: e.target.value })}
              placeholder="Enter a name for this artifact"
              disabled={uploading}
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <label className="text-small text-text-primary/70">
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
              className="w-full min-w-0 rounded-button border border-border bg-primary px-3 py-2 text-text-primary placeholder:text-text-secondary transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-small resize-none"
            />
          </div>

          {/* Upload progress */}
          {uploading && uploadProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-small">
                <span className="text-text-primary/70">
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

          {/* Thumbnail navigation for multiple files */}
          {isMultiple && pendingUploads.length <= 10 && !uploading && (
            <div className="flex gap-2 overflow-x-auto py-2">
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
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {uploading
              ? "Uploading..."
              : isMultiple
                ? `Upload ${pendingUploads.length} Files`
                : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
