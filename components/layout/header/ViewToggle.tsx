"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ViewToggle() {
  const pathname = usePathname();
  const isExplore = pathname === "/";
  const isProjects = pathname === "/projects";

  return (
    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
      <Link
        href="/"
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isExplore
            ? "bg-background text-foreground"
            : "text-[var(--secondary-foreground)] hover:text-foreground"
        }`}
      >
        Explore
      </Link>
      <Link
        href="/projects"
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isProjects
            ? "bg-background text-foreground"
            : "text-[var(--secondary-foreground)] hover:text-foreground"
        }`}
      >
        Projects
      </Link>
    </div>
  );
}
