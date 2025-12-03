"use client";

import Link from "@/components/ui/TransitionLink";
import { usePathname } from "next/navigation";

export default function ViewToggle() {
  const pathname = usePathname();
  const isExplore =
    pathname === "/" ||
    pathname.startsWith("/user") ||
    pathname.startsWith("/a") ||
    pathname.startsWith("/search");
  const isProjects = pathname.startsWith("/projects");

  return (
    <div className="grid grid-cols-2 grid-rows-[100%] bg-primary rounded-button p-0.5 h-10 border border-border">
      <div
        className={`button-primary rounded-button-inner col-start-1 col-span-1 row-start-1 row-span-1 transition-transform duration-500 ease-spring ${isExplore ? "translate-x-0 [&:has(~_.projects:hover)]:scale-x-106 [&:has(~_.projects:hover)]:scale-y-96 [&:has(~_.projects:hover)]:translate-x-[4%]" : "translate-x-full [&:has(~_.explore:hover)]:scale-x-106 [&:has(~_.explore:hover)]:scale-y-96 [&:has(~_.explore:hover)]:translate-x-[94%]"}`}
      ></div>
      <Link
        href="/"
        prefetch={true}
        className={`explore relative flex items-center justify-center px-3 rounded-button-inner text-small transition-colors duration-200 h-full row-start-1 row-span-1 col-start-1 ${
          isExplore ? "text-white" : "text-text-primary"
        }`}
      >
        Explore
      </Link>
      <Link
        href="/projects/"
        prefetch={true}
        className={`projects relative flex items-center justify-center px-3 rounded-button-inner text-small transition-colors duration-200 h-full row-start-1 row-span-1 col-start-2 ${
          isProjects ? "text-white" : "text-text-primary"
        }`}
      >
        Projects
      </Link>
    </div>
  );
}
