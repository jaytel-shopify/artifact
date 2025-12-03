"use client";

import { InputDialog } from "@/components/ui/input-dialog";

interface FolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  mode: "create" | "rename";
  initialName?: string;
}

export default function FolderDialog({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialName = "",
}: FolderDialogProps) {
  return (
    <InputDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={mode === "create" ? "Create New Folder" : "Rename Folder"}
      description={
        mode === "create"
          ? "Create a folder to organize your projects"
          : "Enter a new name for this folder"
      }
      placeholder="Folder name"
      initialValue={initialName}
      submitLabel={mode === "create" ? "Create Folder" : "Rename"}
      submittingLabel={mode === "create" ? "Creating..." : "Renaming..."}
    />
  );
}
