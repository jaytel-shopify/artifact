"use client";

import Link from "next/link";
import { Folder as FolderIcon, MoreVertical } from "lucide-react";
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
import type { Folder } from "@/types";

interface FolderCardProps {
  folder: Folder;
  projectCount: number;
}

/**
 * FolderCard
 *
 * Displays a folder card that navigates to the folder view when clicked.
 * Includes context menu for folder actions.
 */
export default function FolderCard({ folder, projectCount }: FolderCardProps) {
  function handleMenuAction(e: React.MouseEvent, action: () => void) {
    e.stopPropagation();
    action();
  }
  const onRename = (folder: Folder) => {};
  const onManageAccess = (folder: Folder) => {};
  const onDelete = (folder: Folder) => {};

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link href={`/folder/${folder.id}`} prefetch={false} className="block">
          <div className="group relative bg-card hover:bg-accent/50 border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md">
            {/* Folder Icon */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderIcon className="h-6 w-6 text-primary" />
              </div>

              {/* Actions Menu (visible on hover) */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
              <h3 className="font-semibold text-lg truncate">{folder.title}</h3>
              <p className="text-sm text-muted-foreground">
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
