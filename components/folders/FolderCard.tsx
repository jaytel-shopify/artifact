"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
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
import { Button } from "@/components/ui/button";

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    creator_id: string;
  };
  projectCount: number;
  onRename: (folder: any) => void;
  onManageAccess: (folder: any) => void;
  onDelete: (folder: any) => void;
}

/**
 * FolderCard
 *
 * Displays a folder card that navigates to the folder view when clicked.
 * Includes context menu for folder actions.
 */
export default function FolderCard({
  folder,
  projectCount,
  onRename,
  onManageAccess,
  onDelete,
}: FolderCardProps) {
  function handleMenuAction(e: React.MouseEvent, action: () => void) {
    e.stopPropagation();
    action();
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link
          href={`/folder/?id=${folder.id}`}
          prefetch={false}
          className="block"
        >
          <div className="group bg-primary border-border hover:bg-secondary/10 rounded-card relative cursor-pointer border p-4 transition-all">
            {/* Actions Menu (visible on hover) */}
            <div className="flex items-start justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => handleMenuAction(e, () => onRename(folder))}
                  >
                    Rename Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) =>
                      handleMenuAction(e, () => onManageAccess(folder))
                    }
                  >
                    Manage Access
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => handleMenuAction(e, () => onDelete(folder))}
                  >
                    Delete Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Folder Info */}
            <div className="space-y-1">
              <h3 className="truncate text-sm font-semibold">{folder.name}</h3>
              <p className="text-text-secondary text-xs">
                {projectCount} {projectCount === 1 ? "project" : "projects"}
              </p>
            </div>
          </div>
        </Link>
      </ContextMenuTrigger>

      {/* Context Menu (right-click) */}
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onRename(folder)}>
          Rename Folder
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onManageAccess(folder)}>
          Manage Access
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={() => onDelete(folder)}>
          Delete Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
