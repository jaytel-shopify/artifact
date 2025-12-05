"use client";

import { useState, useCallback } from "react";
import Link from "@/components/ui/TransitionLink";
import useSWR, { mutate as globalMutate, preload } from "swr";
import { toast } from "sonner";
import { MoreVertical, Folder as FolderIcon, X, Pencil, Trash2 } from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputDialog } from "@/components/ui/input-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import ArtifactThumbnail from "./ArtifactThumbnail";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateProject, deleteProject, getProjectById } from "@/lib/quick-db";
import {
  moveProjectToFolder,
  removeProjectFromFolder,
} from "@/lib/quick-folders";
import { cacheKeys } from "@/lib/cache-keys";
import type { Artifact } from "@/types";
import type { ProjectsData } from "@/hooks/useProjectsData";

interface ProjectCoverData {
  id: string;
  name: string;
  folder_id?: string | null;
  created_at: string;
  updated_at: string;
  coverArtifacts: Artifact[];
  artifactCount: number;
}

interface ProjectCardProps {
  project: ProjectCoverData;
}

function ProjectCover({ artifacts }: { artifacts: Artifact[] }) {
  const count = artifacts.length;

  if (count === 0) {
    return (
      <div className="flex w-full flex-col gap-2 flex-1 items-center justify-center -mt-6">
        <span className="text-text-secondary text-medium">Add Artifacts</span>
      </div>
    );
  }

  const hasHoverEffect = count > 2;

  return (
    <div
      className={`flex flex-1 w-[140%] p-2 pt-0 h-full overflow-hidden ${hasHoverEffect ? "ease-spring-light transition-transform duration-500 group-hover:-translate-x-[28.57%]" : ""}`}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-1 p-1">
          {artifacts[i] && (
            <ArtifactThumbnail
              artifact={artifacts[i]}
              className="rounded-card-inner max-h-full overflow-hidden"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * ProjectCard
 *
 * Self-contained project card with all actions and dialogs built-in.
 * Uses globalMutate to refresh page data after mutations.
 * Reads folders from SWR cache for "Move to Folder" functionality.
 */
export default function ProjectCard({ project }: ProjectCardProps) {
  const { user } = useAuth();

  // Dialog states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  // Get folders from SWR cache for "Move to Folder" menu
  const { data } = useSWR<ProjectsData>(cacheKeys.projectsData(user?.id));
  const folders = data?.folders || [];
  const availableFolders = folders.filter((f) => f.id !== project.folder_id);

  // Preload project data on hover for faster navigation
  const handleMouseEnter = useCallback(() => {
    const cacheKey = cacheKeys.projectData(project.id);
    if (cacheKey) {
      preload(cacheKey, () => getProjectById(project.id));
    }
  }, [project.id]);

  // Helper to refresh all relevant caches after a mutation
  // Using { revalidate: true } to force a fresh fetch, bypassing any deduping
  const refreshCaches = async (folderIds: (string | null | undefined)[]) => {
    const projectsKey = cacheKeys.projectsData(user?.id);
    if (projectsKey) {
      await globalMutate(projectsKey, undefined, { revalidate: true });
    }
    // Refresh any folder caches
    for (const folderId of folderIds) {
      if (folderId) {
        const folderKey = cacheKeys.folderData(folderId);
        if (folderKey) {
          await globalMutate(folderKey, undefined, { revalidate: true });
        }
      }
    }
  };

  const handleDelete = async () => {
    const currentFolderId = project.folder_id;
    try {
      await deleteProject(project.id);
      await refreshCaches([currentFolderId]);
      toast.success(`Project "${project.name}" deleted`);
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
      throw error;
    }
  };

  const handleRename = async (newName: string) => {
    const currentFolderId = project.folder_id;
    try {
      await updateProject(project.id, { name: newName });
      await refreshCaches([currentFolderId]);
      toast.success(`Project renamed to "${newName}"`);
    } catch (error) {
      console.error("Failed to rename project:", error);
      toast.error("Failed to rename project");
      throw error;
    }
  };

  const handleMoveToFolder = async (folderId: string) => {
    // Capture all state before async operations (dropdown closes immediately)
    const folder = folders.find((f) => f.id === folderId);
    const folderName = folder?.name || "folder";
    const oldFolderId = project.folder_id;

    try {
      await moveProjectToFolder(project.id, folderId);
      await refreshCaches([folderId, oldFolderId]);
      toast.success(`Moved to ${folderName}`);
    } catch (error) {
      console.error("Failed to move project:", error);
      toast.error("Failed to move project");
    }
  };

  const handleRemoveFromFolder = async () => {
    // Capture current folder before async operations
    const oldFolderId = project.folder_id;
    try {
      await removeProjectFromFolder(project.id);
      await refreshCaches([oldFolderId]);
      toast.success("Removed from folder");
    } catch (error) {
      console.error("Failed to remove from folder:", error);
      toast.error("Failed to remove from folder");
    }
  };

  const openRename = () => setRenameOpen(true);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card
            className="group relative gap-0 overflow-hidden aspect-[300/250]"
            onMouseEnter={handleMouseEnter}
          >
            {/* Three dots menu button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-background text-text-primary absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem onClick={openRename} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Rename Project
                </DropdownMenuItem>

                {/* Move to Folder submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4" />
                    Move to Folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {availableFolders.length > 0 ? (
                      availableFolders.map((folder) => (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={() => handleMoveToFolder(folder.id)}
                        >
                          {folder.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        {project.folder_id
                          ? "No other folders"
                          : "No folders yet"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Remove from Folder option */}
                {project.folder_id && (
                  <DropdownMenuItem
                    onClick={handleRemoveFromFolder}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove from Folder
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Project Info */}
            <CardFooter className="mt-auto space-y-2 p-4">
              <Link
                href={`/p/?id=${project.id}`}
                className="space-y-1 after:content-[''] after:absolute after:inset-0 z-1"
                aria-label={
                  project.name +
                  " - " +
                  project.artifactCount +
                  " " +
                  (project.artifactCount === 1 ? "artifact" : "artifacts")
                }
              >
                <h3 className="text-text-primary line-clamp-1 text-medium">
                  {project.name}
                </h3>
                <p className="text-text-secondary text-small">
                  {project.artifactCount}{" "}
                  {project.artifactCount === 1 ? "artifact" : "artifacts"}
                </p>
              </Link>
            </CardFooter>

            {/* Dynamic Cover */}
            <ProjectCover artifacts={project.coverArtifacts} />
          </Card>
        </ContextMenuTrigger>

        {/* Context Menu (right-click) */}
        <ContextMenuContent>
          <ContextMenuItem onClick={openRename} className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Rename Project
          </ContextMenuItem>

          {/* Move to Folder submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <FolderIcon className="h-4 w-4" />
              Move to Folder
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {availableFolders.length > 0 ? (
                availableFolders.map((folder) => (
                  <ContextMenuItem
                    key={folder.id}
                    onClick={() => handleMoveToFolder(folder.id)}
                  >
                    {folder.name}
                  </ContextMenuItem>
                ))
              ) : (
                <ContextMenuItem disabled>
                  {project.folder_id ? "No other folders" : "No folders yet"}
                </ContextMenuItem>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Remove from Folder option */}
          {project.folder_id && (
            <ContextMenuItem
              onClick={handleRemoveFromFolder}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Remove from Folder
            </ContextMenuItem>
          )}

          <ContextMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Project
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DeleteConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project and all of its Artifacts"
        description={`Are you sure you want to delete "${project.name}"? This will permanently delete the project and all its pages and artifacts. This action cannot be undone.`}
      />

      <InputDialog
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        onSubmit={handleRename}
        title="Rename Project"
        description={`Enter a new name for "${project.name}"`}
        placeholder="Project name"
        initialValue={project.name}
        submitLabel="Rename"
        submittingLabel="Renaming..."
      />
    </>
  );
}
