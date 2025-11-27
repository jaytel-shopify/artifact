"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, Folder as FolderIcon, X } from "lucide-react";
import { updateProject } from "@/lib/quick-db";
import { toast } from "sonner";
import type { Folder } from "@/types";

export default function EditableTitle({
  initialValue,
  projectId,
  onUpdated,
  isReadOnly = false,
  isFolder = false,
  folders = [],
  currentFolderId = null,
  onMoveToFolder,
  onRemoveFromFolder,
}: {
  initialValue: string;
  projectId?: string;
  onUpdated?: (name: string) => void;
  isReadOnly?: boolean;
  isFolder?: boolean;
  folders?: Folder[];
  currentFolderId?: string | null;
  onMoveToFolder?: (folderId: string) => void;
  onRemoveFromFolder?: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  async function save(next: string) {
    if (!projectId || !next.trim()) {
      setValue(initialValue);
      return;
    }
    setSaving(true);
    try {
      if (isFolder) {
        // Update folder name
        const { updateFolder } = await import("@/lib/quick-folders");
        await updateFolder(projectId, { name: next.trim() });
        onUpdated?.(next.trim());
        toast.success("Folder renamed");
      } else {
        // Update project name
        await updateProject(projectId, { name: next.trim() });
        onUpdated?.(next.trim());
        toast.success("Project name updated");
      }
    } catch (err) {
      console.error(
        `Failed to update ${isFolder ? "folder" : "project"} name:`,
        err
      );
      toast.error(`Failed to update ${isFolder ? "folder" : "project"} name`);
      setValue(initialValue);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  // Filter folders (exclude current folder)
  const availableFolders = folders.filter((f) => f.id !== currentFolderId);
  const showFolderActions =
    !isReadOnly &&
    onMoveToFolder &&
    (availableFolders.length > 0 || currentFolderId);

  // If read-only, just show the title (not editable)
  if (isReadOnly) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-text-primary  text-text-primary px-2 py-1">
          {value || "Untitled Project"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save(value);
              }
              if (e.key === "Escape") {
                setValue(initialValue);
                setEditing(false);
              }
            }}
            className="bg-white/10 border-white/20 text-text-primary focus:bg-white/20 focus:border-white/40 focus:ring-white/30 min-w-[200px]"
            disabled={saving}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => save(value)}
            disabled={saving}
            className="h-8 w-8 text-text-primary hover:bg-white/10"
            aria-label="Save project name"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-left text-text-primary  text-text-primary px-2 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <span>{value || "Untitled Project"}</span>
        </button>
      )}
      {saving && (
        <span className="text-small text-text-primary/60 ml-2">Saving…</span>
      )}

      {/* Folder Actions Dropdown */}
      {showFolderActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-text-primary/60 hover:text-text-primary hover:bg-white/10"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {/* Move to Folder options */}
            {availableFolders.length > 0 &&
              availableFolders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => onMoveToFolder?.(folder.id)}
                  className="flex items-center gap-2"
                >
                  <FolderIcon className="h-4 w-4" />
                  Move to {folder.name}
                </DropdownMenuItem>
              ))}

            {/* Remove from Folder option */}
            {currentFolderId && onRemoveFromFolder && (
              <>
                {availableFolders.length > 0 && (
                  <div className="h-px bg-border my-1" />
                )}
                <DropdownMenuItem
                  onClick={onRemoveFromFolder}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Remove from Folder
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
