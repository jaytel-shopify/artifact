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
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import AppHeader from "@/components/layout/AppHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Project } from "@/types";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data, isLoading, error, mutate } = useSWR<{ projects: Project[] }>(
    user ? "/api/projects" : null,
    fetcher
  );
  
  console.log('Homepage render - User:', user ? user.email : 'None', 'Loading:', loading);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const projects = useMemo(() => data?.projects ?? [], [data]);

  function handleNewProject() {
    router.push('/projects/new');
  }

  function handleProjectClick(project: Project) {
    router.push(`/presentation/${project.share_token}`);
  }

  function handleDeleteProject(project: Project) {
    setProjectToDelete(project);
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

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, let middleware handle redirect
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
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
                  <Card 
                    className="group hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleProjectClick(p)}
                  >
                    <CardHeader>
                      <CardTitle>{p.name}</CardTitle>
                      <CardDescription>{p.share_token}</CardDescription>
                    </CardHeader>
                    
                    <CardFooter>
                      <span className="text-sm text-gray-500">Click to open</span>
                    </CardFooter>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
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

          {/* Confirmation Dialog */}
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
        </div>
      </main>
    </div>
  );
}
