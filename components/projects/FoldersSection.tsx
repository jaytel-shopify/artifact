"use client";

import { FolderOpen } from "lucide-react";
import FolderCard from "@/components/folders/FolderCard";
import type { FolderWithCount } from "@/hooks/useProjectsData";

interface FoldersSectionProps {
  folders: FolderWithCount[];
  title?: string;
}

/**
 * Reusable section component for displaying a grid of folders
 * Uses FolderCard for consistent UI across pages
 */
export function FoldersSection({
  folders,
  title = "Folders",
}: FoldersSectionProps) {
  if (folders.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-large">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            projectCount={folder.projectCount}
            canEdit={folder.canEdit}
          />
        ))}
      </div>
    </section>
  );
}
