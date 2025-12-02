"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import { useHeader } from "./HeaderContext";
import { setCurrentPath } from "@/lib/navigation";
import DropzoneUploader from "@/components/upload/DropzoneUploader";

interface GlobalLayoutProps {
  children: ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const { headerContent } = useHeader();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track current path globally
  useEffect(() => {
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    setCurrentPath(fullPath);
  }, [pathname, searchParams]);

  return (
    <div
      className="min-h-screen flex flex-col bg-background text-text-primary"
      style={{ fontFamily: "var(--font-family-primary)" }}
    >
      <GlobalHeader
        left={headerContent.left}
        center={headerContent.center}
        right={headerContent.right}
      />

      <main className="flex-1 min-h-0">{children}</main>
      <DropzoneUploader
        onFiles={(files) => {
          console.log(files);
        }}
        onUrl={(url) => {
          console.log(url);
        }}
        onDragStateChange={(dragging) => {
          console.log(dragging);
        }}
      />
    </div>
  );
}
