"use client";

import type { Artifact } from "@/types";
import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface FeedCardProps {
  artifact: Artifact;
  tabIndex?: number;
}

export default function FeedCard({ artifact, tabIndex }: FeedCardProps) {
  return (
    <Card className="rounded-card relative grid h-fit cursor-pointer overflow-hidden focus-within:ring-[3px]">
      <ArtifactThumbnail
        artifact={artifact}
        className="col-span-1 col-start-1 row-span-2 row-start-1 w-full"
      />

      <div className="from-background/80 col-span-1 col-start-1 row-start-2 bg-gradient-to-t to-transparent p-2 opacity-0 transition-opacity duration-300 hover:opacity-100 md:p-4">
        <Link
          href={`/a/?id=${artifact.id}`}
          className="after:absolute after:inset-0 after:content-['']"
          tabIndex={tabIndex}
        >
          <h3 className="text-medium text-text-primary line-clamp-1 overflow-ellipsis">
            {artifact.name}
          </h3>
          <p className="text-small text-text-secondary overflow-ellipsis">
            {artifact.type}
          </p>
        </Link>
      </div>
    </Card>
  );
}

