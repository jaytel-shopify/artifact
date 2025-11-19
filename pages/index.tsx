"use client";

import { useUser } from "@/hooks/useUser";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SharePanel } from "@/components/access/SharePanel";
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
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/presentation/ProjectCard";
import FolderCard from "@/components/folders/FolderCard";
import FolderDialog from "@/components/folders/FolderDialog";
import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import { FolderPlus } from "lucide-react";
import {
  getAllFolders,
  createFolder,
  deleteFolder,
  updateFolder,
  getChildren,
} from "@/lib/quick/db-new";
import { useEffect, useState } from "react";
import type { Folder } from "@/types";
import { toast } from "sonner";

type FolderWithProjectCount = Folder & { projectCount: number };

export default function ProjectsPage() {
  const { user } = useUser();
  const [folders, setFolders] = useState<FolderWithProjectCount[]>([]);
  const [projects, setProjects] = useState<Folder[]>([]);
  useEffect(() => {
    const fetchFolders = async () => {
      let data = await getAllFolders();
      data = data.filter((folder) => folder.parent_id === null);
      const folders = await Promise.all(
        data
          .filter((folder) => folder.depth === 0)
          .map(async (folder) => ({
            ...folder,
            projectCount: (await getChildren(folder.id)).length,
          }))
      );
      setFolders(folders);
      const projects = data.filter((folder) => folder.depth === 1);
      setProjects(projects);
    };
    fetchFolders();
  }, []);

  const handleNewFolder = async () => {
    const newFolder = await createFolder({
      title: "New Folder",
    });
    setFolders([{ ...newFolder, projectCount: 0 }, ...folders]);
  };

  const handleNewProject = async () => {
    const newProject = await createFolder({
      title: "New Project",
    });
    const newPage = await createFolder({
      title: "New Page",
      parent_id: newProject.id,
    });
    setProjects([newProject, ...projects]);
  };

  // Folder dialogs
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderToRename, setFolderToRename] =
    useState<FolderWithProjectCount | null>(null);
  const [folderToDelete, setFolderToDelete] =
    useState<FolderWithProjectCount | null>(null);
  const [folderToManage, setFolderToManage] =
    useState<FolderWithProjectCount | null>(null);

  // Project dialogs
  const [projectToDelete, setProjectToDelete] = useState<Folder | null>(null);
  const [projectToRename, setProjectToRename] = useState<Folder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  async function handleRenameFolder(title: string) {
    if (!folderToRename) return;

    try {
      await updateFolder(folderToRename.id, { title });
      setFolders((prev) =>
        prev.map((f) => (f.id === folderToRename.id ? { ...f, title } : f))
      );
      toast.success("Folder renamed");
      setFolderToRename(null);
    } catch (error) {
      toast.error("Failed to rename folder");
    }
  }

  async function handleDeleteFolder() {
    if (!folderToDelete) return;

    try {
      await deleteFolder(folderToDelete.id);
      setFolders((prev) => prev.filter((f) => f.id !== folderToDelete.id));
      toast.success(`Folder "${folderToDelete.title}" deleted`);
      setFolderToDelete(null);
    } catch (error) {
      toast.error("Failed to delete folder");
    }
  }

  // async function handleMoveToFolder(project: Folder, folderId: string) {
  //   try {
  //     await moveProjectToFolder(project.id, folderId);

  //     // Update folder counts
  //     setFolders((prev) =>
  //       prev.map((f) => {
  //         // Increment target folder count
  //         if (f.id === folderId) {
  //           return { ...f, projectCount: f.projectCount + 1 };
  //         }
  //         // Decrement source folder count if project was in another folder
  //         if (project.parent_id && f.id === project.parent_id) {
  //           return { ...f, projectCount: Math.max(0, f.projectCount - 1) };
  //         }
  //         return f;
  //       })
  //     );

  //     // mutate(); // Refresh projects
  //     const folder = folders.find((f) => f.id === folderId);
  //     toast.success(`Moved to ${folder?.title || "folder"}`);
  //   } catch (error) {
  //     console.error("Failed to move project:", error);
  //     toast.error("Failed to move project");
  //   }
  // }

  // function handleDeleteProject(project: Folder) {
  //   setProjectToDelete(project);
  // }

  // function handleRenameProject(project: Folder) {
  //   setProjectToRename(project);
  //   setNewProjectName(project.title);
  // }

  async function confirmDelete() {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await deleteFolder(projectToDelete.id);
      toast.success(`Project "${projectToDelete.title}" deleted successfully`);
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmRename() {
    if (!projectToRename || !newProjectName.trim()) return;

    setIsRenaming(true);
    try {
      await updateFolder(projectToRename.id, { title: newProjectName.trim() });
      toast.success(`Project renamed to "${newProjectName.trim()}"`);
      setProjectToRename(null);
      setNewProjectName("");
    } catch (error) {
      toast.error("Failed to rename project. Please try again.");
    } finally {
      setIsRenaming(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      <div
        className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)]"
        style={{ height: "var(--header-height)" }}
      >
        <div className="flex items-center justify-between h-full px-8">
          <div className="flex items-center gap-2">
            <img
              src="/favicons/icon-256.png"
              alt="Artifact"
              className="w-8 h-8"
              style={{ imageRendering: "crisp-edges" }}
            />
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Artifact
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleNewFolder}
            >
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
          {folders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Folders</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
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
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {projects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={!!projectToDelete}
            onOpenChange={(open) => !open && setProjectToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;
                  {projectToDelete?.title}
                  &rdquo;? This will permanently delete the project and all its
                  pages and artifacts. This action cannot be undone.
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
          <Dialog
            open={!!projectToRename}
            onOpenChange={(open) => !open && setProjectToRename(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Project</DialogTitle>
                <DialogDescription>
                  Enter a new name for &ldquo;{projectToRename?.title}&rdquo;
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newProjectName.trim()) {
                      confirmRename();
                    }
                  }}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setProjectToRename(null)}
                >
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
            onSubmit={handleNewFolder}
            mode="create"
          />

          <FolderDialog
            isOpen={!!folderToRename}
            onClose={() => setFolderToRename(null)}
            onSubmit={handleRenameFolder}
            mode="rename"
            initialName={folderToRename?.title || ""}
          />

          {folderToManage && user && (
            <SharePanel
              isOpen={!!folderToManage}
              onClose={() => setFolderToManage(null)}
              resourceId={folderToManage.id}
              resourceType="folder"
              resourceName={folderToManage.title}
              currentUserEmail={user.email}
            />
          )}

          <DeleteFolderDialog
            isOpen={!!folderToDelete}
            onClose={() => setFolderToDelete(null)}
            onConfirm={handleDeleteFolder}
            folderName={folderToDelete?.title || ""}
            projectCount={folderToDelete?.projectCount || 0}
          />
        </div>
      </main>
    </div>
  );
}
