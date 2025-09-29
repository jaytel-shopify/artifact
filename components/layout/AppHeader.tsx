"use client";

import { useState } from "react";
import { ArrowLeft, PanelLeft, PanelLeftClose, Share, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import ArtifactAdder from "@/components/upload/ArtifactAdder";
import EditableTitle from "@/components/presentation/EditableTitle";
import { useAuth } from "@/components/auth/AuthProvider";
import UserAvatar from "@/components/auth/UserAvatar";
import { useRouter } from "next/navigation";

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
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <header 
      className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)] relative z-10"
      style={{ height: 'var(--header-height)' }}
    >
      <div className="flex items-center justify-between h-full px-8">
        {/* Left Section */}
        <div className="flex items-center gap-3 w-full max-w-[var(--section-width)]">
          {mode === 'homepage' ? (
            <div className="flex items-center gap-2">
              <img 
                src="/favicons/icon-256.png" 
                alt="Artifact"
                className="w-8 h-8"
                style={{ imageRendering: 'crisp-edges' }}
              />
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Artifact</h1>
            </div>
          ) : (
            /* Canvas mode: Navigation + Tools */
            <>
              {/* Back to Home Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={onBackToHome}
                aria-label="Back to home"
                className="group relative overflow-hidden"
              >
                <img 
                  src="/favicons/icon-256.png" 
                  alt="Back to home"
                  className="w-8 h-8 transition-all duration-200 group-hover:opacity-0 group-hover:scale-75"
                  style={{ imageRendering: 'crisp-edges' }}
                />
                <ArrowLeft className="h-4 w-4 absolute inset-0 m-auto transition-all duration-200 opacity-0 scale-125 group-hover:opacity-100 group-hover:scale-100" />
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
              onUpdated={onProjectNameUpdate}
            />
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center justify-end gap-3 w-full max-w-[var(--section-width)]">
          {mode === 'canvas' ? (
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

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2">
                      <UserAvatar />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled className="flex flex-col items-start">
                      <span className="text-sm font-medium">{user.user_metadata?.full_name ?? "Signed in"}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleSignIn} disabled={loading} className="gap-2">
                  Sign in with Google
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {onNewProject && (
                <Button onClick={onNewProject} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              )}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2">
                      <UserAvatar />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled className="flex flex-col items-start">
                      <span className="text-sm font-medium">{user.user_metadata?.full_name ?? "Signed in"}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleSignIn} disabled={loading} className="gap-2">
                  Sign in with Google
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
