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
    const fullPath =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    setCurrentPath(fullPath);
  }, [pathname, searchParams]);

  function handleFileUpload(files: File[]) {
    console.log(files);
    switch (pathname) {
      case "/projects/":
        // upload to currentproject
        // select page
        break;
      case "/folder/":
        // select project
        // select page
        break;
      case "/p/":
        // upload to current project, current page
        break;
      default:
      // upload public
    }
  }

  function handleUrlAdd(url: string) {
    console.log(url);
  }

  function handlePaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData("text/plain");
    if (text) {
      handleUrlAdd(text);
    } else {
      const files = e.clipboardData?.files;
      if (files) {
        handleFileUpload(Array.from(files));
      }
    }
  }

  useEffect(() => {
    window.removeEventListener("paste", handlePaste);
    window.addEventListener("paste", handlePaste);
  }, []);

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
          handleFileUpload(files);
        }}
        onUrl={(url) => {
          handleUrlAdd(url);
        }}
      />
    </div>
  );
}
