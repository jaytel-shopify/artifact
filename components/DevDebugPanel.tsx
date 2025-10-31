"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bug, Database } from "lucide-react";

interface DevDebugPanelProps {
  isReadOnly: boolean;
  onToggleReadOnly: (value: boolean) => void;
  projectInfo?: {
    id: string;
    name: string;
    creator_id: string;
    share_token: string;
  };
  userEmail?: string;
}

/**
 * DevDebugPanel
 * 
 * Developer debug panel for testing different view modes.
 * Triggered by pressing '/' key anywhere.
 * 
 * Features:
 * - Toggle read-only mode (simulate being a viewer)
 * - Show project info
 * - Show current user
 * - Test different permission states
 */
export default function DevDebugPanel({
  isReadOnly,
  onToggleReadOnly,
  projectInfo,
  userEmail,
}: DevDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Press '/' to toggle debug panel
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <>
      {/* Debug Panel Dialog - Triggered only by '/' key */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-purple-600" />
              Dev Debug Panel
            </DialogTitle>
            <DialogDescription>
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">/</kbd> to toggle this panel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Permission Testing */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Permission Testing</h3>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Simulate Read-Only Mode</div>
                  <div className="text-xs text-muted-foreground">
                    Test the viewer experience without logging into a different account
                  </div>
                </div>
                <Switch
                  checked={isReadOnly}
                  onCheckedChange={onToggleReadOnly}
                />
              </div>

              {isReadOnly && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded text-sm text-blue-600">
                  🔒 Read-only mode active: All edit controls are hidden
                </div>
              )}
            </div>

            {/* Database Visualizer - Only for jaytel */}
            {userEmail === "jaytel.provence@shopify.com" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Admin Tools</h3>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/database");
                  }}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <Database className="h-4 w-4" />
                  Database Visualizer
                </Button>
                <p className="text-xs text-muted-foreground">
                  Explore all Quick.db collections and their relationships
                </p>
              </div>
            )}

            {/* Current User Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Current User</h3>
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <div className="text-xs font-mono text-muted-foreground">Email:</div>
                <div className="text-sm font-medium">{userEmail || "Not loaded"}</div>
              </div>
            </div>

            {/* Project Info */}
            {projectInfo && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Project Info</h3>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">ID:</span>{" "}
                    <span className="font-mono">{projectInfo.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium">{projectInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Owner:</span>{" "}
                    <span className="font-medium">{projectInfo.creator_id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Share Token:</span>{" "}
                    <span className="font-mono">{projectInfo.share_token}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Is Creator:</span>{" "}
                    <span className={projectInfo.creator_id === userEmail ? "text-green-600 font-medium" : "text-orange-600"}>
                      {projectInfo.creator_id === userEmail ? "Yes ✓" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-muted-foreground border-t pt-4 space-y-2">
              <p className="font-medium">Keyboard Shortcuts:</p>
              <ul className="space-y-1 ml-2">
                <li><kbd className="px-1 py-0.5 bg-muted rounded font-mono">/</kbd> - Toggle this debug panel</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded font-mono">ESC</kbd> - Close this panel</li>
              </ul>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onToggleReadOnly(false);
                  setIsOpen(false);
                }}
              >
                Reset & Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

