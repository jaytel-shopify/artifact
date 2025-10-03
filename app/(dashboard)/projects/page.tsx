"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import AppHeader from "@/components/layout/AppHeader";
import ProjectCard from "@/components/presentation/ProjectCard";
import type { Project, Artifact } from "@/types";
import { toast } from "sonner";
import { getProjects, updateProject, deleteProject, getArtifactsByProject } from "@/lib/quick-db";

/**
 * Fetcher function for SWR - gets all projects and their first 3 artifacts for covers
 */
async function fetcher(userEmail?: string): Promise<Array<Project & { coverArtifacts: Artifact[] }>> {
  const projects = await getProjects(userEmail);
  
  // For each project, get first 3 artifacts for the cover
  const projectsWithCovers = await Promise.all(
    projects.map(async (project) => {
      const artifacts = await getArtifactsByProject(project.id);
      return {
        ...project,
        coverArtifacts: artifacts.slice(0, 3), // First 3 artifacts for cover
      };
    })
  );
  
  return projectsWithCovers;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: projects = [], isLoading, error, mutate } = useSWR<Array<Project & { coverArtifacts: Artifact[] }>>(
    user ? `projects-${user.email}` : null,
    () => (user ? fetcher(user.email) : []),
    { 
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
      refreshInterval: 60000,  // Refresh every minute
    }
  );
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<(Project & { coverArtifacts: Artifact[] }) | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [projectToRename, setProjectToRename] = useState<(Project & { coverArtifacts: Artifact[] }) | null>(null);
  const [newProjectName, setNewProjectName] = useState("");

  function handleNewProject() {
    router.push('/projects/new');
  }

  function handleProjectClick(project: Project & { coverArtifacts: Artifact[] }) {
    // Updated to use new /p?token= route
    router.push(`/p?token=${project.share_token}`);
  }

  function handleDeleteProject(project: Project & { coverArtifacts: Artifact[] }) {
    setProjectToDelete(project);
  }

  function handleRenameProject(project: Project & { coverArtifacts: Artifact[] }) {
    setProjectToRename(project);
    setNewProjectName(project.name);
  }

  async function confirmDelete() {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      
      // Update the local data to remove the deleted project
      mutate();
      
      toast.success(`Project "${projectToDelete.name}" deleted successfully`);
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Failed to delete project. Please try again.");
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmRename() {
    if (!projectToRename || !newProjectName.trim()) return;
    
    setIsRenaming(true);
    try {
      await updateProject(projectToRename.id, { name: newProjectName.trim() });
      
      // Update the local data
      mutate();
      
      toast.success(`Project renamed to "${newProjectName.trim()}"`);
      setProjectToRename(null);
      setNewProjectName("");
    } catch (error) {
      toast.error("Failed to rename project. Please try again.");
      console.error('Error renaming project:', error);
    } finally {
      setIsRenaming(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      <AppHeader 
        mode="homepage"
        onNewProject={handleNewProject}
      />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {isLoading && <p>Loading…</p>}
          {error && <p className="text-red-600">{String(error)}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ContextMenu key={p.id}>
                <ContextMenuTrigger asChild>
                  <div>
                    <ProjectCard
                      project={p}
                      onClick={() => handleProjectClick(p)}
                      onDelete={() => handleDeleteProject(p)}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleRenameProject(p)}>
                    Rename Project
                  </ContextMenuItem>
                  <ContextMenuItem
                    variant="destructive"
                    onClick={() => handleDeleteProject(p)}
                  >
                    Delete Project
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{projectToDelete?.name}&rdquo;? This will permanently delete the project and all its pages and artifacts. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className={buttonVariants({ variant: "destructive" })}
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Rename Dialog */}
          <Dialog open={!!projectToRename} onOpenChange={(open) => !open && setProjectToRename(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Project</DialogTitle>
                <DialogDescription>
                  Enter a new name for &ldquo;{projectToRename?.name}&rdquo;
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      confirmRename();
                    }
                  }}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProjectToRename(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={confirmRename}
                  disabled={isRenaming || !newProjectName.trim()}
                >
                  {isRenaming ? "Renaming..." : "Rename"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}


