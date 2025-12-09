"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
  type RefObject,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const FADE_MS = 200;

type TransitionContextType = {
  router: ReturnType<typeof useRouter>;
  contentRef: RefObject<HTMLElement | null>;
};

const TransitionContext = createContext<TransitionContextType | null>(null);

export const useTransitionRouter = () => {
  const ctx = useContext(TransitionContext);
  if (!ctx)
    throw new Error(
      "useTransitionRouter must be used within ViewTransitionHandler"
    );
  return ctx.router;
};

// Hook to get the ref - apply this to the element you want to fade
export const usePageTransitionRef = () => {
  const ctx = useContext(TransitionContext);
  if (!ctx)
    throw new Error(
      "usePageTransitionRef must be used within ViewTransitionHandler"
    );
  return ctx.contentRef;
};

export default function ViewTransitionHandler({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams();
  const contentRef = useRef<HTMLElement | null>(null);
  const navigating = useRef(false);
  
  // Use a ref to store the router so the click handler doesn't need to be re-attached
  const routerRef = useRef(router);
  routerRef.current = router;

  // Fade in when new page arrives
  useEffect(() => {
    if (navigating.current && contentRef.current) {
      contentRef.current.style.opacity = "0";
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.transition = `opacity ${FADE_MS}ms ease-out`;
          contentRef.current.style.opacity = "1";
        }
      });
      navigating.current = false;
    }
  }, [pathname, query]);

  // Navigate function that uses ref to avoid dependency on router
  const navigate = useCallback(
    (href: string, method: "push" | "replace" = "push") => {
      // Skip transition if navigating to the same route
      const currentPath = window.location.pathname;
      if (
        href === currentPath ||
        href === currentPath + window.location.search
      ) {
        return routerRef.current[method](href);
      }
      if (!contentRef.current) return routerRef.current[method](href);
      navigating.current = true;
      contentRef.current.style.transition = `opacity ${FADE_MS}ms ease-in`;
      contentRef.current.style.opacity = "0";
      setTimeout(() => routerRef.current[method](href), FADE_MS);
    },
    [] // No dependencies - uses refs
  );

  // Intercept link clicks - handler is stable since navigate has no dependencies
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      if (link.hasAttribute("download") || link.target === "_blank") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;
      if (e.defaultPrevented) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, [navigate]);

  // Memoize the transition router to avoid unnecessary re-renders
  const transitionRouter = useMemo(() => ({
    ...router,
    push: (href: string) => navigate(href, "push"),
    replace: (href: string) => navigate(href, "replace"),
  }), [router, navigate]);

  return (
    <TransitionContext.Provider
      value={{ router: transitionRouter, contentRef }}
    >
      {children}
    </TransitionContext.Provider>
  );
}
