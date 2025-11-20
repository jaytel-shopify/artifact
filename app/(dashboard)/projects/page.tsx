"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import ProjectCard from "@/components/presentation/ProjectCard";
import FolderCard from "@/components/folders/FolderCard";
import FolderDialog from "@/components/folders/FolderDialog";
import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import { SharePanel } from "@/components/access/SharePanel";
import MoveToFolderMenu from "@/components/folders/MoveToFolderMenu";
import type { Project, Artifact, Folder } from "@/types";
import { toast } from "sonner";
import {
  getProjects,
  updateProject,
  deleteProject,
  getArtifactsByProject,
} from "@/lib/quick-db";
import {
  getFolders,
  createFolder,
  updateFolder as updateFolderDB,
  deleteFolder,
  getProjectCountInFolder,
} from "@/lib/quick-folders";
import { getUserAccessibleResources } from "@/lib/access-control";
import {
  moveProjectToFolder,
  removeProjectFromFolder,
} from "@/lib/quick-folders";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

/**
 * Fetcher function for SWR - gets all projects and their first 3 artifacts for covers
 */
async function fetcher(userEmail?: string): Promise<{
  projects: Array<Project & { coverArtifacts: Artifact[] }>;
  folders: Array<Folder & { projectCount: number }>;
}> {
  // Parallel loading - fetch projects and folders simultaneously
  const [projects, userFoldersAccess] = await Promise.all([
    getProjects(userEmail),
    getUserAccessibleResources(userEmail || "", "folder"),
  ]);

  // Get full folder details from access entries
  const { getFolderById } = await import("@/lib/quick-folders");
  const userFolders = await Promise.all(
    userFoldersAccess.map((access) => getFolderById(access.resource_id))
  );
  const validFolders = userFolders.filter((f): f is Folder => f !== null);

  // Get cover artifacts for projects (in parallel)
  const projectsWithCovers = await Promise.all(
    projects.map(async (project) => {
      const artifacts = await getArtifactsByProject(project.id);
      return {
        ...project,
        coverArtifacts: artifacts.slice(0, 3),
      };
    })
  );

  // Get project counts for folders (in parallel)
  const foldersWithCounts = await Promise.all(
    validFolders.map(async (folder) => {
      const count = await getProjectCountInFolder(folder.id);
      return { ...folder, projectCount: count };
    })
  );

  return {
    projects: projectsWithCovers,
    folders: foldersWithCounts,
  };
}
import ArtifactCard from "@/components/presentation/ArtifactCard";
import QuickSiteCard from "@/components/presentation/QuickSiteCard";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import { EmptyProjectsState } from "@/components/projects/EmptyProjectsState";
import { ProjectMenuItems } from "@/components/projects/ProjectMenuItems";
import { ProjectDialogs } from "@/components/projects/ProjectDialogs";
import { useProjectsData } from "@/hooks/useProjectsData";
import { useProjectActions } from "@/hooks/useProjectActions";
import { useFolderManagement } from "@/hooks/useFolderManagement";
import { useQuickSites } from "@/hooks/useQuickSites";

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch all data
  const { projects, folders, publishedArtifacts, isLoading, error, mutate } =
    useProjectsData(user?.email);

  // Fetch Quick sites
  const { sites: quickSites, isLoading: sitesLoading } = useQuickSites();

  // Folder management
  const {
    localFolders,
    createFolderOpen,
    folderToRename,
    folderToDelete,
    folderToManage,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    setLocalFolders,
    setCreateFolderOpen,
    setFolderToRename,
    setFolderToDelete,
    setFolderToManage,
  } = useFolderManagement(folders, mutate, user?.email);

  // Project actions
  const {
    projectToDelete,
    projectToRename,
    newProjectName,
    isDeleting,
    isRenaming,
    handleMoveToFolder,
    handleRemoveFromFolder,
    handleDeleteProject,
    handleRenameProject,
    confirmDelete,
    confirmRename,
    setProjectToDelete,
    setProjectToRename,
    setNewProjectName,
  } = useProjectActions(mutate, folders, setLocalFolders);

  // Filter uncategorized projects (not in any folder)
  const uncategorizedProjects = useMemo(() => {
    return projects.filter((p) => !p.folder_id);
  }, [projects]);

  function handleNewProject() {
    router.push("/projects/new");
  }

  // Don't render until data is loaded
  if (isLoading) {
    return null;
  }

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
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setCreateFolderOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
            <Button className="gap-2" onClick={handleNewProject}>
              New Project
            </Button>

            <PWAInstallPrompt />
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto">
        <div className="max-w-[1100px] mx-auto p-6 space-y-10">
          {error && <p className="text-red-600">{String(error)}</p>}

          {/* Folders Section */}
          {localFolders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Folders</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {localFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    projectCount={folder.projectCount}
                    onRename={(f) => setFolderToRename(f)}
                    onManageAccess={(f) => setFolderToManage(f)}
                    onDelete={(f) => setFolderToDelete(f)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {uncategorizedProjects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {uncategorizedProjects.map((p) => (
                  <ContextMenu key={p.id}>
                    <ContextMenuTrigger asChild>
                      <div>
                        <ProjectCard
                          project={p}
                          onDelete={() => handleDeleteProject(p)}
                          menuItems={
                            <ProjectMenuItems
                              project={p}
                              folders={localFolders}
                              onRename={() => handleRenameProject(p)}
                              onDelete={() => handleDeleteProject(p)}
                              onMoveToFolder={(folderId) =>
                                handleMoveToFolder(p, folderId)
                              }
                              onRemoveFromFolder={() =>
                                handleRemoveFromFolder(p)
                              }
                              variant="dropdown"
                            />
                          }
                        />
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ProjectMenuItems
                        project={p}
                        folders={localFolders}
                        onRename={() => handleRenameProject(p)}
                        onDelete={() => handleDeleteProject(p)}
                        onMoveToFolder={(folderId) =>
                          handleMoveToFolder(p, folderId)
                        }
                        onRemoveFromFolder={() => handleRemoveFromFolder(p)}
                        variant="context"
                      />
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            </div>
          )}

          {/* Quick Sites Section */}
          {!sitesLoading && quickSites.length > 0 && (
            <div className="space-y-4">
              <img src="/quick.png" alt="quick logo" class="w-[50px]" />
              <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-7 gap-6">
                {quickSites.map((site) => (
                  <QuickSiteCard key={site.subdomain} site={site} />
                ))}
              </div>
            </div>
          )}

          <hr />

          {/* Published Artifacts Section */}
          {publishedArtifacts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Published</h2>
              <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-7 gap-6">
                {publishedArtifacts.map((a) => (
                  <ArtifactCard key={a.id} artifact={a} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading &&
            localFolders.length === 0 &&
            uncategorizedProjects.length === 0 &&
            publishedArtifacts.length === 0 && (
              <EmptyProjectsState
                onCreateFolder={() => setCreateFolderOpen(true)}
                onCreateProject={handleNewProject}
              />
            )}

          {/* Project Dialogs */}
          <ProjectDialogs
            projectToDelete={projectToDelete}
            isDeleting={isDeleting}
            onDeleteConfirm={confirmDelete}
            onDeleteCancel={() => setProjectToDelete(null)}
            projectToRename={projectToRename}
            newProjectName={newProjectName}
            isRenaming={isRenaming}
            onRenameConfirm={confirmRename}
            onRenameCancel={() => setProjectToRename(null)}
            onNameChange={setNewProjectName}
          />

          {/* Folder Dialogs */}
          <FolderDialog
            isOpen={createFolderOpen}
            onClose={() => setCreateFolderOpen(false)}
            onSubmit={handleCreateFolder}
            mode="create"
          />

          <FolderDialog
            isOpen={!!folderToRename}
            onClose={() => setFolderToRename(null)}
            onSubmit={handleRenameFolder}
            mode="rename"
            initialName={folderToRename?.name || ""}
          />

          {folderToManage && user && (
            <SharePanel
              isOpen={!!folderToManage}
              onClose={() => setFolderToManage(null)}
              resourceId={folderToManage.id}
              resourceType="folder"
              resourceName={folderToManage.name}
              currentUserEmail={user.email}
            />
          )}

          <DeleteFolderDialog
            isOpen={!!folderToDelete}
            onClose={() => setFolderToDelete(null)}
            onConfirm={handleDeleteFolder}
            folderName={folderToDelete?.name || ""}
            projectCount={folderToDelete?.projectCount || 0}
          />
        </div>
      </main>
    </div>
  );
}
