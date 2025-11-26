import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ContextMenuItem } from "@/components/ui/context-menu";
import MoveToFolderMenu from "@/components/folders/MoveToFolderMenu";
import { Folder as FolderIcon, X } from "lucide-react";
import type { Project } from "@/types";
import type { FolderWithCount } from "@/hooks/useProjectsData";

interface ProjectMenuItemsProps {
  project: Project;
  folders: FolderWithCount[];
  onRename: () => void;
  onDelete: () => void;
  onMoveToFolder: (folderId: string) => void;
  onRemoveFromFolder: () => void;
  variant?: "dropdown" | "context";
}

export function ProjectMenuItems({
  project,
  folders,
  onRename,
  onDelete,
  onMoveToFolder,
  onRemoveFromFolder,
  variant = "dropdown",
}: ProjectMenuItemsProps) {
  if (variant === "context") {
    return (
      <>
        <ContextMenuItem onClick={onRename}>Rename Project</ContextMenuItem>

        <MoveToFolderMenu
          folders={folders}
          currentFolderId={project.folder_id}
          onMoveToFolder={onMoveToFolder}
          onRemoveFromFolder={onRemoveFromFolder}
        />

        <ContextMenuItem variant="destructive" onClick={onDelete}>
          Delete Project
        </ContextMenuItem>
      </>
    );
  }

  // Dropdown variant - use submenu like context menu
  const availableFolders = folders.filter((f) => f.id !== project.folder_id);

  return (
    <>
      <DropdownMenuItem onClick={onRename}>Rename Project</DropdownMenuItem>

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
                onClick={() => onMoveToFolder(folder.id)}
              >
                {folder.name}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              {project.folder_id ? "No other folders" : "No folders yet"}
            </DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      {/* Remove from Folder option (only if in a folder) */}
      {project.folder_id && (
        <DropdownMenuItem
          onClick={onRemoveFromFolder}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Remove from Folder
        </DropdownMenuItem>
      )}

      <DropdownMenuItem variant="destructive" onClick={onDelete}>
        Delete Project
      </DropdownMenuItem>
    </>
  );
}

