"use client";

import { useState, useCallback } from "react";
import Link from "@/components/ui/TransitionLink";
import { MoreVertical } from "lucide-react";
import { mutate as globalMutate, preload } from "swr";
import { toast } from "sonner";
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
import { Card } from "@/components/ui/card";
import { SharePanel } from "@/components/access/SharePanel";
import FolderDialog from "./FolderDialog";
import DeleteFolderDialog from "./DeleteFolderDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateFolder, deleteFolder, getFolderById } from "@/lib/quick-folders";
import { cacheKeys } from "@/lib/cache-keys";

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    creator_id: string;
  };
  projectCount: number;
}

/**
 * FolderCard
 *
 * Self-contained folder card with all actions and dialogs built-in.
 * Uses globalMutate to refresh page data after mutations.
 */
export default function FolderCard({ folder, projectCount }: FolderCardProps) {
  const { user } = useAuth();

  // Dialog states
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const refreshData = () => {
    globalMutate(cacheKeys.projectsData(user?.id));
  };

  // Preload folder data on hover for faster navigation
  const handleMouseEnter = useCallback(() => {
    const cacheKey = cacheKeys.folderData(folder.id);
    if (cacheKey) {
      preload(cacheKey, () => getFolderById(folder.id));
    }
  }, [folder.id]);

  const handleRename = async (name: string) => {
    try {
      await updateFolder(folder.id, { name });
      refreshData();
      toast.success("Folder renamed");
    } catch (error) {
      console.error("Failed to rename folder:", error);
      toast.error("Failed to rename folder");
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFolder(folder.id);
      refreshData();
      toast.success(`Folder "${folder.name}" deleted`);
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error("Failed to delete folder");
      throw error;
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card className="group relative p-4" onMouseEnter={handleMouseEnter}>
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
                    className="hover:bg-background text-text-primary absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    Rename Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShareOpen(true)}>
                    Manage Access
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link
              href={`/folder/?id=${folder.id}`}
              className="block space-y-1 after:content-[''] after:absolute after:inset-0"
              aria-label={
                folder.name +
                " - " +
                projectCount +
                " " +
                (projectCount === 1 ? "project" : "projects")
              }
            >
              <h3 className="truncate text-medium">{folder.name}</h3>
              <p className="text-text-secondary text-small">
                {projectCount} {projectCount === 1 ? "project" : "projects"}
              </p>
            </Link>
          </Card>
        </ContextMenuTrigger>

        {/* Context Menu (right-click) */}
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setRenameOpen(true)}>
            Rename Folder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setShareOpen(true)}>
            Manage Access
          </ContextMenuItem>
          <ContextMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <FolderDialog
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        onSubmit={handleRename}
        mode="rename"
        initialName={folder.name}
      />

      {/* Delete Dialog */}
      <DeleteFolderDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        folderName={folder.name}
        projectCount={projectCount}
      />

      {/* Share Panel */}
      {user && (
        <SharePanel
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          resourceId={folder.id}
          resourceType="folder"
          resourceName={folder.name}
          currentUserId={user.id}
          currentUserEmail={user.email}
        />
      )}
    </>
  );
}
