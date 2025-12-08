"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProjects, getPages, addArtifactToProject } from "@/lib/quick-db";
import type { Project, Page } from "@/types";
import { toast } from "sonner";
import { useTransitionRouter } from "@/hooks/useTransitionRouter";

interface SaveToProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  artifactId: string;
  artifactName: string;
  userId: string;
}

export function SaveToProjectDialog({
  isOpen,
  onClose,
  artifactId,
  artifactName,
  userId,
}: SaveToProjectDialogProps) {
  const router = useTransitionRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load projects when dialog opens
  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      getProjects(userId)
        .then((p) => {
          setProjects(p);
          // Auto-select first project
          if (p.length > 0 && !selectedProjectId) {
            setSelectedProjectId(p[0].id);
          }
        })
        .catch((err) => {
          console.error("Failed to load projects:", err);
          toast.error("Failed to load projects");
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, userId]);

  // Load pages when project changes
  useEffect(() => {
    if (selectedProjectId) {
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
          toast.error("Failed to load pages");
        });
    } else {
      setPages([]);
      setSelectedPageId("");
    }
  }, [selectedProjectId]);

  const handleSave = async () => {
    if (!selectedProjectId || !selectedPageId) {
      toast.error("Please select a project and page");
      return;
    }

    setIsSaving(true);
    try {
      await addArtifactToProject({
        project_id: selectedProjectId,
        page_id: selectedPageId,
        artifact_id: artifactId,
        name: artifactName,
      });

      toast.success("Artifact saved to project", {
        action: {
          label: "View",
          onClick: () =>
            router.push(`/p/?id=${selectedProjectId}&page=${selectedPageId}`),
        },
      });
      onClose();
    } catch (error) {
      console.error("Failed to save artifact to project:", error);
      toast.error("Failed to save artifact to project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedProjectId("");
    setSelectedPageId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <p className="text-small text-text-secondary">
              Loading projects...
            </p>
          ) : projects.length === 0 ? (
            <p className="text-small text-text-secondary">
              No projects found. Create a project first to save artifacts.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-medium">Project</label>
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

              {pages.length > 0 && (
                <div className="space-y-2">
                  <label className="text-medium">Page</label>
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !selectedProjectId || !selectedPageId}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
