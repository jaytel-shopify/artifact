"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Plus, MoreHorizontal, ExternalLink, Trash2, Share2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import type { Project } from "@/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch');
    throw error;
  }
  return res.json();
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data, isLoading, error, mutate } = useSWR<{ projects: Project[] }>(
    user ? "/api/projects" : null,
    fetcher
  );
  
  console.log('[HomePage] Render - User:', user ? user.email : 'None', 'Loading:', loading, 'Data loading:', isLoading);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const projects = useMemo(() => data?.projects ?? [], [data]);

  useEffect(() => {
    // Only check auth after loading is complete
    if (!loading && !user) {
      console.log('[HomePage] No user after loading, redirecting to login');
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  const handleNewProject = useCallback(() => {
    router.push("/projects/new");
  }, [router]);

  const handleProjectClick = useCallback((shareToken: string) => {
    router.push(`/presentation/${shareToken}`);
  }, [router]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      await mutate();
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [projectToDelete, mutate]);

  const handleShareToggle = useCallback(async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/projects/${project.id}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle sharing');
      }

      const { project: updatedProject } = await response.json();
      
      await mutate();

      if (updatedProject.is_shared) {
        const shareUrl = `${window.location.origin}/presentation/${updatedProject.share_token}`;
        await navigator.clipboard.writeText(shareUrl);
        alert(`Project is now shared! Link copied to clipboard:\n${shareUrl}`);
      } else {
        alert('Project is now private.');
      }
    } catch (error) {
      console.error('Error toggling share:', error);
      alert('Failed to toggle sharing. Please try again.');
    }
  }, [mutate]);

  // Show loading state while checking auth
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error('[HomePage] Error fetching projects:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
        <div className="text-center space-y-4">
          <p className="text-white">Failed to load projects</p>
          <Button onClick={() => mutate()}>Retry</Button>
          <div className="pt-4">
            <a href="/auth/debug" className="text-xs text-gray-400 hover:underline">
              Debug Auth Issues
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-primary)]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My Projects</h1>
          <Button onClick={handleNewProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </header>

      {/* Projects Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Plus className="h-8 w-8 text-white/40" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
            <p className="text-gray-400 mb-6">Create your first project to get started</p>
            <Button onClick={handleNewProject}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.share_token)}
                className="group relative bg-[var(--color-background-secondary)] rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer overflow-hidden"
              >
                {/* Project Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-blue-500/10 to-purple-500/10 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/20">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleProjectClick(project.share_token)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleShareToggle(e, project)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          {project.is_shared ? 'Make Private' : 'Share'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => handleDeleteClick(e, project)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Share indicator */}
                  {project.is_shared && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                      <Share2 className="h-3 w-3" />
                      Shared
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-background-secondary)] rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Project?</h2>
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete &ldquo;{projectToDelete.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}