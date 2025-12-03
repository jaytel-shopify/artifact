"use client";

import { useState } from "react";
import Link from "@/components/ui/TransitionLink";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { FolderPlus, MoreVertical } from "lucide-react";
import ArtifactThumbnail from "./ArtifactThumbnail";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { SaveToProjectDialog } from "@/components/artifacts/SaveToProjectDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { deleteArtifact } from "@/lib/quick-db";
import { cacheKeys } from "@/lib/cache-keys";
import type { Artifact } from "@/types";

interface ArtifactCardProps {
  artifact: Artifact;
}

/**
 * ArtifactCard
 *
 * Self-contained artifact card with delete functionality built-in.
 * Uses globalMutate to refresh page data after deletion.
 */
export default function ArtifactCard({ artifact }: ArtifactCardProps) {
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveToProjectOpen, setSaveToProjectOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteArtifact(artifact.id);
      globalMutate(cacheKeys.projectsData(user?.id));
      toast.success(`Artifact "${artifact.name}" deleted`);
    } catch (error) {
      console.error("Failed to delete artifact:", error);
      toast.error("Failed to delete artifact");
      throw error;
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="group relative">
            <Link href={`/a/?id=${artifact.id}`} aria-label={artifact.name}>
              <ArtifactThumbnail
                artifact={artifact}
                className="rounded-card-inner"
              />
            </Link>

            {/* Three dots menu button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-7 w-7 rounded-md hover:bg-primary text-white opacity-0 transition-opacity group-hover:opacity-100 "
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem onClick={() => setSaveToProjectOpen(true)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Save to Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete Artifact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>

        {/* Context Menu (right-click) */}
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setSaveToProjectOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Save to Project
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Artifact
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DeleteConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete artifact?"
        description={`This will permanently delete "${artifact.name}". This action cannot be undone.`}
      />

      {/* Save to Project Dialog */}
      {user?.email && (
        <SaveToProjectDialog
          isOpen={saveToProjectOpen}
          onClose={() => setSaveToProjectOpen(false)}
          artifactId={artifact.id}
          artifactName={artifact.name}
          userEmail={user.email}
        />
      )}
    </>
  );
}
