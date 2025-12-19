"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTransitionRouter } from "@/hooks/useTransitionRouter";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import useSWR, { mutate as globalMutate } from "swr";
import { ArrowLeft, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import HeaderUserAvatar from "@/components/layout/header/HeaderUserAvatar";
import { toast } from "sonner";
import type { Project, Artifact, Folder, ProjectArtifact, Page } from "@/types";
import {
  getFolderById,
  getProjectsInFolder,
  updateFolder,
  deleteFolder,
} from "@/lib/quick-folders";
import { canUserEdit, canUserView } from "@/lib/access-control";
import { cacheKeys } from "@/lib/cache-keys";
import { waitForQuick } from "@/lib/quick";

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
  const [folderData, hasEditAccess, hasViewAccess, folderProjects] =
    await Promise.all([
      getFolderById(folderId),
      canUserEdit(folderId, "folder", userId),
      canUserView(folderId, "folder", userId),
      getProjectsInFolder(folderId, userId),
    ]);

  // Folder doesn't exist or user has no access
  if (!folderData || !hasViewAccess) {
    return null;
  }

  // Track folder access (async, don't wait)
  if (hasEditAccess) {
    updateFolder(folderId, {
      last_accessed_at: new Date().toISOString(),
    }).catch(console.error);
  }

  // If no projects, return early
  if (folderProjects.length === 0) {
    return {
      folder: folderData,
      projects: [],
      canEdit: hasEditAccess,
    };
  }

  // Batch fetch all data needed for project covers (optimized)
  const quick = await waitForQuick();
  const projectIds = folderProjects.map((p) => p.id);

  const [allPages, allJunctionEntries] = await Promise.all([
    quick.db
      .collection("pages")
      .where({ project_id: { $in: projectIds } })
      .find(),
    quick.db
      .collection("project_artifacts")
      .where({ project_id: { $in: projectIds } })
      .find(),
  ]);

  // Group pages by project_id and find first page for each project
  const pagesByProject = new Map<string, Page[]>();
  const firstPageByProject = new Map<string, Page>();
  for (const page of allPages) {
    const pages = pagesByProject.get(page.project_id) || [];
    pages.push(page);
    pagesByProject.set(page.project_id, pages);
  }
  // Determine first page for each project (position 0 or lowest position)
  for (const [projectId, pages] of pagesByProject) {
    const sortedPages = pages.sort((a, b) => a.position - b.position);
    const firstPage = sortedPages.find((p) => p.position === 0) || sortedPages[0];
    if (firstPage) {
      firstPageByProject.set(projectId, firstPage);
    }
  }

  // Group junction entries by project_id
  const junctionByProject = new Map<string, ProjectArtifact[]>();
  for (const entry of allJunctionEntries) {
    const entries = junctionByProject.get(entry.project_id) || [];
    entries.push(entry);
    junctionByProject.set(entry.project_id, entries);
  }

  // Collect ONLY the artifact IDs needed for covers (first 3 from first page of each project)
  const coverArtifactIds = new Set<string>();
  const coverJunctionsByProject = new Map<string, ProjectArtifact[]>();
  
  for (const project of folderProjects) {
    const firstPage = firstPageByProject.get(project.id);
    if (!firstPage) continue;
    
    const projectJunctions = junctionByProject.get(project.id) || [];
    const firstPageJunctions = projectJunctions
      .filter((j) => j.page_id === firstPage.id)
      .sort((a, b) => a.position - b.position)
      .slice(0, 3); // Only need first 3 for cover
    
    coverJunctionsByProject.set(project.id, firstPageJunctions);
    for (const junction of firstPageJunctions) {
      coverArtifactIds.add(junction.artifact_id);
    }
  }

  // Fetch ONLY the artifacts needed for covers (typically ~3 per project instead of ALL)
  const coverArtifacts = coverArtifactIds.size > 0
    ? await quick.db
        .collection("artifacts")
        .where({ id: { $in: Array.from(coverArtifactIds) } })
        .find()
    : [];

  // Create artifact lookup map
  const artifactById = new Map<string, Artifact>();
  for (const artifact of coverArtifacts) {
    artifactById.set(artifact.id, artifact);
  }

  // Build projects with covers using the pre-fetched data
  const projectsWithCovers: ProjectWithCover[] = folderProjects.map(
    (project) => {
      const projectJunctions = junctionByProject.get(project.id) || [];
      const coverJunctions = coverJunctionsByProject.get(project.id) || [];

      // Get cover artifacts from pre-computed cover junctions
      const projectCoverArtifacts: Artifact[] = coverJunctions
        .map((j) => {
          const artifact = artifactById.get(j.artifact_id);
          if (!artifact) return null;
          return { ...artifact, name: j.name || artifact.name };
        })
        .filter((a): a is Artifact => a !== null);

      return {
        ...project,
        coverArtifacts: projectCoverArtifacts,
        artifactCount: projectJunctions.length,
      };
    }
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
  const router = useTransitionRouter();
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
        router.push("/projects/");
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
      router.push("/projects/");
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error("Failed to delete folder");
      throw error;
    }
  }

  async function handleNewProject() {
    router.push(`/projects/new/?folder=${folderId}`);
  }

  const backUrl = "/projects/";

  // ESC key navigates back to projects (only when no dialogs are open)
  const isAnyDialogOpen =
    renameDialogOpen || accessDialogOpen || deleteDialogOpen;

  const handleEscape = useCallback(() => {
    router.push(backUrl);
  }, [router]);

  useKeyboardShortcuts({
    onEscape: handleEscape,
    canEscape: !isAnyDialogOpen,
  });

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
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Rename Folder
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <HeaderUserAvatar />
          <DarkModeToggle />
        </>
      ),
    },
    [folder?.name, folder?.id, canEdit]
  );

  // Return null while loading or if folder not found
  if (isLoading || !folder) {
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
