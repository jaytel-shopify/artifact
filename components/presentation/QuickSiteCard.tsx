"use client";

import { Clock } from "lucide-react";
import { QuickSiteRecord } from "@/lib/quick-sites";
import { formatTimeAgo } from "@/lib/utils";
import { Card } from "../ui/card";

interface QuickSiteCardProps {
  site: QuickSiteRecord;
}

export default function QuickSiteCard({ site }: QuickSiteCardProps) {
  return (
    <Card className="p-4 relative">
      <a
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col gap-2 group after:content-[''] after:absolute after:inset-0"
        aria-label={site.subdomain + " - " + site.description}
      >
        <h3 className="text-medium text-text-primary line-clamp-1">
          {site.subdomain}
        </h3>
        <p className="text-small text-text-secondary line-clamp-1">
          {site.description}
        </p>
        <p className="text-small text-text-secondary line-clamp-1 flex items-center gap-1 mt-4">
          <Clock className="w-3 h-3" /> {formatTimeAgo(site.lastModified)}
        </p>
      </a>
    </Card>
  );
}
