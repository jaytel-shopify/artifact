import { useCallback } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { cacheKeys } from "@/lib/cache-keys";
import type { Project } from "@/types";
import type { ProjectsData } from "./useProjectsData";

interface Folder {
  id: string;
  name: string;
}

/**
 * Hook to handle moving projects in/out of folders
 */
export function useFolderActions(
  project: Project | null | undefined,
  userFolders: Folder[],
  userId?: string
) {
  const handleProjectNameUpdate = useCallback(
    (name: string) => {
      if (!project) return;
      project.name = name;
    },
    [project]
  );

  const handleMoveToFolder = useCallback(
    async (folderId: string) => {
      if (!project) return;

      const oldFolderId = project.folder_id;
      const folder = userFolders.find((f) => f.id === folderId);

      // Optimistically update the cache
      const projectsKey = cacheKeys.projectsData(userId);
      await globalMutate(
        projectsKey,
        (currentData: ProjectsData | undefined) => {
          if (!currentData) return currentData;

          // Update the project's folder_id in the cached data
          const updatedProjects = currentData.projects.map((p) =>
            p.id === project.id ? { ...p, folder_id: folderId } : p
          );

          // Update folder counts
          const updatedFolders = currentData.folders.map((f) => {
            if (f.id === folderId) {
              return { ...f, projectCount: f.projectCount + 1 };
            }
            if (f.id === oldFolderId) {
              return { ...f, projectCount: Math.max(0, f.projectCount - 1) };
            }
            return f;
          });

          return {
            projects: updatedProjects,
            folders: updatedFolders,
          };
        },
        { revalidate: false }
      );

      try {
        const { moveProjectToFolder } = await import("@/lib/quick-folders");
        await moveProjectToFolder(project.id, folderId);
        toast.success(`Moved to ${folder?.name || "folder"}`);

        // Revalidate in background to ensure consistency
        globalMutate(projectsKey);
        if (oldFolderId) {
          globalMutate(cacheKeys.folderData(oldFolderId));
        }
        globalMutate(cacheKeys.folderData(folderId));
      } catch (error) {
        // Revert optimistic update on error
        globalMutate(projectsKey);
        toast.error("Failed to move project");
        console.error(error);
      }
    },
    [project, userFolders, userId]
  );

  const handleRemoveFromFolder = useCallback(async () => {
    if (!project) return;

    const oldFolderId = project.folder_id;

    // Optimistically update the cache
    const projectsKey = cacheKeys.projectsData(userId);
    await globalMutate(
      projectsKey,
      (currentData: ProjectsData | undefined) => {
        if (!currentData) return currentData;

        // Update the project's folder_id to null in the cached data
        const updatedProjects = currentData.projects.map((p) =>
          p.id === project.id ? { ...p, folder_id: null } : p
        );

        // Update folder count
        const updatedFolders = currentData.folders.map((f) => {
          if (f.id === oldFolderId) {
            return { ...f, projectCount: Math.max(0, f.projectCount - 1) };
          }
          return f;
        });

        return {
          projects: updatedProjects,
          folders: updatedFolders,
        };
      },
      { revalidate: false }
    );

    try {
      const { removeProjectFromFolder } = await import("@/lib/quick-folders");
      await removeProjectFromFolder(project.id);
      toast.success("Removed from folder");

      // Revalidate in background to ensure consistency
      globalMutate(projectsKey);
      if (oldFolderId) {
        globalMutate(cacheKeys.folderData(oldFolderId));
      }
    } catch (error) {
      // Revert optimistic update on error
      globalMutate(projectsKey);
      toast.error("Failed to remove from folder");
      console.error(error);
    }
  }, [project, userId]);

  return {
    handleProjectNameUpdate,
    handleMoveToFolder,
    handleRemoveFromFolder,
  };
}
