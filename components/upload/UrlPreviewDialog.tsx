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
import {
  VIEWPORTS,
  DEFAULT_VIEWPORT_KEY,
  type ViewportKey,
} from "@/lib/viewports";
import { getProjects, getPages } from "@/lib/quick-db";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Project, Page } from "@/types";
import type { UploadContext } from "@/hooks/useArtifactUpload";

interface UrlPreviewDialogProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    name: string,
    description: string,
    viewport: ViewportKey,
    context?: UploadContext
  ) => void;
  uploading?: boolean;
  /** If true, show project/page selection */
  requireProjectSelection?: boolean;
  /** Pre-selected context (if any) */
  initialContext?: UploadContext;
}

export default function UrlPreviewDialog({
  url,
  isOpen,
  onClose,
  onConfirm,
  uploading = false,
  requireProjectSelection = false,
  initialContext,
}: UrlPreviewDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [viewport, setViewport] = useState<ViewportKey>(DEFAULT_VIEWPORT_KEY);

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

  // Get suggested name from URL hostname
  const suggestedName = useMemo(() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "URL";
    }
  }, [url]);

  // Reset form when dialog opens with a new URL
  useEffect(() => {
    if (isOpen && url) {
      setName("");
      setDescription("");
      setViewport(DEFAULT_VIEWPORT_KEY);
      setSelectedProjectId(initialContext?.projectId || "");
      setSelectedPageId(initialContext?.pageId || "");
    }
  }, [isOpen, url, initialContext?.projectId, initialContext?.pageId]);

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

  const handleConfirm = () => {
    // Build context from selection if project selection is required
    const context: UploadContext | undefined =
      requireProjectSelection && selectedProjectId && selectedPageId
        ? { projectId: selectedProjectId, pageId: selectedPageId }
        : initialContext;

    onConfirm(name || suggestedName, description, viewport, context);
  };

  // Determine if confirm button should be disabled
  const isConfirmDisabled = useMemo(() => {
    if (uploading) return true;
    if (requireProjectSelection && (!selectedProjectId || !selectedPageId))
      return true;
    return false;
  }, [uploading, requireProjectSelection, selectedProjectId, selectedPageId]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !uploading && onClose()}
    >
      <DialogContent
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        showCloseButton={!uploading}
      >
        <DialogHeader>
          <DialogTitle className="text-text-primary">
            {uploading ? "Adding..." : "Add URL"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-4">
          {/* URL Preview */}
          <div className="text-small text-text-secondary break-all">{url}</div>

          {/* Project/Page Selection */}
          {requireProjectSelection && !uploading && (
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={suggestedName}
              disabled={uploading}
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <label className="text-small text-text-primary/70">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              disabled={uploading}
              rows={3}
              className="w-full min-w-0 rounded-button border border-border bg-primary px-3 py-2 text-text-primary placeholder:text-text-secondary transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-small resize-none"
            />
          </div>

          {/* Viewport Selection */}
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
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {uploading ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
