"use client";

import { useState, useEffect, ReactNode } from "react";
import AppHeader from "./AppHeader";
import PageNavigationSidebar from "./PageNavigationSidebar";
import { Page } from "@/types";

interface AppLayoutProps {
  children: ReactNode;
  
  // View mode
  mode: 'homepage' | 'canvas';
  
  // Project-specific props (for canvas mode)
  projectId?: string;
  projectName?: string;
  onProjectNameUpdate?: (name: string) => void;
  onArtifactAdded?: () => void;
  
  // Column controls
  columns?: number;
  onColumnsChange?: (columns: number) => void;
  showColumnControls?: boolean;
  
  // Page management (canvas mode)
  pages?: Page[];
  currentPageId?: string;
  onPageSelect?: (pageId: string) => void;
  onPageRename?: (pageId: string, newName: string) => Promise<void>;
  onPageCreate?: () => void;
  onPageDelete?: (pageId: string) => void;
  
  // Navigation
  onBackToHome?: () => void;
}

export default function AppLayout({
  children,
  mode,
  projectId,
  projectName,
  onProjectNameUpdate,
  onArtifactAdded,
  columns,
  onColumnsChange,
  showColumnControls,
  pages,
  currentPageId,
  onPageSelect,
  onPageRename,
  onPageCreate,
  onPageDelete,
  onBackToHome
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('sidebar_open');
    if (stored !== null) {
      setSidebarOpen(JSON.parse(stored));
    }
    setHydrated(true);
  }, []);

  // Persist sidebar state
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem('sidebar_open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen, hydrated]);

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div 
      className="h-screen flex flex-col bg-[var(--color-background-primary)] text-[var(--color-text-primary)]"
      style={{ fontFamily: 'var(--font-family-primary)' }}
    >
      {/* Header */}
      <AppHeader
        mode={mode}
        onBackToHome={onBackToHome}
        onToggleSidebar={handleToggleSidebar}
        sidebarOpen={sidebarOpen}
        projectId={projectId}
        projectName={projectName}
        onProjectNameUpdate={onProjectNameUpdate}
        onArtifactAdded={onArtifactAdded}
        currentPageId={currentPageId}
        columns={columns}
        onColumnsChange={onColumnsChange}
        showColumnControls={showColumnControls}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar (Canvas mode only) */}
        {mode === 'canvas' && (
          <PageNavigationSidebar
            isOpen={sidebarOpen}
            pages={pages || []}
            currentPageId={currentPageId}
            onPageSelect={onPageSelect}
            onPageRename={onPageRename}
            onPageCreate={onPageCreate}
            onPageDelete={onPageDelete}
          />
        )}

        {/* Main Content */}
        <main 
          className="flex-1 min-w-0 transition-all duration-200 ease-in-out"
          style={{
            marginLeft: mode === 'canvas' && sidebarOpen ? '0' : '0'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
