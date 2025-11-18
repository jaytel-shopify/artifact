"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/components/auth/AuthProvider";

import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/presentation/ProjectCard";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";
import type { Artifact, Folder } from "@/types";
import { getChildFolders, getFolderById } from "@/lib/quick/db-new";

async function FolderPageContent() {
  const router = useRouter();
  const folderId = router.query.id as string;
  const folder = await getFolderById(folderId);
  const projects = await getChildFolders(folderId);

  const backUrl = "/";

  return (
    <AppLayout
      mode="folder"
      folderId={folder?.id}
      folderName={folder?.title}
      backUrl={backUrl}
    >
      <div className="max-w-7xl mx-auto p-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No projects in this folder yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard project={p} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function FolderPage() {
  return (
    <Suspense fallback={null}>
      <FolderPageContent />
    </Suspense>
  );
}
