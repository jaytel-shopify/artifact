"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * AnimatedPageWrapper
 * 
 * Wraps the entire app with AnimatePresence for smooth page transitions.
 * Must be a separate client component since layout.tsx exports metadata.
 */
export default function AnimatedPageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={pathname}>
        {children}
      </div>
    </AnimatePresence>
  );
}

