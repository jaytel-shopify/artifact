"use client";

import { ArrowLeft, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Folder } from "@/types";

interface FolderHeaderProps {
  folder: Folder;
  projectCount: number;
  canEdit: boolean;
  onBack: () => void;
  onNewProject: () => void;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
}

/**
 * FolderHeader
 *
 * Header for folder view page with breadcrumb navigation,
 * folder info, and action buttons.
 */
export default function FolderHeader({
  folder,
  projectCount,
  canEdit,
  onBack,
  onNewProject,
  onShare,
  onRename,
  onDelete,
}: FolderHeaderProps) {
  return (
    <div className="bg-card border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <button
            onClick={onBack}
            className="hover:text-foreground transition-colors"
          >
            Projects
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">{folder.title}</span>
        </div>

        {/* Folder Info & Actions */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{folder.title}</h1>
            <p className="text-sm text-muted-foreground">
              {projectCount} {projectCount === 1 ? "project" : "projects"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Folder Button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onShare}
            >
              <Share className="h-4 w-4" />
              Share
            </Button>

            {/* New Project in Folder */}
            {canEdit && (
              <Button size="sm" className="gap-2" onClick={onNewProject}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            )}

            {/* Folder Actions Menu */}
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onRename}>
                    Rename Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    Delete Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
