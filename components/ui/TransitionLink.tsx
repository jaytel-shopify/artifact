"use client";

import { useCallback, type MouseEvent } from "react";
import NextLink, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useViewTransition } from "@/components/ViewTransitionHandler";

type TransitionLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: React.ReactNode;
  };

/**
 * A Link component that uses the View Transitions API for smooth page transitions.
 */
export default function TransitionLink({
  href,
  onClick,
  children,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();
  const { startTransitionNavigation } = useViewTransition();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);

      // Skip if default was prevented or modifier keys are held
      if (
        e.defaultPrevented ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      ) {
        return;
      }

      // Skip external links
      const url = typeof href === "string" ? href : href.pathname || "";
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return;
      }

      e.preventDefault();
      startTransitionNavigation(() => {
        router.push(typeof href === "string" ? href : href.pathname || "/");
      });
    },
    [href, onClick, router, startTransitionNavigation]
  );

  return (
    <NextLink href={href} onClick={handleClick} {...props}>
      {children}
    </NextLink>
  );
}
