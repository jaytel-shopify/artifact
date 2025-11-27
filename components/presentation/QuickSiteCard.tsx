"use client";

import { QuickSiteRecord } from "@/lib/quick-sites";

interface QuickSiteCardProps {
  site: QuickSiteRecord;
}

export default function QuickSiteCard({ site }: QuickSiteCardProps) {
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 group"
    >
      <div className="relative aspect-[16/11] bg-primary rounded-card-inner overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-text-primary">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        </div>
      </div>
      <h3 className="text-xs font-medium text-text-primary line-clamp-1">
        {site.subdomain}
      </h3>
    </a>
  );
}
