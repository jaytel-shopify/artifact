"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveToProjectOpen, setSaveToProjectOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteArtifact(artifact.id);
      globalMutate(cacheKeys.projectsData(user?.email));
      toast.success(`Artifact "${artifact.name}" deleted`);
      setDeleteOpen(false);
    } catch (error) {
      console.error("Failed to delete artifact:", error);
      toast.error("Failed to delete artifact");
    } finally {
      setIsDeleting(false);
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete artifact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{artifact.name}&quot;. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
