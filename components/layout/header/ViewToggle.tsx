"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ViewToggle() {
  const pathname = usePathname();
  const isExplore = pathname === "/";
  const isProjects = pathname.startsWith("/projects");

  return (
    <div className="grid grid-cols-2 grid-rows-[100%] bg-primary rounded-button p-0.5 h-10 border-[0.5px] border-border">
      <div
        className={`button-primary rounded-button-inner col-start-1 col-span-1 row-start-1 row-span-1 transition-transform duration-200 ${isExplore ? "translate-x-0" : "translate-x-full"}`}
      ></div>
      <Link
        href="/"
        className={`relative flex items-center justify-center px-3 rounded-button-inner text-small transition-colors duration-200 h-full row-start-1 row-span-1 col-start-1 ${
          isExplore ? "text-white" : "text-foreground hover:text-foreground"
        }`}
      >
        Explore
      </Link>
      <Link
        href="/projects"
        className={`relative flex items-center justify-center px-3 rounded-button-inner text-small transition-colors duration-200 h-full row-start-1 row-span-1 col-start-2 ${
          isProjects ? "text-white" : "text-foreground hover:text-foreground"
        }`}
      >
        Projects
      </Link>
    </div>
  );
}
