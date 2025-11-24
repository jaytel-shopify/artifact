"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ViewToggle() {
  const pathname = usePathname();
  const isExplore = pathname === "/";
  const isProjects = pathname === "/projects";

  return (
    <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-lg p-1">
      <Link
        href="/"
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isExplore
            ? "bg-[var(--background)] text-[var(--foreground)]"
            : "text-[var(--secondary-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        Explore
      </Link>
      <Link
        href="/projects"
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isProjects
            ? "bg-[var(--background)] text-[var(--foreground)]"
            : "text-[var(--secondary-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        Projects
      </Link>
    </div>
  );
}
