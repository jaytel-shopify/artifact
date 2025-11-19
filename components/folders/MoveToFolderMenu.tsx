"use client";

import { Folder as FolderIcon, X } from "lucide-react";
import {
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import type { Folder } from "@/types";

interface MoveToFolderMenuProps {
  folders: Folder[];
  currentFolderId: string | null;
  onMoveToFolder: (folderId: string) => void;
  onRemoveFromFolder: () => void;
}

/**
 * MoveToFolderMenu
 *
 * Context menu sub-menu for moving projects to folders.
 * Shows list of available folders and "Remove from Folder" option.
 */
export default function MoveToFolderMenu({
  folders,
  currentFolderId,
  onMoveToFolder,
  onRemoveFromFolder,
}: MoveToFolderMenuProps) {
  // Filter out current folder if project is already in a folder
  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  return (
    <>
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
                onClick={() => onMoveToFolder(folder.id)}
              >
                {folder.title}
              </ContextMenuItem>
            ))
          ) : (
            <ContextMenuItem disabled>
              {currentFolderId ? "No other folders" : "No folders yet"}
            </ContextMenuItem>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>

      {/* Remove from Folder option (only if in a folder) */}
      {currentFolderId && (
        <ContextMenuItem
          onClick={onRemoveFromFolder}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Remove from Folder
        </ContextMenuItem>
      )}
    </>
  );
}
