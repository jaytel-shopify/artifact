"use client";

import useSWR from "swr";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { FolderPlus } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import ProjectCard from "@/components/presentation/ProjectCard";
import PageTransition from "@/components/transitions/PageTransition";
import FolderCard from "@/components/folders/FolderCard";
import FolderDialog from "@/components/folders/FolderDialog";
import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import FolderAccessDialog from "@/components/folders/FolderAccessDialog";
import MoveToFolderMenu from "@/components/folders/MoveToFolderMenu";
import type { Project, Artifact, Folder } from "@/types";
import { toast } from "sonner";
import { getProjects, updateProject, deleteProject, getArtifactsByProject } from "@/lib/quick-db";
import { getUserFolders, createFolder, updateFolder as updateFolderDB, deleteFolder, getProjectCountInFolder } from "@/lib/quick-folders";
import { moveProjectToFolder, removeProjectFromFolder } from "@/lib/quick-folders";

/**
 * Fetcher function for SWR - gets all projects and their first 3 artifacts for covers
 */
async function fetcher(userEmail?: string): Promise<{
  projects: Array<Project & { coverArtifacts: Artifact[] }>;
  folders: Array<Folder & { projectCount: number }>;
}> {
  // Parallel loading - fetch projects and folders simultaneously
  const [projects, userFolders] = await Promise.all([
    getProjects(userEmail),
    getUserFolders(userEmail || ""),
  ]);
  
  // Get cover artifacts for projects (in parallel)
  const projectsWithCovers = await Promise.all(
    projects.map(async (project) => {
      const artifacts = await getArtifactsByProject(project.id);
      return {
        ...project,
        coverArtifacts: artifacts.slice(0, 3),
      };
    })
  );

  // Get project counts for folders (in parallel)
  const foldersWithCounts = await Promise.all(
    userFolders.map(async (folder) => {
      const count = await getProjectCountInFolder(folder.id);
      return { ...folder, projectCount: count };
    })
  );
  
  return {
    projects: projectsWithCovers,
    folders: foldersWithCounts,
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Single SWR call loads both projects and folders in parallel
  const { data, isLoading, error, mutate } = useSWR<{
    projects: Array<Project & { coverArtifacts: Artifact[] }>;
    folders: Array<Folder & { projectCount: number }>;
  }>(
    user ? `projects-folders-${user.email}` : null,
    () => (user ? fetcher(user.email) : { projects: [], folders: [] }),
    { 
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      refreshInterval: 60000,
    }
  );

  const projects = data?.projects || [];
  const folders = data?.folders || [];

  // Track folders locally for optimistic updates
  const [localFolders, setLocalFolders] = useState(folders);

  // Sync local folders with data
  useEffect(() => {
    setLocalFolders(folders);
  }, [folders]);

  // Folder dialogs
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<(Folder & { projectCount: number }) | null>(null);
  const [folderToManage, setFolderToManage] = useState<Folder | null>(null);
  
  // Project dialogs
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<(Project & { coverArtifacts: Artifact[] }) | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [projectToRename, setProjectToRename] = useState<(Project & { coverArtifacts: Artifact[] }) | null>(null);
  const [newProjectName, setNewProjectName] = useState("");

  // Filter uncategorized projects (not in any folder)
  const uncategorizedProjects = useMemo(() => {
    return projects.filter((p) => !p.folder_id);
  }, [projects]);

  function handleNewProject() {
    router.push('/projects/new');
  }

  async function handleCreateFolder(name: string) {
    if (!user?.email) return;

    try {
      const newFolder = await createFolder({
        name,
        creator_id: user.email,
      });
      setLocalFolders((prev) => [...prev, { ...newFolder, projectCount: 0 }]);
      toast.success(`Folder "${name}" created`);
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error("Failed to create folder");
      throw error;
    }
  }

  async function handleRenameFolder(name: string) {
    if (!folderToRename) return;

    try {
      await updateFolderDB(folderToRename.id, { name });
      setLocalFolders((prev) =>
        prev.map((f) => (f.id === folderToRename.id ? { ...f, name } : f))
      );
      toast.success("Folder renamed");
      setFolderToRename(null);
    } catch (error) {
      console.error("Failed to rename folder:", error);
      toast.error("Failed to rename folder");
      throw error;
    }
  }

  async function handleDeleteFolder() {
    if (!folderToDelete) return;

    try {
      await deleteFolder(folderToDelete.id);
      setLocalFolders((prev) => prev.filter((f) => f.id !== folderToDelete.id));
      mutate(); // Refresh projects
      toast.success(`Folder "${folderToDelete.name}" deleted`);
      setFolderToDelete(null);
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error("Failed to delete folder");
      throw error;
    }
  }

  async function handleMoveToFolder(project: Project, folderId: string) {
    try {
      await moveProjectToFolder(project.id, folderId);
      
      // Update folder counts
      setLocalFolders((prev) =>
        prev.map((f) => {
          // Increment target folder count
          if (f.id === folderId) {
            return { ...f, projectCount: f.projectCount + 1 };
          }
          // Decrement source folder count if project was in another folder
          if (project.folder_id && f.id === project.folder_id) {
            return { ...f, projectCount: Math.max(0, f.projectCount - 1) };
          }
          return f;
        })
      );
      
      mutate(); // Refresh projects
      const folder = folders.find((f) => f.id === folderId);
      toast.success(`Moved to ${folder?.name || "folder"}`);
    } catch (error) {
      console.error("Failed to move project:", error);
      toast.error("Failed to move project");
    }
  }

  async function handleRemoveFromFolder(project: Project) {
    try {
      await removeProjectFromFolder(project.id);
      
      // Decrement folder count
      if (project.folder_id) {
        setLocalFolders((prev) =>
          prev.map((f) =>
            f.id === project.folder_id
              ? { ...f, projectCount: Math.max(0, f.projectCount - 1) }
              : f
          )
        );
      }
      
      mutate(); // Refresh projects
      toast.success("Removed from folder");
    } catch (error) {
      console.error("Failed to remove from folder:", error);
      toast.error("Failed to remove from folder");
    }
  }

  function handleProjectClick(project: Project & { coverArtifacts: Artifact[] }) {
    router.push(`/p?token=${project.share_token}`);
  }

  function handleProjectHover(project: Project & { coverArtifacts: Artifact[] }) {
    // Prefetch project page on hover for instant navigation
    router.prefetch(`/p?token=${project.share_token}`);
  }

  function handleDeleteProject(project: Project & { coverArtifacts: Artifact[] }) {
    setProjectToDelete(project);
  }

  function handleRenameProject(project: Project & { coverArtifacts: Artifact[] }) {
    setProjectToRename(project);
    setNewProjectName(project.name);
  }

  async function confirmDelete() {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      
      // Update the local data to remove the deleted project
      mutate();
      
      toast.success(`Project "${projectToDelete.name}" deleted successfully`);
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Failed to delete project. Please try again.");
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmRename() {
    if (!projectToRename || !newProjectName.trim()) return;
    
    setIsRenaming(true);
    try {
      await updateProject(projectToRename.id, { name: newProjectName.trim() });
      
      // Update the local data
      mutate();
      
      toast.success(`Project renamed to "${newProjectName.trim()}"`);
      setProjectToRename(null);
      setNewProjectName("");
    } catch (error) {
      toast.error("Failed to rename project. Please try again.");
      console.error('Error renaming project:', error);
    } finally {
      setIsRenaming(false);
    }
  }

  // Don't render until data is loaded
  if (isLoading) {
    return null;
  }

  return (
    <PageTransition isLoading={false}>
      <div className="h-screen flex flex-col bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      {/* Header with + New Folder button */}
      <div className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)]" style={{ height: 'var(--header-height)' }}>
        <div className="flex items-center justify-between h-full px-8">
          <div className="flex items-center gap-2">
            <img 
              src="/favicons/icon-256.png" 
              alt="Artifact"
              className="w-8 h-8"
              style={{ imageRendering: 'crisp-edges' }}
            />
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Artifact</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => setCreateFolderOpen(true)}>
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
            <Button className="gap-2" onClick={handleNewProject}>
              New Project
            </Button>
          </div>
        </div>
      </div>
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {error && <p className="text-red-600">{String(error)}</p>}

          {/* Folders Section */}
          {localFolders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Folders</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {localFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    projectCount={folder.projectCount}
                    onRename={(f) => setFolderToRename(f)}
                    onManageAccess={(f) => setFolderToManage(f)}
                    onDelete={(f) => setFolderToDelete(f)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {uncategorizedProjects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uncategorizedProjects.map((p) => (
                  <ContextMenu key={p.id}>
                    <ContextMenuTrigger asChild>
                      <div>
                        <ProjectCard
                          project={p}
                          onClick={() => handleProjectClick(p)}
                          onHover={() => handleProjectHover(p)}
                          onDelete={() => handleDeleteProject(p)}
                          menuItems={
                            <>
                              <DropdownMenuItem onClick={() => handleRenameProject(p)}>
                                Rename Project
                              </DropdownMenuItem>
                              
                              {/* Move to Folder submenu */}
                              {localFolders.length > 0 && (
                                <>
                                  {localFolders.map((folder) => (
                                    <DropdownMenuItem
                                      key={folder.id}
                                      onClick={() => handleMoveToFolder(p, folder.id)}
                                    >
                                      Move to {folder.name}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                              
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
                      
                      {/* Move to Folder */}
                      <MoveToFolderMenu
                        folders={localFolders}
                        currentFolderId={p.folder_id}
                        onMoveToFolder={(folderId) => handleMoveToFolder(p, folderId)}
                        onRemoveFromFolder={() => handleRemoveFromFolder(p)}
                      />
                      
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
            </div>
          )}

          {/* Empty State */}
          {!isLoading && localFolders.length === 0 && uncategorizedProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No projects or folders yet</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
                  Create Folder
                </Button>
                <Button onClick={handleNewProject}>Create Project</Button>
              </div>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{projectToDelete?.name}&rdquo;? This will permanently delete the project and all its pages and artifacts. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className={buttonVariants({ variant: "destructive" })}
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Rename Dialog */}
          <Dialog open={!!projectToRename} onOpenChange={(open) => !open && setProjectToRename(null)}>
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
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      confirmRename();
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
                  onClick={confirmRename}
                  disabled={isRenaming || !newProjectName.trim()}
                >
                  {isRenaming ? "Renaming..." : "Rename"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Folder Dialogs */}
          <FolderDialog
            isOpen={createFolderOpen}
            onClose={() => setCreateFolderOpen(false)}
            onSubmit={handleCreateFolder}
            mode="create"
          />

          <FolderDialog
            isOpen={!!folderToRename}
            onClose={() => setFolderToRename(null)}
            onSubmit={handleRenameFolder}
            mode="rename"
            initialName={folderToRename?.name || ""}
          />

          <FolderAccessDialog
            isOpen={!!folderToManage}
            onClose={() => setFolderToManage(null)}
            folderId={folderToManage?.id || ""}
            folderName={folderToManage?.name || ""}
            creatorEmail={folderToManage?.creator_id || ""}
          />

          <DeleteFolderDialog
            isOpen={!!folderToDelete}
            onClose={() => setFolderToDelete(null)}
            onConfirm={handleDeleteFolder}
            folderName={folderToDelete?.name || ""}
            projectCount={folderToDelete?.projectCount || 0}
          />
        </div>
      </main>
    </div>
    </PageTransition>
  );
}


