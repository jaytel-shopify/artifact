"use client";

import { useEffect, useState } from "react";
import { useTransitionRouter } from "@/hooks/useTransitionRouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

interface DevDebugPanelProps {
  isReadOnly: boolean;
  onToggleReadOnly: (value: boolean) => void;
  projectInfo?: {
    id: string;
    name: string;
    creator_id: string; // User.id (UUID)
  };
  userEmail?: string;
  userId?: string; // User.id (UUID) for comparison with creator_id
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
  userId,
}: DevDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useTransitionRouter();

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
              <Bug className="h-5 w-5 text-text-primary" />
              Dev Debug Panel
            </DialogTitle>
            <DialogDescription>
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-small font-mono">
                /
              </kbd>{" "}
              to toggle this panel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Permission Testing */}
            <div className="space-y-3">
              <h3 className="text-small ">Permission Testing</h3>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="space-y-1">
                  <div className="text-medium">
                    Simulate Read-Only Mode
                  </div>
                  <div className="text-small text-text-secondary">
                    Test the viewer experience without logging into a different
                    account
                  </div>
                </div>
                <Switch
                  checked={isReadOnly}
                  onCheckedChange={onToggleReadOnly}
                />
              </div>

              {isReadOnly && (
                <div className="bg-primary/10 border border-primary/20 p-3 rounded text-small text-text-text-primary">
                  🔒 Read-only mode active: All edit controls are hidden
                </div>
              )}
            </div>

            {/* Current User Info */}
            <div className="space-y-3">
              <h3 className="text-small ">Current User</h3>
              <div className="bg-secondary p-3 rounded-lg space-y-1">
                <div className="text-small font-mono text-text-secondary">
                  Email:
                </div>
                <div className="text-medium">
                  {userEmail || "Not loaded"}
                </div>
              </div>
            </div>

            {/* Project Info */}
            {projectInfo && (
              <div className="space-y-3">
                <h3 className="text-small ">Project Info</h3>
                <div className="bg-secondary p-3 rounded-lg space-y-2 text-small">
                  <div>
                    <span className="text-text-secondary">ID:</span>{" "}
                    <span className="font-mono">{projectInfo.id}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Name:</span>{" "}
                    <span className="text-medium">{projectInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Owner (User ID):</span>{" "}
                    <span className="font-mono text-small">
                      {projectInfo.creator_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Is Creator:</span>{" "}
                    <span
                      className={
                        projectInfo.creator_id === userId
                          ? "text-text-primary text-medium"
                          : "text-text-primary"
                      }
                    >
                      {projectInfo.creator_id === userId ? "Yes ✓" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-small text-text-secondary border-t pt-4 space-y-2">
              <p className="text-medium">Keyboard Shortcuts:</p>
              <ul className="space-y-1 ml-2">
                <li>
                  <kbd className="px-1 py-0.5 bg-secondary rounded font-mono">
                    /
                  </kbd>{" "}
                  - Toggle this debug panel
                </li>
                <li>
                  <kbd className="px-1 py-0.5 bg-secondary rounded font-mono">
                    ESC
                  </kbd>{" "}
                  - Close this panel
                </li>
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
