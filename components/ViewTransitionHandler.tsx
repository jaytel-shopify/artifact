"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type RefObject,
} from "react";
import { useRouter, usePathname } from "next/navigation";

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
  const contentRef = useRef<HTMLElement | null>(null);
  const navigating = useRef(false);

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
  }, [pathname]);

  const navigate = useCallback(
    (href: string, method: "push" | "replace" = "push") => {
      if (!contentRef.current) return router[method](href);
      navigating.current = true;
      contentRef.current.style.transition = `opacity ${FADE_MS}ms ease-in`;
      contentRef.current.style.opacity = "0";
      setTimeout(() => router[method](href), FADE_MS);
    },
    [router]
  );

  // Intercept link clicks
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

  const transitionRouter = {
    ...router,
    push: (href: string) => navigate(href, "push"),
    replace: (href: string) => navigate(href, "replace"),
  };

  return (
    <TransitionContext.Provider
      value={{ router: transitionRouter, contentRef }}
    >
      {children}
    </TransitionContext.Provider>
  );
}
