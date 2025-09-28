"use client";

import useSWR from "swr";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import type { Project } from "@/types";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProjectsPage() {
  const { data, isLoading, error, mutate } = useSWR<{ projects: Project[] }>(
    "/api/projects",
    fetcher
  );
  
  const [isDeleting, setIsDeleting] = useState(false);

  const projects = useMemo(() => data?.projects ?? [], [data]);

  async function confirmDelete(project: Project) {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      // Update the local data to remove the deleted project
      mutate();
      
      toast.success(`Project "${project.name}" deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete project. Please try again.");
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link
          href="/projects/new"
          className="inline-flex items-center px-3 py-2 rounded-md bg-black text-white hover:bg-gray-800"
        >
          New Project
        </Link>
      </header>

      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-600">{String(error)}</p>}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <li key={p.id} className="border rounded-md p-4 group relative hover:shadow-md transition-shadow">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium"
                  title="Delete project"
                >
                  ✕
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{p.name}"? This will permanently delete the project and all its pages and artifacts. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={() => confirmDelete(p)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="font-medium pr-8">{p.name}</div>
            <div className="text-sm text-gray-500 mt-1">{p.share_token}</div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/presentation/${p.share_token}`}
                className="text-blue-600 hover:underline"
              >
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}


