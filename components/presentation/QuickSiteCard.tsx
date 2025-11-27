"use client";

import { QuickSiteRecord } from "@/lib/quick-sites";
import { Card } from "../ui/card";


interface QuickSiteCardProps {
  site: QuickSiteRecord;
}

export default function QuickSiteCard({ site }: QuickSiteCardProps) {
  return (
    <Card className="p-4">
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 group"
    >
      <h3 className="text-medium text-text-primary line-clamp-1">
        {site.subdomain}
      </h3>
      <p className="text-small text-text-secondary line-clamp-1">
        {site.description}
      </p>
      <p className="text-small text-text-secondary line-clamp-1">
        {site.lastModified}
      </p>
    </a>
    </Card>
  );
}
