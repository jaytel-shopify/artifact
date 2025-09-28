"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  useEffect(() => {
    // This route redirects to the project presentation
    // We don't have a separate project detail page
    async function redirectToPresentation() {
      const { id } = await params;
      
      try {
        // Get project share token from ID
        const response = await fetch(`/api/projects/${id}`);
        if (response.ok) {
          const { project } = await response.json();
          router.replace(`/presentation/${project.share_token}`);
        } else {
          // Project not found or no access, redirect to projects list
          router.replace('/projects');
        }
      } catch {
        // Error occurred, redirect to projects list
        router.replace('/projects');
      }
    }

    redirectToPresentation();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}
