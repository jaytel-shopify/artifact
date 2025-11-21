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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/types";

interface ProjectDialogsProps {
  // Delete dialog props
  projectToDelete: Project | null;
  isDeleting: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;

  // Rename dialog props
  projectToRename: Project | null;
  newProjectName: string;
  isRenaming: boolean;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
  onNameChange: (name: string) => void;
}

export function ProjectDialogs({
  projectToDelete,
  isDeleting,
  onDeleteConfirm,
  onDeleteCancel,
  projectToRename,
  newProjectName,
  isRenaming,
  onRenameConfirm,
  onRenameCancel,
  onNameChange,
}: ProjectDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && onDeleteCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{projectToDelete?.name}
              &rdquo;? This will permanently delete the project and all its
              pages and artifacts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={onDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog
        open={!!projectToRename}
        onOpenChange={(open) => !open && onRenameCancel()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for &ldquo;{projectToRename?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newProjectName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Project name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newProjectName.trim()) {
                  onRenameConfirm();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onRenameCancel}>
              Cancel
            </Button>
            <Button
              onClick={onRenameConfirm}
              disabled={isRenaming || !newProjectName.trim()}
            >
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

