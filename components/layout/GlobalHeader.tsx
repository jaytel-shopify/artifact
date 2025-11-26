"use client";

import { ReactNode } from "react";

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
  return (
    <header className="sticky top-0 z-10 h-header-height before:content-[''] before:absolute before:inset-0 before:h-[200%] overflow-hidden before:bg-[linear-gradient(180deg,#f2f2f2aa_49%,#f2f2f220_49%)] dark:before:bg-[linear-gradient(180deg,#111111aa_49%,#11111120_49%)] before:backdrop-blur-md">
      <div className="flex items-center justify-between h-full px-8">
        {/* Left Section */}
        <div className="relative flex items-center gap-3 size-full max-w-section-width">
          {left}
        </div>

        {/* Center Section */}
        <div className="relative flex items-center justify-center size-full max-w-section-width">
          {center}
        </div>

        {/* Right Section */}
        <div className="relative flex items-center justify-end gap-3 size-full max-w-section-width">
          {right}
        </div>
      </div>
    </header>
  );
}
