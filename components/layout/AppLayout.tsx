"use client";

import { useState, useEffect, ReactNode } from "react";
import AppHeader from "./AppHeader";
import PageNavigationSidebar from "./PageNavigationSidebar";
import { Page } from "@/types";

interface AppLayoutProps {
  children: ReactNode;

  // View mode
  mode: "homepage" | "canvas" | "folder";

  // Project-specific props (for canvas mode)
  projectId?: string;
  projectName?: string;
  shareToken?: string;
  creatorEmail?: string;
  isCreator?: boolean;
  isCollaborator?: boolean;
  isReadOnly?: boolean;
  currentFolderId?: string | null;
  folders?: any[];
  onProjectNameUpdate?: (name: string) => void;
  onMoveToFolder?: (folderId: string) => void;
  onRemoveFromFolder?: () => void;
  onArtifactAdded?: () => void;

  // Folder-specific props (for folder mode)
  folderId?: string;
  folderName?: string;
  onFolderNameUpdate?: (name: string) => void;
  onFolderShare?: () => void;
  onFolderRename?: () => void;
  onFolderDelete?: () => void;
  onNewProject?: () => void;

  // Column controls
  columns?: number;
  onColumnsChange?: (columns: number) => void;
  showColumnControls?: boolean;
  fitMode?: boolean;
  onFitModeChange?: (fit: boolean) => void;

  // Page management (canvas mode)
  pages?: Page[];
  currentPageId?: string;
  onPageSelect?: (pageId: string) => void;
  onPageRename?: (pageId: string, newName: string) => Promise<void>;
  onPageCreate?: () => void;
  onPageDelete?: (pageId: string) => void;
  onPageReorder?: (reorderedPages: Page[]) => void;

  // Presentation mode
  presentationMode?: boolean;

  // Navigation
  backUrl?: string;
  onBackToHome?: () => void;

  // Sync status (for canvas mode)
  isSyncReady?: boolean;
  getUsersCount?: () => number;
  getUsers?: () => any[];
}

function AppLayout({
  children,
  mode,
  projectId,
  projectName,
  shareToken,
  creatorEmail,
  isCreator = false,
  isCollaborator = false,
  isReadOnly = false,
  currentFolderId,
  folders = [],
  backUrl,
  onProjectNameUpdate,
  onMoveToFolder,
  onRemoveFromFolder,
  onArtifactAdded,
  folderId,
  folderName,
  onFolderNameUpdate,
  onFolderShare,
  onFolderRename,
  onFolderDelete,
  onNewProject,
  columns,
  onColumnsChange,
  showColumnControls,
  fitMode,
  onFitModeChange,
  pages,
  currentPageId,
  onPageSelect,
  onPageRename,
  onPageCreate,
  onPageDelete,
  onPageReorder,
  presentationMode = false,
  onBackToHome,
  isSyncReady,
  getUsersCount,
  getUsers,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("sidebar_open");
    if (stored !== null) {
      setSidebarOpen(JSON.parse(stored));
    }
    setHydrated(true);
  }, []);

  // Persist sidebar state
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("sidebar_open", JSON.stringify(sidebarOpen));
  }, [sidebarOpen, hydrated]);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div
      className="h-screen flex flex-col bg-[var(--color-background-primary)] text-[var(--color-text-primary)]"
      style={{ fontFamily: "var(--font-family-primary)" }}
    >
      {/* Header - Hidden in presentation mode */}
      {!presentationMode && (
        <AppHeader
          mode={mode}
          projectId={projectId}
          projectName={projectName}
          shareToken={shareToken}
          creatorEmail={creatorEmail}
          isCreator={isCreator}
          isCollaborator={isCollaborator}
          isReadOnly={isReadOnly}
          currentFolderId={currentFolderId}
          folders={folders}
          folderId={folderId}
          folderName={folderName}
          backUrl={backUrl}
          onBackToHome={onBackToHome}
          onToggleSidebar={mode === "canvas" ? handleToggleSidebar : undefined}
          sidebarOpen={sidebarOpen}
          onProjectNameUpdate={onProjectNameUpdate}
          onMoveToFolder={onMoveToFolder}
          onRemoveFromFolder={onRemoveFromFolder}
          onArtifactAdded={onArtifactAdded}
          onFolderNameUpdate={onFolderNameUpdate}
          onFolderShare={onFolderShare}
          onFolderRename={onFolderRename}
          onFolderDelete={onFolderDelete}
          onNewProject={onNewProject}
          currentPageId={currentPageId}
          columns={columns}
          onColumnsChange={onColumnsChange}
          showColumnControls={showColumnControls}
          fitMode={fitMode}
          onFitModeChange={onFitModeChange}
          isSyncReady={isSyncReady}
          getUsersCount={getUsersCount}
          getUsers={getUsers}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile backdrop overlay */}
        {mode === "canvas" && sidebarOpen && !presentationMode && (
          <div
            className="fixed inset-0 bg-black/50 z-[5] lg:hidden animate-in fade-in duration-300"
            style={{
              animationTimingFunction: "var(--spring-elegant-easing-light)",
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar (Canvas mode only) - Hidden in presentation mode */}
        {mode === "canvas" && !presentationMode && (
          <div
            className={`absolute top-0 left-0 h-full z-10 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{
              transition: "transform 400ms var(--spring-elegant-easing-light)",
            }}
          >
            <PageNavigationSidebar
              isOpen={true}
              pages={pages || []}
              currentPageId={currentPageId}
              onPageSelect={onPageSelect}
              onPageRename={onPageRename}
              onPageCreate={onPageCreate}
              onPageDelete={onPageDelete}
              onPageReorder={onPageReorder}
              isReadOnly={isReadOnly}
            />
          </div>
        )}

        {/* Main Content */}
        <main
          className="flex-1 min-w-0"
          style={{
            marginLeft:
              mode === "canvas" && sidebarOpen && !presentationMode
                ? "var(--sidebar-width)"
                : "0",
            transition: "margin-left 400ms var(--spring-elegant-easing-light)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
