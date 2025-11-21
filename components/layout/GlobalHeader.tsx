"use client";

import { ReactNode } from "react";

interface GlobalHeaderProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export default function GlobalHeader({ left, center, right }: GlobalHeaderProps) {
  return (
    <header
      className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)] relative z-10"
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex items-center justify-between h-full px-8">
        {/* Left Section */}
        <div className="flex items-center gap-3 w-full max-w-[var(--section-width)]">
          {left}
        </div>

        {/* Center Section */}
        <div className="flex items-center justify-center w-full max-w-[var(--section-width)]">
          {center}
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-3 w-full max-w-[var(--section-width)]">
          {right}
        </div>
      </div>
    </header>
  );
}

