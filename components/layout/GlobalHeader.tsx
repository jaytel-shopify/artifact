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
    <header className="h-header-height sticky top-0 z-10 overflow-hidden before:absolute before:inset-0 before:h-[200%] before:bg-[linear-gradient(180deg,#e4e9ebaa_49%,#e4e9eb20_49%)] before:backdrop-blur-md before:content-[''] dark:before:bg-[linear-gradient(180deg,#010b0faa_49%,#010b0f20_49%)]">
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
