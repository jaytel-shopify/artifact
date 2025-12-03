"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { supportsViewTransitions } from "@/lib/view-transitions";

const ViewTransitionContext = createContext<{
  startTransitionNavigation: (navigate: () => void) => void;
}>({
  startTransitionNavigation: (navigate) => navigate(),
});

export function useViewTransition() {
  return useContext(ViewTransitionContext);
}

/**
 * Provides view transitions for Next.js App Router.
 */
export default function ViewTransitionHandler({
  children,
}: {
  children: ReactNode;
}) {
  const startTransitionNavigation = useCallback((navigate: () => void) => {
    if (!supportsViewTransitions()) {
      navigate();
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        navigate();
      });
    });
  }, []);

  return (
    <ViewTransitionContext.Provider value={{ startTransitionNavigation }}>
      {children}
    </ViewTransitionContext.Provider>
  );
}
