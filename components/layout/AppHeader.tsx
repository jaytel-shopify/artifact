"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/Slider";
import ArtifactAdder from "@/components/upload/ArtifactAdder";
import EditableTitle from "@/components/presentation/EditableTitle";

interface AppHeaderProps {
  // Navigation props
  onBackToHome?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  
  // Project-specific props (for canvas view)
  projectId?: string;
  projectName?: string;
  onProjectNameUpdate?: (name: string) => void;
  onArtifactAdded?: () => void;
  currentPageId?: string;
  
  // Column controls
  columns?: number;
  onColumnsChange?: (columns: number) => void;
  showColumnControls?: boolean;
  
  // View mode
  mode: 'homepage' | 'canvas';
}

export default function AppHeader({
  onBackToHome,
  onToggleSidebar,
  sidebarOpen,
  projectId,
  projectName,
  onProjectNameUpdate,
  onArtifactAdded,
  currentPageId,
  columns = 3,
  onColumnsChange,
  showColumnControls = true,
  mode
}: AppHeaderProps) {
  return (
    <header 
      className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)] relative z-10"
      style={{ height: 'var(--header-height)' }}
    >
      <div className="flex items-center justify-between h-full px-[var(--spacing-2xl)]">
        {/* Left Section */}
        <div className="flex items-center gap-[var(--spacing-md)] w-full max-w-[var(--section-width)]">
          {/* Back to Home Button */}
          <button
            onClick={onBackToHome}
            className="flex items-center justify-center p-[var(--spacing-md)] rounded-[var(--radius-sm)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors"
            aria-label="Back to home"
          >
            <span className="text-[var(--color-text-primary)]">←</span>
          </button>

          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center p-[var(--spacing-md)] rounded-[var(--radius-sm)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <span className="text-[var(--color-text-primary)]">☰</span>
          </button>

          {mode === 'canvas' && (
            <>
              {/* Add Artifact Button */}
              {projectId && currentPageId && (
                <div className="flex items-center">
                  <ArtifactAdder 
                    projectId={projectId} 
                    pageId={currentPageId} 
                    onAdded={onArtifactAdded} 
                  />
                </div>
              )}

              {/* Column Count Slider */}
              {showColumnControls && onColumnsChange && (
                <div className="flex items-center gap-[var(--spacing-md)] pl-[var(--spacing-lg)]">
                  <span 
                    className="text-[var(--color-text-secondary)] font-[var(--font-weight-normal)]"
                    style={{ fontSize: 'var(--font-size-xs)' }}
                  >
                    {columns}
                  </span>
                  <div className="w-32">
                    <Slider 
                      min={1} 
                      max={8} 
                      value={columns} 
                      onChange={onColumnsChange} 
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Center Section - Project Title */}
        <div className="flex items-center justify-center w-full max-w-[var(--section-width)]">
          {mode === 'canvas' && projectId ? (
            <EditableTitle
              initialValue={projectName || "Untitled Project"}
              projectId={projectId}
              onUpdated={onProjectNameUpdate}
            />
          ) : (
            <h1 
              className="text-[var(--color-text-primary)] font-[var(--font-weight-normal)]"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              {mode === 'homepage' ? 'Projects' : 'Artifact'}
            </h1>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center justify-end gap-[var(--spacing-xl)] w-full max-w-[var(--section-width)]">
          {/* Share Button & User Avatars (Canvas mode only) */}
          {mode === 'canvas' && (
            <div className="flex items-center gap-[var(--spacing-sm)]">
              <button
                className="px-[var(--spacing-lg)] py-[var(--spacing-md)] rounded-[var(--radius-sm)] border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] transition-colors font-[var(--font-weight-normal)]"
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                Share
              </button>

              {/* Placeholder for user avatars */}
              <div className="flex items-center -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-[var(--color-background-primary)]" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-[var(--color-background-primary)]" />
              </div>
            </div>
          )}

          {/* User Profile & Settings */}
          <div className="flex items-center gap-[var(--spacing-sm)]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400" />
            <button
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Settings"
            >
              ⌄
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
