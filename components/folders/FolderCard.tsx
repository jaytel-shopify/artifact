"use client";

import Link from "next/link";
import { Folder as FolderIcon, MoreVertical } from "lucide-react";
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
  onRename: (folder: Folder) => void;
  onManageAccess: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
}

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
    <div className="group relative bg-card hover:bg-accent/50 border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <FolderIcon className="h-6 w-6 text-primary" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-1"
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
              onClick={(e) => handleMenuAction(e, () => onManageAccess(folder))}
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

      <Link
        href={`/folder/${folder.id}`}
        prefetch={false}
        className="after:content-[''] after:absolute after:inset-0"
      >
        <h3 className="font-semibold text-lg truncate">{folder.title}</h3>
      </Link>
      <p className="text-sm text-muted-foreground">
        {projectCount} {projectCount === 1 ? "project" : "projects"}
      </p>
    </div>
  );
}
