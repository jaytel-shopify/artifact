import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  createFolder,
  updateFolder as updateFolderDB,
  deleteFolder,
} from "@/lib/quick-folders";
import type { Folder } from "@/types";
import type { FolderWithCount } from "./useProjectsData";

export function useFolderManagement(
  folders: FolderWithCount[],
  mutate: () => void,
  userEmail?: string
) {
  const [localFolders, setLocalFolders] = useState(folders);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderWithCount | null>(
    null
  );
  const [folderToManage, setFolderToManage] = useState<Folder | null>(null);

  // Sync local folders with data
  useEffect(() => {
    setLocalFolders(folders);
  }, [folders]);

  async function handleCreateFolder(name: string) {
    if (!userEmail) return;

    try {
      const newFolder = await createFolder({
        name,
        creator_id: userEmail,
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

  return {
    // State
    localFolders,
    createFolderOpen,
    folderToRename,
    folderToDelete,
    folderToManage,
    // Actions
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    // Setters
    setLocalFolders,
    setCreateFolderOpen,
    setFolderToRename,
    setFolderToDelete,
    setFolderToManage,
  };
}

