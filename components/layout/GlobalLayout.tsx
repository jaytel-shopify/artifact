"use client";

import { ReactNode, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import { useHeader } from "./HeaderContext";
import { setCurrentPath } from "@/lib/navigation";
import DropzoneUploader from "@/components/upload/DropzoneUploader";
import { usePageTransitionRef } from "@/components/ViewTransitionHandler";

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
  const pageRef = usePageTransitionRef();

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

      <main ref={pageRef as React.RefObject<HTMLElement>} className="flex-1 min-h-0">{children}</main>

      <DropzoneUploader />
    </div>
  );
}
