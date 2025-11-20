import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ContextMenuItem } from "@/components/ui/context-menu";
import MoveToFolderMenu from "@/components/folders/MoveToFolderMenu";
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

  // Dropdown variant
  return (
    <>
      <DropdownMenuItem onClick={onRename}>Rename Project</DropdownMenuItem>

      {/* Move to Folder submenu */}
      {folders.length > 0 && (
        <>
          {folders.map((folder) => (
            <DropdownMenuItem
              key={folder.id}
              onClick={() => onMoveToFolder(folder.id)}
            >
              Move to {folder.name}
            </DropdownMenuItem>
          ))}
        </>
      )}

      <DropdownMenuItem variant="destructive" onClick={onDelete}>
        Delete Project
      </DropdownMenuItem>
    </>
  );
}

