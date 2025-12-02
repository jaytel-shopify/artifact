"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/presentation/ProjectCard";
import FolderDialog from "@/components/folders/FolderDialog";
import { SharePanel } from "@/components/access/SharePanel";
import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import EditableTitle from "@/components/presentation/EditableTitle";
import { useSetHeader } from "@/components/layout/HeaderContext";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import { FolderPageSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Project, Artifact, Folder } from "@/types";
import {
  getFolderById,
  getProjectsInFolder,
  updateFolder,
  deleteFolder,
} from "@/lib/quick-folders";
import { canUserEdit } from "@/lib/access-control";
import {
  getProjectCoverArtifacts,
  getProjectArtifactsByProject,
} from "@/lib/quick-db";
import { cacheKeys } from "@/lib/cache-keys";

type ProjectWithCover = Project & {
  coverArtifacts: Artifact[];
  artifactCount: number;
};

interface FolderData {
  folder: Folder;
  projects: ProjectWithCover[];
  canEdit: boolean;
}

async function fetchFolderData(
  folderId: string,
  userId: string
): Promise<FolderData | null> {
  const [folderData, hasEditAccess, folderProjects] = await Promise.all([
    getFolderById(folderId),
    canUserEdit(folderId, "folder", userId),
    getProjectsInFolder(folderId, userId),
  ]);

  if (!folderData) {
    return null;
  }

  // Track folder access (async, don't wait)
  if (hasEditAccess) {
    updateFolder(folderId, {
      last_accessed_at: new Date().toISOString(),
    }).catch(console.error);
  }

  // Load cover artifacts and artifact count for projects (in parallel)
  const projectsWithCovers = await Promise.all(
    folderProjects.map(async (project) => {
      const [coverArtifacts, allArtifacts] = await Promise.all([
        getProjectCoverArtifacts(project.id),
        getProjectArtifactsByProject(project.id),
      ]);
      return {
        ...project,
        coverArtifacts,
        artifactCount: allArtifacts.length,
      };
    })
  );

  return {
    folder: folderData,
    projects: projectsWithCovers,
    canEdit: hasEditAccess,
  };
}

function FolderPageContent() {
  const searchParams = useSearchParams();
  const folderId = searchParams?.get("id") || "";
  const router = useRouter();
  const { user } = useAuth();

  // Use SWR for folder data - ProjectCard will call globalMutate(cacheKeys.folderData(folderId))
  const swrKey = folderId && user?.id ? cacheKeys.folderData(folderId) : null;

  // Force revalidation when folderId changes
  useEffect(() => {
    if (swrKey) {
      globalMutate(swrKey);
    }
  }, [folderId, swrKey]);

  const { data, isLoading, mutate } = useSWR<FolderData | null>(
    swrKey,
    () => fetchFolderData(folderId, user!.id),
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        if (data && data.folder && data.folder.name) {
          document.title = `${data.folder.name} | Artifact`;
        }
      },
      onError: () => {
        toast.error("Failed to load folder");
        router.push("/projects");
      },
    }
  );

  const folder = data?.folder ?? null;
  const projects = data?.projects ?? [];
  const canEdit = data?.canEdit ?? false;

  // Dialogs
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function handleRenameFolder(name: string) {
    if (!folder) return;

    try {
      await updateFolder(folder.id, { name });
      mutate(); // Refresh folder data
      globalMutate(cacheKeys.projectsData(user?.id)); // Refresh projects page
      toast.success("Folder renamed");
    } catch (error) {
      console.error("Failed to rename folder:", error);
      toast.error("Failed to rename folder");
      throw error;
    }
  }

  async function handleDeleteFolder() {
    if (!folder) return;

    try {
      await deleteFolder(folder.id);
      globalMutate(cacheKeys.projectsData(user?.id)); // Refresh projects page
      toast.success(`Folder "${folder.name}" and all its projects deleted`);
      router.push("/projects");
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error("Failed to delete folder");
      throw error;
    }
  }

  async function handleNewProject() {
    router.push(`/projects/new?folder=${folderId}`);
  }

  const backUrl = "/projects/";

  async function handleFolderRename(name: string) {
    // Just update local state - EditableTitle already saved to database
    if (!folder) return;
    mutate({ ...data!, folder: { ...folder, name } }, false);
  }

  // Set header content (update when folder data loads)
  useSetHeader(
    {
      left: (
        <>
          <Button
            variant="default"
            size="icon"
            href={backUrl}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </>
      ),
      center: folder ? (
        <EditableTitle
          initialValue={folder.name}
          projectId={folder.id}
          onUpdated={canEdit ? handleFolderRename : undefined}
          isReadOnly={!canEdit}
          isFolder={true}
        />
      ) : null,
      right: (
        <>
          {/* Share Button */}
          <Button variant="default" onClick={() => setAccessDialogOpen(true)}>
            Share
          </Button>

          {/* New Project Button */}
          {canEdit && (
            <Button variant="default" onClick={handleNewProject}>
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
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                  Rename Folder
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DarkModeToggle />
        </>
      ),
    },
    [folder?.name, folder?.id, canEdit]
  );

  // Show skeleton while loading, null if folder not found after loading
  if (isLoading) {
    return <FolderPageSkeleton />;
  }

  if (!folder) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {projects.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-text-secondary">
            No projects in this folder yet
          </p>
          {canEdit && (
            <Button onClick={handleNewProject}>Create Project in Folder</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <FolderDialog
        isOpen={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        onSubmit={handleRenameFolder}
        mode="rename"
        initialName={folder.name}
      />

      {/* Folder Access Dialog */}
      {user && (
        <SharePanel
          isOpen={accessDialogOpen}
          onClose={() => setAccessDialogOpen(false)}
          resourceId={folder.id}
          resourceType="folder"
          resourceName={folder.name}
          currentUserId={user.id}
          currentUserEmail={user.email}
        />
      )}

      <DeleteFolderDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteFolder}
        folderName={folder.name}
        projectCount={projects.length}
      />
    </div>
  );
}

export default function FolderPage() {
  return (
    <Suspense fallback={null}>
      <FolderPageContent />
    </Suspense>
  );
}
