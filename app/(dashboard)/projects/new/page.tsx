"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { createProject as createProjectDB, getProjects } from "@/lib/quick-db";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const hasCreatedRef = useRef(false);

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
          const untitledProjects = existingProjects.filter(p => 
            p.name.startsWith("Untitled Project")
          );
          
          if (untitledProjects.length > 0) {
            projectName = `Untitled Project ${untitledProjects.length + 1}`;
          }
        }
        
        // Generate unique share token
        const shareToken = nanoid();
        
        // Create the project
        const project = await createProjectDB({
          name: projectName,
          creator_id: user.email,
          share_token: shareToken,
        });
        
        toast.success(`Created "${project.name}"`);
        
        // Navigate to new route format
        router.push(`/p?token=${project.share_token}`);
      } catch (err) {
        toast.error("Failed to create project. Please try again.");
        console.error("Failed to create project:", err);
        // Redirect back to projects page on error
        router.push("/projects");
      }
    }

    createNewProject();
  }, [router, user]);

  return (
    <main className="h-screen flex items-center justify-center bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      <div className="text-center space-y-4">
        <div className="text-lg font-medium">Creating your project...</div>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
      </div>
    </main>
  );
}


