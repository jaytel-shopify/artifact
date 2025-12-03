"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useViewTransition } from "@/components/ViewTransitionHandler";

/**
 * A router hook that wraps navigation with view transitions.
 */
export function useTransitionRouter() {
  const router = useRouter();
  const { startTransitionNavigation } = useViewTransition();

  return useMemo(
    () => ({
      ...router,
      push: (href: string) => {
        startTransitionNavigation(() => router.push(href));
      },
      replace: (href: string) => {
        startTransitionNavigation(() => router.replace(href));
      },
    }),
    [router, startTransitionNavigation]
  );
}
