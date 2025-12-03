"use client";

import { ReactNode, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import { useHeader } from "./HeaderContext";
import { setCurrentPath } from "@/lib/navigation";
import DropzoneUploader from "@/components/upload/DropzoneUploader";
import { usePublicArtifacts } from "@/hooks/usePublicArtifacts";
import { useArtifactUpload } from "@/hooks/useArtifactUpload";
import type { Artifact } from "@/types";

interface GlobalLayoutProps {
  children: ReactNode;
}

// Separate component for path tracking that uses useSearchParams
// This prevents the header from suspending during navigation
function PathTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fullPath =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    setCurrentPath(fullPath);
  }, [pathname, searchParams]);

  return null;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const { headerContent } = useHeader();
  const searchParams = useSearchParams();

  const { addArtifact } = usePublicArtifacts();

  // Handle artifact creation - add to public feed optimistically
  const handleArtifactCreated = (artifact: Artifact) => {
    addArtifact(artifact);
  };

  // Use upload hook for global drag/drop and paste uploads
  const { handleFileUpload, handleUrlUpload } = useArtifactUpload({
    onArtifactCreated: handleArtifactCreated,
  });

  // Get current project context from URL if on project page
  const getUploadContext = () => {
    const projectId = searchParams?.get("id");
    const pageId = searchParams?.get("page");
    if (projectId && pageId) {
      return { projectId, pageId };
    }
    return undefined;
  };

  function handleGlobalFileUpload(files: File[]) {
    const context = getUploadContext();
    handleFileUpload(files, context);
  }

  function handleGlobalUrlAdd(url: string) {
    const context = getUploadContext();
    handleUrlUpload(url, undefined, context);
  }

  function handlePaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData("text/plain");
    if (text) {
      // Check if it looks like a URL
      try {
        new URL(text);
        handleGlobalUrlAdd(text);
      } catch {
        // Not a valid URL, ignore
      }
    } else {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        handleGlobalFileUpload(Array.from(files));
      }
    }
  }

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-background text-text-primary"
      style={{ fontFamily: "var(--font-family-primary)" }}
    >
      {/* Path tracker wrapped in Suspense so it doesn't block the header */}
      <Suspense fallback={null}>
        <PathTracker />
      </Suspense>

      <GlobalHeader
        left={headerContent.left}
        center={headerContent.center}
        right={headerContent.right}
      />

      <main className="flex-1 min-h-0">{children}</main>
      <DropzoneUploader
        onFiles={handleGlobalFileUpload}
        onUrl={handleGlobalUrlAdd}
      />
    </div>
  );
}
