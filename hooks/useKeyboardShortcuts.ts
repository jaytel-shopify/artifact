import { useEffect } from "react";

interface UseKeyboardShortcutsOptions {
  // Escape key to exit focus mode
  onEscape?: () => void;
  canEscape?: boolean;

  // Presentation mode toggle (CMD/Ctrl + . or /)
  onTogglePresentationMode?: () => void;
}

/**
 * Hook to handle keyboard shortcuts for the presentation page
 */
export function useKeyboardShortcuts({
  onEscape,
  canEscape = false,
  onTogglePresentationMode,
}: UseKeyboardShortcutsOptions) {
  // Escape key handler
  useEffect(() => {
    if (!onEscape || !canEscape) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEscape, canEscape]);

  // Presentation mode toggle (CMD+. or CMD+/)
  useEffect(() => {
    if (!onTogglePresentationMode) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Check for CMD+. or CMD+/ (also support Ctrl for Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && (e.key === "." || e.key === "/")) {
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
        if (onTogglePresentationMode) {
          onTogglePresentationMode();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePresentationMode]);
}
