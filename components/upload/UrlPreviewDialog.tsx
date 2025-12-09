"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UrlAutocomplete } from "./UrlAutocomplete";
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
  /** Initial URL to prefill (can be empty to let user enter it) */
  url?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    url: string,
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
  /** Whether to show the Quick Sites dropdown button */
  showQuickSites?: boolean;
}

export default function UrlPreviewDialog({
  url = "",
  isOpen,
  onClose,
  onConfirm,
  uploading = false,
  requireProjectSelection = false,
  initialContext,
  showQuickSites = false,
}: UrlPreviewDialogProps) {
  const { user } = useAuth();
  const [urlValue, setUrlValue] = useState(url);
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

  // Normalize URL by adding https:// if missing
  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  // Get suggested name from URL hostname
  const suggestedName = useMemo(() => {
    try {
      return new URL(normalizeUrl(urlValue)).hostname;
    } catch {
      return "Name";
    }
  }, [urlValue]);

  // Reset form when dialog opens
  useEffect(() => {
    console.log("isOpen", isOpen);
    if (isOpen) {
      setUrlValue(url);
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

    // Pass normalized URL (with https:// prefix if missing)
    onConfirm(
      normalizeUrl(urlValue),
      name || suggestedName,
      description,
      viewport,
      context
    );
  };

  // Validate URL - accepts patterns like shopify.com, www.shopify.com, etc.
  const isValidUrl = useMemo(() => {
    const trimmed = urlValue.trim();
    if (!trimmed) return false;
    try {
      new URL(normalizeUrl(trimmed));
      return true;
    } catch {
      return false;
    }
  }, [urlValue]);

  // Determine if confirm button should be disabled
  const isConfirmDisabled = useMemo(() => {
    if (uploading) return true;
    if (!urlValue.trim() || !isValidUrl) return true;
    if (requireProjectSelection && (!selectedProjectId || !selectedPageId))
      return true;
    return false;
  }, [
    uploading,
    urlValue,
    isValidUrl,
    requireProjectSelection,
    selectedProjectId,
    selectedPageId,
  ]);

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
          {/* URL Input with Autocomplete */}
          <div className="gap-2 flex flex-col">
            <label className="text-small text-text-secondary">URL</label>
            <UrlAutocomplete
              value={urlValue}
              onChange={setUrlValue}
              placeholder="https://example.com"
              disabled={uploading}
              autoFocus={!url}
              showQuickSites={showQuickSites}
            />
          </div>

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
                  <div className="gap-2 flex flex-col">
                    <label className="text-small text-text-secondary">
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
                    <label className="text-small text-text-secondary">
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

          <div className="gap-2 flex flex-col">
            <label className="text-small text-text-secondary">Viewport</label>
            <Select
              value={viewport}
              onValueChange={(value) => setViewport(value as ViewportKey)}
              disabled={uploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select viewport" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VIEWPORTS).map(([key, vp]) => (
                  <SelectItem key={key} value={key}>
                    {vp.label} ({vp.width}x{vp.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name input */}
          <div className="gap-2 flex flex-col">
            <label className="text-small text-text-secondary">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={suggestedName}
              disabled={uploading}
              autoFocus={!!url}
            />
          </div>

          {/* Description input */}
          <div className="gap-2 flex flex-col">
            <label className="text-small text-text-secondary">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              disabled={uploading}
              rows={3}
              className="w-full min-w-0 rounded-button border border-border bg-background p-3 text-text-primary placeholder:text-text-secondary transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-small resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="w-full"
          >
            {uploading ? "Adding..." : "Add Artifact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
