"use client";

import { ReactNode } from "react";
import GlobalHeader from "./GlobalHeader";
import { useHeader } from "./HeaderContext";
import DropzoneUploader from "@/components/upload/DropzoneUploader";

interface GlobalLayoutProps {
  children: ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const { headerContent } = useHeader();

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
