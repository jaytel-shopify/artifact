"use client";

import { useEffect, useMemo, useState } from "react";
import { useTransitionRouter } from "@/hooks/useTransitionRouter";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import FolderDialog from "@/components/folders/FolderDialog";
import { EmptyProjectsState } from "@/components/projects";
import { useProjectsData } from "@/hooks/useProjectsData";
import { createFolder } from "@/lib/quick-folders";
import { cacheKeys } from "@/lib/cache-keys";
import { Button } from "@/components/ui/button";
import { useSetHeader } from "@/components/layout/HeaderContext";
import Logo from "@/components/layout/header/Logo";
import ViewToggle from "@/components/layout/header/ViewToggle";
import SearchBar from "@/components/layout/header/SearchBar";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import HeaderUserAvatar from "@/components/layout/header/HeaderUserAvatar";
import { ProjectsSection, FoldersSection } from "@/components/projects";

export default function ProjectsPage() {
  const router = useTransitionRouter();
  const { user } = useAuth();

  // Fetch all data
  const { projects, folders, isLoading, error } = useProjectsData(user?.id);

  useEffect(() => {
    document.title = "Projects | Artifact";
  }, []);

  // Create folder dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  // Filter uncategorized projects (not in any folder)
  const uncategorizedProjects = useMemo(() => {
    return projects.filter((p) => !p.folder_id);
  }, [projects]);

  const handleCreateFolder = async (name: string) => {
    if (!user?.email || !user?.id) return;
    try {
      await createFolder({
        name,
        creator_id: user.id,
        creator_email: user.email,
      });
      globalMutate(cacheKeys.projectsData(user.id));
      toast.success(`Folder "${name}" created`);
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error("Failed to create folder");
      throw error;
    }
  };

  const handleNewProject = () => {
    router.push("/projects/new/");
  };

  // Set header content
  useSetHeader({
    left: (
      <>
        <Logo />
        <ViewToggle />
      </>
    ),
    center: <SearchBar />,
    right: (
      <>
        <Button variant="ghost" onClick={() => setCreateFolderOpen(true)}>
          New Folder
        </Button>
        <Button variant="primary" onClick={handleNewProject}>
          New Project
        </Button>
        <HeaderUserAvatar />
        <DarkModeToggle />
      </>
    ),
  });

  return (
    <div className="max-w-[1100px] mx-auto p-6 space-y-10">
      {error && <p className="text-destructive">{String(error)}</p>}

      <FoldersSection folders={folders} />
      <ProjectsSection projects={uncategorizedProjects} />

      {/* Empty State */}
      {!isLoading &&
        folders.length === 0 &&
        uncategorizedProjects.length === 0 && (
          <EmptyProjectsState
            onCreateFolder={() => setCreateFolderOpen(true)}
            onCreateProject={handleNewProject}
          />
        )}

      {/* Create Folder Dialog */}
      <FolderDialog
        isOpen={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onSubmit={handleCreateFolder}
        mode="create"
      />
    </div>
  );
}
