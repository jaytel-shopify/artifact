"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const hasCreatedRef = useRef(false);

  useEffect(() => {
    async function createProject() {
      // Prevent double execution in React Strict Mode
      if (hasCreatedRef.current) return;
      hasCreatedRef.current = true;

      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // No name provided - backend will generate default
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to create project");
        
        toast.success(`Created "${json.project.name}"`);
        router.push(`/presentation/${json.project.share_token}`);
      } catch (err) {
        toast.error("Failed to create project. Please try again.");
        console.error("Failed to create project:", err);
        // Redirect back to homepage on error
        router.push("/");
      }
    }

    createProject();
  }, [router]);

  return (
    <main className="h-screen flex items-center justify-center bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      <div className="text-center space-y-4">
        <div className="text-lg font-medium">Creating your project...</div>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
      </div>
    </main>
  );
}


