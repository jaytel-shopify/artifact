"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import ProjectCard from "@/components/presentation/ProjectCard";
import FolderCard from "@/components/folders/FolderCard";
import FolderDialog from "@/components/folders/FolderDialog";
import ArtifactCard from "@/components/presentation/ArtifactCard";
// import QuickSiteCard from "@/components/presentation/QuickSiteCard";
import { EmptyProjectsState } from "@/components/projects/EmptyProjectsState";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useProjectsData } from "@/hooks/useProjectsData";
// import { useQuickSites } from "@/hooks/useQuickSites";
import { createFolder } from "@/lib/quick-folders";
import { cacheKeys } from "@/lib/cache-keys";
import { Button } from "@/components/ui/button";
import { useSetHeader } from "@/components/layout/HeaderContext";
import Logo from "@/components/layout/header/Logo";
import ViewToggle from "@/components/layout/header/ViewToggle";
import SearchBar from "@/components/layout/header/SearchBar";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch all data
  const { projects, folders, publishedArtifacts, isLoading, error } =
    useProjectsData(user?.email);

  // Fetch Quick sites
  // const { sites: quickSites, isLoading: sitesLoading } = useQuickSites();

  // Create folder dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  // Filter uncategorized projects (not in any folder)
  const uncategorizedProjects = useMemo(() => {
    return projects.filter((p) => !p.folder_id);
  }, [projects]);

  const handleCreateFolder = async (name: string) => {
    if (!user?.email) return;
    try {
      await createFolder({ name, creator_id: user.email });
      globalMutate(cacheKeys.projectsData(user.email));
      toast.success(`Folder "${name}" created`);
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error("Failed to create folder");
      throw error;
    }
  };

  const handleNewProject = () => {
    router.push("/projects/new");
  };

  // Set header content
  useSetHeader({
    left: (
      <>
        <Logo />
        <ViewToggle />
      </>
    ),
    center: <SearchBar mode="dashboard" />,
    right: (
      <>
        <Button variant="ghost" onClick={() => setCreateFolderOpen(true)}>
          New Folder
        </Button>
        <Button variant="primary" onClick={handleNewProject}>
          New Project
        </Button>
        <PWAInstallPrompt />
        <DarkModeToggle />
      </>
    ),
  });

  // Don't render until data is loaded
  if (isLoading) {
    return null;
  }

  return (
    <div className="max-w-[1100px] mx-auto p-6 space-y-10">
      {error && <p className="text-destructive">{String(error)}</p>}

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-large">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                projectCount={folder.projectCount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Projects Section */}
      {uncategorizedProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-large">Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {uncategorizedProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Sites Section */}
      {/* {!sitesLoading && quickSites.length > 0 && (
        <div className="space-y-4">
          <img src="/quick.png" alt="quick logo" className="w-[50px]" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {quickSites.map((site) => (
              <QuickSiteCard key={site.subdomain} site={site} />
            ))}
          </div>
        </div>
      )} */}

      <hr />

      {/* Published Artifacts Section */}
      {publishedArtifacts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-large">Published</h2>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-6">
            {publishedArtifacts.map((a) => (
              <ArtifactCard key={a.id} artifact={a} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading &&
        folders.length === 0 &&
        uncategorizedProjects.length === 0 &&
        publishedArtifacts.length === 0 && (
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
