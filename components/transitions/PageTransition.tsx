"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

/**
 * PageTransition
 * 
 * Simple, minimal fade transition for page content.
 * Only animates once content is loaded - never delays user experience.
 * Uses simple ease-out for smooth, professional feel.
 */
export default function PageTransition({ children, isLoading = false }: PageTransitionProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Only show content once it's loaded
    if (!isLoading) {
      setShouldRender(true);
    }
  }, [isLoading]);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // If still loading, don't render anything (no flicker)
  if (isLoading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: shouldRender ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: "easeInOut", // Smooth ease in and out
      }}
      style={{ width: "100%", height: "100%" }}
    >
      {children}
    </motion.div>
  );
}

