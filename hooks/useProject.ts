"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { getProjectById, updateProject, deleteProject } from "@/lib/quick-db";
import type { Project } from "@/types";

/**
 * Fetcher function for SWR
 */
async function fetcher(id: string): Promise<Project | null> {
  return await getProjectById(id);
}

/**
 * Hook to manage a single project
 */
export function useProject(projectId: string | undefined) {
  const { data: project, error, isLoading, mutate } = useSWR<Project | null>(
    projectId ? `project-${projectId}` : null,
    () => (projectId ? fetcher(projectId) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Cache for 5 seconds
    }
  );

  /**
   * Update the project name
   */
  const updateProjectName = useCallback(
    async (name: string) => {
      if (!projectId) return;
      
      try {
        await updateProject(projectId, { name });
        await mutate(); // Revalidate
      } catch (error) {
        console.error("Failed to update project name:", error);
        throw error;
      }
    },
    [projectId, mutate]
  );

  /**
   * Delete the project
   */
  const deleteProjectById = useCallback(async () => {
    if (!projectId) return;
    
    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  }, [projectId]);

  return {
    project,
    isLoading,
    error,
    updateProjectName,
    deleteProject: deleteProjectById,
    refetch: mutate,
  };
}


