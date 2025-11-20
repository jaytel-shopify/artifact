"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/presentation/ProjectCard";
import AppLayout from "@/components/layout/AppLayout";
import type { Folder } from "@/types";
import {
  createFolder,
  getChildren,
  getFolderById,
  getFolderMembersByFolderId,
} from "@/lib/quick/db-new";
import { Plus } from "lucide-react";

export default function FolderPage() {
  const router = useRouter();
  const folderId = router.query.id as string;

  const [folder, setFolder] = useState<Folder | null>(null);
  const [projects, setProjects] = useState<Folder[]>([]);

  useEffect(() => {
    const fetchFolderData = async () => {
      const [folder, projects] = await Promise.all([
        getFolderById(folderId),
        getChildren(folderId),
        getFolderMembersByFolderId(folderId),
      ]);
      setFolder(folder);
      setProjects(projects as Folder[]);
    };
    fetchFolderData();
  }, [folderId]);

  const { canEdit } = usePermissions(folderId);

  const handleNewProject = async () => {
    const newProject = await createFolder({
      title: "New Project",
      parent_id: folderId,
      depth: 1,
    });
    await createFolder({
      title: "New Page",
      parent_id: newProject.id,
      depth: 2,
    });
    setProjects([newProject, ...projects]);
  };

  return (
    <Suspense fallback={null}>
      <AppLayout
        mode="folder"
        folderId={folder?.id}
        folderName={folder?.title}
        backUrl="/"
        onNewProject={canEdit ? handleNewProject : undefined}
      >
        <div className="max-w-7xl mx-auto p-6">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No projects in this folder yet
              </p>
              {canEdit && (
                <Button onClick={handleNewProject}>
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p as Folder} />
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </Suspense>
  );
}
