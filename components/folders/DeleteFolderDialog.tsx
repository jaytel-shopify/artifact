"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface DeleteFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  folderName: string;
  projectCount: number;
}

/**
 * DeleteFolderDialog
 * 
 * Confirmation dialog for deleting folders.
 * Requires typing "DELETE" to confirm deletion when folder contains projects.
 * Shows warning about cascade deletion of all projects.
 */
export default function DeleteFolderDialog({
  isOpen,
  onClose,
  onConfirm,
  folderName,
  projectCount,
}: DeleteFolderDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
    }
  }, [isOpen]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setDeleting(false);
    }
  }

  const isConfirmed = confirmText === "DELETE";

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete &ldquo;{folderName}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            {projectCount > 0 ? (
              <>
                <p className="font-semibold text-destructive">
                  This folder contains {projectCount} {projectCount === 1 ? "project" : "projects"}.
                </p>
                <p>
                  All projects inside will be <strong>permanently deleted</strong>, including:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>All pages and artifacts</li>
                  <li>All uploaded files</li>
                  <li>All project data</li>
                </ul>
                <p className="font-semibold">This action cannot be undone.</p>
              </>
            ) : (
              <p>
                This folder is empty. Are you sure you want to delete it?
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {projectCount > 0 && (
          <div className="py-4 space-y-2">
            <label className="text-sm font-medium">
              Type <span className="font-mono bg-muted px-1 rounded">DELETE</span> to confirm:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
              disabled={deleting}
              autoFocus
            />
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={(projectCount > 0 && !isConfirmed) || deleting}
          >
            {deleting ? "Deleting..." : `Delete Folder${projectCount > 0 ? ` and ${projectCount} Project${projectCount !== 1 ? "s" : ""}` : ""}`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

