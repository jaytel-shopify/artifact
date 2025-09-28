"use client";

import { useState } from "react";
import { ArrowLeft, PanelLeft, PanelLeftClose, ChevronDown, Share, Settings, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserAvatar from "@/components/auth/UserAvatar";
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
  
  // Homepage props
  onNewProject?: () => void;
  
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
  onNewProject,
  mode
}: AppHeaderProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  return (
    <header 
      className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)] relative z-10"
      style={{ height: 'var(--header-height)' }}
    >
      <div className="flex items-center justify-between h-full px-8">
        {/* Left Section */}
        <div className="flex items-center gap-3 w-full max-w-[var(--section-width)]">
          {mode === 'homepage' ? (
            /* Homepage: Profile + Branding */
            <>
              <UserAvatar />
              
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Artifact
                </h1>
                <span className="text-lg text-muted-foreground font-normal">
                  Projects
                </span>
              </div>
            </>
          ) : (
            /* Canvas mode: Navigation + Tools */
            <>
              {/* Back to Home Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={onBackToHome}
                aria-label="Back to home"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              {/* Sidebar Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleSidebar}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>

              {/* Separator */}
              <div className="h-6 w-px bg-border" />
              
              {/* Add Artifact Button */}
              {projectId && currentPageId && (
                <ArtifactAdder 
                  projectId={projectId} 
                  pageId={currentPageId} 
                  onAdded={onArtifactAdded} 
                />
              )}

              {/* Column Count Slider */}
              {showColumnControls && onColumnsChange && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-medium min-w-[12px]">
                      {columns}
                    </span>
                    <div className="w-24">
                      <Slider 
                        min={1} 
                        max={8} 
                        value={[columns]}
                        onValueChange={(value: number[]) => onColumnsChange(value[0] ?? columns)} 
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Center Section - Project Title (Canvas mode only) */}
        {mode === 'canvas' && projectId && (
          <div className="flex items-center justify-center w-full max-w-[var(--section-width)]">
            <EditableTitle
              initialValue={projectName || "Untitled Project"}
              projectId={projectId}
            />
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center justify-end gap-3 w-full max-w-[var(--section-width)]">
          {mode === 'canvas' ? (
            /* Canvas mode: Share & User Avatars */
            <div className="flex items-center gap-3">
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Share className="h-4 w-4" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Project</DialogTitle>
                    <DialogDescription>
                      Share this project with others (functionality coming soon)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      Share functionality will be implemented here.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Placeholder for user avatars */}
              <div className="flex items-center -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-[var(--color-background-primary)]" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-[var(--color-background-primary)]" />
              </div>
            </div>
          ) : (
            /* Homepage mode: New Project Button */
            onNewProject && (
              <Button onClick={onNewProject} className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
