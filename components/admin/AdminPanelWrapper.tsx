"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AllowedUsersPanel } from "./AllowedUsersPanel";

/**
 * Wrapper component that handles admin panel visibility and keyboard shortcuts
 * Only renders for admin users
 */
export function AdminPanelWrapper() {
  const { isAdmin, loading } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Handle '/' keyboard shortcut
  useEffect(() => {
    if (!isAdmin || loading) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Check for '/' key
      if (e.key === "/") {
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
        setIsPanelOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin, loading]);

  // Don't render anything if not admin or still loading
  if (!isAdmin || loading) {
    return null;
  }

  return (
    <AllowedUsersPanel
      isOpen={isPanelOpen}
      onClose={() => setIsPanelOpen(false)}
    />
  );
}

