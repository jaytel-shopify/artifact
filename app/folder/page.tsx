"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share, Plus, MoreVertical } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectCard from "@/components/presentation/ProjectCard";
import FolderDialog from "@/components/folders/FolderDialog";
import { SharePanel } from "@/components/access/SharePanel";
import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import EditableTitle from "@/components/presentation/EditableTitle";
import { useSetHeader } from "@/components/layout/HeaderContext";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import { toast } from "sonner";
import type { Project, Artifact, Folder } from "@/types";
import {
  getFolderById,
  getProjectsInFolder,
  updateFolder,
  deleteFolder,
} from "@/lib/quick-folders";
import { canUserEdit } from "@/lib/access-control";
import {
  updateProject,
  deleteProject as deleteProjectDB,
  getProjectCoverArtifacts,
} from "@/lib/quick-db";

function FolderPageContent() {
  const searchParams = useSearchParams();
  const folderId = searchParams?.get("id") || "";
  const router = useRouter();
  const { user } = useAuth();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [projects, setProjects] = useState<
    Array<Project & { coverArtifacts: Artifact[] }>
  >([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Project actions
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<
    (Project & { coverArtifacts: Artifact[] }) | null
  >(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [projectToRename, setProjectToRename] = useState<
    (Project & { coverArtifacts: Artifact[] }) | null
  >(null);
  const [newProjectName, setNewProjectName] = useState("");

  // Load folder and projects
  useEffect(() => {
    async function loadData() {
      if (!user?.email || !folderId) return;

      try {
        // Parallel loading - fetch folder, permissions, and projects simultaneously
        const [folderData, hasEditAccess, folderProjects] = await Promise.all([
          getFolderById(folderId),
          canUserEdit(folderId, "folder", user.email),
          getProjectsInFolder(folderId, user.email),
        ]);

        if (!folderData) {
          toast.error("Folder not found");
          router.push("/projects");
          return;
        }

        setFolder(folderData);
        setCanEdit(hasEditAccess);

        // Set document title
        document.title = `${folderData.name} | Artifact`;

        // Track folder access (async, don't wait)
        if (hasEditAccess) {
          updateFolder(folderId, {
            last_accessed_at: new Date().toISOString(),
          }).catch(console.error);
        }

        // Load cover artifacts for projects from their first page (in parallel)
        const projectsWithCovers = await Promise.all(
          folderProjects.map(async (project) => {
            const coverArtifacts = await getProjectCoverArtifacts(project.id);
            return {
              ...project,
              coverArtifacts,
            };
          })
        );
        setProjects(projectsWithCovers);
      } catch (error) {
        console.error("Failed to load folder:", error);
        toast.error("Failed to load folder");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [folderId, user, router]);

  async function handleRenameFolder(name: string) {
    if (!folder) return;

    try {
      await updateFolder(folder.id, { name });
      setFolder({ ...folder, name });
      toast.success("Folder renamed");
    } catch (error) {
      console.error("Failed to rename folder:", error);
      toast.error("Failed to rename folder");
      throw error;
    }
  }

  async function handleDeleteFolder() {
    if (!folder) return;

    try {
      await deleteFolder(folder.id);
      toast.success(`Folder "${folder.name}" and all its projects deleted`);
      router.push("/projects");
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error("Failed to delete folder");
      throw error;
    }
  }

  async function handleNewProject() {
    router.push(`/projects/new?folder=${folderId}`);
  }

  const backUrl = "/projects/";

  function handleDeleteProject(
    project: Project & { coverArtifacts: Artifact[] }
  ) {
    setProjectToDelete(project);
  }

  function handleRenameProject(
    project: Project & { coverArtifacts: Artifact[] }
  ) {
    setProjectToRename(project);
    setNewProjectName(project.name);
  }

  async function confirmDeleteProject() {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProjectDB(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      toast.success(`Project "${projectToDelete.name}" deleted successfully`);
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Failed to delete project. Please try again.");
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmRenameProject() {
    if (!projectToRename || !newProjectName.trim()) return;

    setIsRenaming(true);
    try {
      await updateProject(projectToRename.id, { name: newProjectName.trim() });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectToRename.id
            ? { ...p, name: newProjectName.trim() }
            : p
        )
      );
      toast.success(`Project renamed to "${newProjectName.trim()}"`);
      setProjectToRename(null);
      setNewProjectName("");
    } catch (error) {
      toast.error("Failed to rename project. Please try again.");
      console.error("Error renaming project:", error);
    } finally {
      setIsRenaming(false);
    }
  }

  async function handleFolderRename(name: string) {
    // Just update local state - EditableTitle already saved to database
    if (!folder) return;
    setFolder({ ...folder, name });
  }

  // Set header content - must be called before any return statements
  useSetHeader({
    left: (
      <>
        <Link href={backUrl}>
          <Button variant="default" size="icon" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </>
    ),
    center: (
      <EditableTitle
        initialValue={folder?.name || "Untitled Folder"}
        projectId={folder?.id || ""}
        onUpdated={canEdit ? handleFolderRename : undefined}
        isReadOnly={!canEdit}
        isFolder={true}
      />
    ),
    right: (
      <>
        {/* Share Button */}
        <Button
          variant="default"
          onClick={() => setAccessDialogOpen(true)}
        >
          <Share className="h-4 w-4" />
          Share
        </Button>

        {/* New Project Button */}
        {canEdit && (
          <Button variant="default" onClick={handleNewProject}>
            New Project
          </Button>
        )}

        {/* Folder Actions Menu */}
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                Rename Folder
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DarkModeToggle />
      </>
    ),
  });

  // Don't render if still loading or folder not found
  if (loading || !folder) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">
            No projects in this folder yet
          </p>
          {canEdit && (
            <Button onClick={handleNewProject}>Create Project in Folder</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ContextMenu key={p.id}>
              <ContextMenuTrigger asChild>
                <div>
                  <ProjectCard
                    project={p}
                    onDelete={() => handleDeleteProject(p)}
                    menuItems={
                      <>
                        <DropdownMenuItem
                          onClick={() => handleRenameProject(p)}
                        >
                          Rename Project
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              const { removeProjectFromFolder } = await import(
                                "@/lib/quick-folders"
                              );
                              await removeProjectFromFolder(p.id);
                              setProjects((prev) =>
                                prev.filter((proj) => proj.id !== p.id)
                              );
                              toast.success("Project moved to main Projects");
                            } catch (error) {
                              toast.error("Failed to move project");
                            }
                          }}
                        >
                          Remove from Folder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDeleteProject(p)}
                        >
                          Delete Project
                        </DropdownMenuItem>
                      </>
                    }
                  />
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleRenameProject(p)}>
                  Rename Project
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={async () => {
                    try {
                      const { removeProjectFromFolder } = await import(
                        "@/lib/quick-folders"
                      );
                      await removeProjectFromFolder(p.id);
                      setProjects((prev) =>
                        prev.filter((proj) => proj.id !== p.id)
                      );
                      toast.success("Project moved to main Projects");
                    } catch (error) {
                      toast.error("Failed to move project");
                    }
                  }}
                >
                  Remove from Folder
                </ContextMenuItem>
                <ContextMenuItem
                  variant="destructive"
                  onClick={() => handleDeleteProject(p)}
                >
                  Delete Project
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <FolderDialog
        isOpen={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        onSubmit={handleRenameFolder}
        mode="rename"
        initialName={folder.name}
      />

      {/* Folder Access Dialog */}
      {user && (
        <SharePanel
          isOpen={accessDialogOpen}
          onClose={() => setAccessDialogOpen(false)}
          resourceId={folder.id}
          resourceType="folder"
          resourceName={folder.name}
          currentUserEmail={user.email}
        />
      )}

      <DeleteFolderDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteFolder}
        folderName={folder.name}
        projectCount={projects.length}
      />

      {/* Project Delete Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{projectToDelete?.name}
              &rdquo;? This will permanently delete the project and all its
              pages and artifacts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={confirmDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Rename Dialog */}
      <Dialog
        open={!!projectToRename}
        onOpenChange={(open) => !open && setProjectToRename(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for &ldquo;{projectToRename?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newProjectName.trim()) {
                  confirmRenameProject();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToRename(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRenameProject}
              disabled={isRenaming || !newProjectName.trim()}
            >
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FolderPage() {
  return (
    <Suspense fallback={null}>
      <FolderPageContent />
    </Suspense>
  );
}
