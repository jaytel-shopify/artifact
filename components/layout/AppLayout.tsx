"use client";

import { ReactNode, useEffect } from "react";
import AppHeader from "./AppHeader";
import PageNavigationSidebar from "./PageNavigationSidebar";
import { useAppShell } from "./AppShellProvider";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { config, sidebarOpen, setSidebarOpen } = useAppShell();
  const mode = config.mode ?? "homepage";
  const pageSidebar = config.pageSidebar;
  const isCanvasMode = mode === "canvas";

  useEffect(() => {
    if (!isCanvasMode && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isCanvasMode, sidebarOpen, setSidebarOpen]);

  return (
    <div
      className="h-screen flex flex-col bg-[var(--color-background-primary)] text-[var(--color-text-primary)]"
      style={{ fontFamily: "var(--font-family-primary)" }}
    >
      <AppHeader />

      <div className="flex flex-1 min-h-0 relative">
        {isCanvasMode && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[5] lg:hidden animate-in fade-in duration-300"
            style={{
              animationTimingFunction: "var(--spring-elegant-easing-light)",
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {isCanvasMode && (
          <div
            className={`absolute top-0 left-0 h-full z-10 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{
              transition: "transform 400ms var(--spring-elegant-easing-light)",
            }}
          >
            <PageNavigationSidebar
              pages={pageSidebar?.pages || []}
              currentPageId={pageSidebar?.currentPageId}
              onPageSelect={pageSidebar?.onPageSelect}
              onPageRename={pageSidebar?.onPageRename}
              onPageCreate={pageSidebar?.onPageCreate}
              onPageDelete={pageSidebar?.onPageDelete}
              isReadOnly={pageSidebar?.isReadOnly}
            />
          </div>
        )}

        <main
          className="flex-1 min-w-0"
          style={{
            marginLeft:
              isCanvasMode && sidebarOpen ? "var(--sidebar-width)" : "0",
            transition: "margin-left 400ms var(--spring-elegant-easing-light)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
