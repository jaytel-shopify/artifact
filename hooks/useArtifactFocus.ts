import { useState, useCallback } from "react";
import { flushSync } from "react-dom";

interface ViewState {
  columns: number;
  fitMode: boolean;
  scrollLeft: number;
}

/**
 * Hook to manage artifact focus mode
 * Saves and restores view state when focusing/unfocusing artifacts
 */
export function useArtifactFocus(
  columns: number,
  setColumns: (c: number) => void,
  setFitMode: (f: boolean) => void
) {
  const [focusedArtifactId, setFocusedArtifactId] = useState<string | null>(
    null
  );
  const [previousViewState, setPreviousViewState] = useState<ViewState | null>(
    null
  );

  const focusArtifact = useCallback(
    (artifactId: string) => {
      // Save current view state before focusing
      const container = document.querySelector(
        ".carousel-horizontal"
      ) as HTMLElement;
      setPreviousViewState({
        columns,
        fitMode: columns === 1,
        scrollLeft: container?.scrollLeft || 0,
      });

      // Enter focus mode (1 column, fit mode)
      flushSync(() => {
        setColumns(1);
        setFitMode(true);
      });

      setFocusedArtifactId(artifactId);
    },
    [columns, setColumns, setFitMode]
  );

  const unfocusArtifact = useCallback(() => {
    if (previousViewState) {
      const savedScrollLeft = previousViewState.scrollLeft;

      flushSync(() => {
        setColumns(previousViewState.columns);
        setFitMode(previousViewState.fitMode);
      });

      // Restore scroll position instantly (disable smooth scrolling temporarily)
      const container = document.querySelector(
        ".carousel-horizontal"
      ) as HTMLElement;
      if (container) {
        const originalScrollBehavior = container.style.scrollBehavior;
        container.style.scrollBehavior = "auto";
        container.scrollLeft = savedScrollLeft;
        container.style.scrollBehavior = originalScrollBehavior;
      }

      setPreviousViewState(null);
      setFocusedArtifactId(null);
    } else {
      // No previous state, default to 3 columns
      flushSync(() => {
        setColumns(3);
        setFitMode(false);
      });
      setFocusedArtifactId(null);
    }
  }, [previousViewState, setColumns, setFitMode]);

  return {
    focusedArtifactId,
    focusArtifact,
    unfocusArtifact,
  };
}
