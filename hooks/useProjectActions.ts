import { useState } from "react";
import { toast } from "sonner";
import { updateProject, deleteProject } from "@/lib/quick-db";
import {
  moveProjectToFolder,
  removeProjectFromFolder,
} from "@/lib/quick-folders";
import type { Project } from "@/types";
import type { FolderWithCount } from "./useProjectsData";

export function useProjectActions(
  mutate: () => void,
  folders: FolderWithCount[],
  setLocalFolders: React.Dispatch<React.SetStateAction<FolderWithCount[]>>
) {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

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

  function handleDeleteProject(project: Project) {
    setProjectToDelete(project);
  }

  function handleRenameProject(project: Project) {
    setProjectToRename(project);
    setNewProjectName(project.name);
  }

  async function confirmDelete() {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      mutate();
      toast.success(`Project "${projectToDelete.name}" deleted successfully`);
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Failed to delete project. Please try again.");
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmRename() {
    if (!projectToRename || !newProjectName.trim()) return;

    setIsRenaming(true);
    try {
      await updateProject(projectToRename.id, { name: newProjectName.trim() });
      mutate();
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

  return {
    // State
    projectToDelete,
    projectToRename,
    newProjectName,
    isDeleting,
    isRenaming,
    // Actions
    handleMoveToFolder,
    handleRemoveFromFolder,
    handleDeleteProject,
    handleRenameProject,
    confirmDelete,
    confirmRename,
    // Setters
    setProjectToDelete,
    setProjectToRename,
    setNewProjectName,
  };
}
