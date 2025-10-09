"use client";

import { AnimatePresence } from "framer-motion";
import { useHashRouter } from "@/components/Router";

/**
 * AnimatedPageWrapper
 * 
 * Wraps the entire app with AnimatePresence for smooth page transitions.
 * Must be a separate client component since layout.tsx exports metadata.
 */
export default function AnimatedPageWrapper({ children }: { children: React.ReactNode }) {
  const { hash } = useHashRouter();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={hash}>
        {children}
      </div>
    </AnimatePresence>
  );
}

