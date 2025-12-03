import { useEffect } from "react";

interface UseKeyboardShortcutsOptions {
  onEscape?: () => void;
  canEscape?: boolean;
  onTogglePresentationMode?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}

/** Check if event target is an editable field */
function isEditableTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement;
  return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
}

/**
 * Hook to handle keyboard shortcuts for the presentation page
 */
export function useKeyboardShortcuts({
  onEscape,
  canEscape = false,
  onTogglePresentationMode,
  onArrowLeft,
  onArrowRight,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Escape
      if (e.key === "Escape" && canEscape && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Skip if typing in input
      if (isEditableTarget(e)) return;

      // Presentation mode toggle (CMD+. or CMD+/)
      if ((e.metaKey || e.ctrlKey) && (e.key === "." || e.key === "/") && onTogglePresentationMode) {
        e.preventDefault();
        onTogglePresentationMode();
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowLeft" && onArrowLeft) {
        e.preventDefault();
        onArrowLeft();
      } else if (e.key === "ArrowRight" && onArrowRight) {
        e.preventDefault();
        onArrowRight();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEscape, canEscape, onTogglePresentationMode, onArrowLeft, onArrowRight]);
}
