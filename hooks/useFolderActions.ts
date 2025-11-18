import { useCallback } from "react";
import { toast } from "sonner";
import type { Folder } from "@/types";

/**
 * Hook to handle moving projects in/out of folders
 */
export function useFolderActions(
  project: Folder | null | undefined,
  userFolders: Folder[]
) {
  const handleProjectNameUpdate = useCallback(
    (name: string) => {
      if (!project) return;
      project.title = name;
    },
    [project]
  );

  const handleMoveToFolder = useCallback(
    async (folderId: string) => {
      if (!project) return;

      try {
        const { moveProjectToFolder } = await import("@/lib/quick/folders");
        await moveProjectToFolder(project.id, folderId);
        const folder = userFolders.find((f) => f.id === folderId);
        toast.success(`Moved to ${folder?.title || "folder"}`);
      } catch (error) {
        toast.error("Failed to move project");
        console.error(error);
      }
    },
    [project, userFolders]
  );

  const handleRemoveFromFolder = useCallback(async () => {
    if (!project) return;

    try {
      const { removeProjectFromFolder } = await import("@/lib/quick/folders");
      await removeProjectFromFolder(project.id);
      toast.success("Removed from folder");
    } catch (error) {
      toast.error("Failed to remove from folder");
      console.error(error);
    }
  }, [project]);

  return {
    handleProjectNameUpdate,
    handleMoveToFolder,
    handleRemoveFromFolder,
  };
}
