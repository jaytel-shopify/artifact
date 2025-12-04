"use client";

import { ReactNode, useEffect, useState, useRef } from "react";

interface GlobalHeaderProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export default function GlobalHeader({
  left,
  center,
  right,
}: GlobalHeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show when at top
      if (currentScrollY <= 0) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up - show header
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        // Scrolling down - hide header
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="h-header-height sticky top-0 z-10 transition-transform duration-300 before:absolute before:inset-0 before:bg-[linear-gradient(180deg,color-mix(in_srgb,_var(--c-background)_66%,_transparent)_97%,color-mix(in_srgb,_var(--c-background)_12%,_transparent)_97%)] before:backdrop-blur-md before:content-['']"
      style={{ transform: isVisible ? "translateY(0)" : "translateY(-100%)" }}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Section */}
        <div className="max-w-section-width relative flex size-full items-center gap-3">
          {left}
        </div>

        {/* Center Section */}
        <div className="max-w-section-width relative flex size-full items-center justify-center gap-3">
          {center}
        </div>

        {/* Right Section */}
        <div className="max-w-section-width relative flex size-full items-center justify-end gap-3">
          {right}
        </div>
      </div>
    </header>
  );
}
