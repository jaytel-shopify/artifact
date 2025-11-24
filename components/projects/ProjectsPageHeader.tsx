import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";

interface ProjectsPageHeaderProps {
  onNewFolder: () => void;
  onNewProject: () => void;
}

export function ProjectsPageHeader({
  onNewFolder,
  onNewProject,
}: ProjectsPageHeaderProps) {
  return (
    <div
      className="bg-[var(--background)] border-b border-[var(--color-border-primary)]"
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex items-center justify-between h-full px-8">
        <div className="flex items-center gap-2">
          <img
            src="/favicons/icon-256.png"
            alt="Artifact"
            className="w-8 h-8"
            style={{ imageRendering: "crisp-edges" }}
          />
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            Artifact
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={onNewFolder}>
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
          <Button className="gap-2" onClick={onNewProject}>
            New Project
          </Button>
        </div>
      </div>
    </div>
  );
}
