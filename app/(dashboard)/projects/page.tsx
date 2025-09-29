"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProjectsPage() {
  const router = useRouter();
  const { data, isLoading, error, mutate } = useSWR<{ projects: (Project & { coverArtifacts: Artifact[] })[] }>(
    "/api/projects/covers",
    fetcher,
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

  const projects = useMemo(() => data?.projects ?? [], [data]);

  function handleNewProject() {
    router.push('/projects/new');
  }

  function handleProjectClick(project: Project & { coverArtifacts: Artifact[] }) {
    router.push(`/presentation/${project.share_token}`);
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
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
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
      const response = await fetch(`/api/projects/${projectToRename.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to rename project');
      }
      
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


