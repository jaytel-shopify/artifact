"use client";

import { ReactNode } from "react";
import GlobalHeader from "./GlobalHeader";
import { useHeader } from "./HeaderContext";

interface GlobalLayoutProps {
  children: ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const { headerContent } = useHeader();

  return (
    <div
      className="h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]"
      style={{ fontFamily: "var(--font-family-primary)" }}
    >
      <GlobalHeader
        left={headerContent.left}
        center={headerContent.center}
        right={headerContent.right}
      />
      <main className="flex-1 min-h-0 overflow-auto">{children}</main>
    </div>
  );
}
