"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { createProject as createProjectDB, getProjects } from "@/lib/quick-db";

function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const hasCreatedRef = useRef(false);

  const folderId = searchParams.get("folder");

  useEffect(() => {
    async function createNewProject() {
      // Prevent double execution in React Strict Mode
      if (hasCreatedRef.current) return;
      if (!user?.email) return; // Wait for user to be loaded

      hasCreatedRef.current = true;

      try {
        // Generate unique project name
        let projectName = "Untitled Project";
        const existingProjects = await getProjects(user.email);

        if (existingProjects.length > 0) {
          // Find highest number
          const untitledProjects = existingProjects.filter((p) =>
            p.name.startsWith("Untitled Project")
          );

          if (untitledProjects.length > 0) {
            projectName = `Untitled Project ${untitledProjects.length + 1}`;
          }
        }

        // Create the project (with optional folder assignment)
        const project = await createProjectDB({
          name: projectName,
          creator_id: user.email,
          folder_id: folderId || null,
        });

        toast.success(`Created "${project.name}"`);

        // Navigate to new ID-based route
        router.push(`/p?id=${project.id}`);
      } catch (err) {
        toast.error("Failed to create project. Please try again.");
        console.error("Failed to create project:", err);
        // Redirect back to projects page on error
        router.push("/projects");
      }
    }

    createNewProject();
  }, [router, user, folderId]);

  return (
    <main className="h-screen flex items-center justify-center bg-background text-text-primary">
      <div className="text-center space-y-4">
        <div className="text-medium text-medium">Creating your project...</div>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
      </div>
    </main>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={null}>
      <NewProjectContent />
    </Suspense>
  );
}
