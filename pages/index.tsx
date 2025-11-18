// import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import FolderCard from "@/components/folders/FolderCard";
import { getFoldersByDepth } from "@/lib/quick/db-new";
import { useEffect, useState } from "react";
import type { Folder } from "@/types";

export default function ProjectsPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  useEffect(() => {
    const fetchFolders = async () => {
      const folders = await getFoldersByDepth(0);
      setFolders(folders);
    };
    fetchFolders();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      {/* Header with + New Folder button */}
      <div
        className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)]"
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
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Artifact
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
            {/* <Button className="gap-2" onClick={handleNewProject}>
              New Project
            </Button> */}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Folders</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    projectCount={0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
