"use client";

import type { Artifact } from "@/types";
import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import Link from "next/link";

interface FeedCardProps {
  artifact: Artifact;
  tabIndex?: number;
}

export default function FeedCard({ artifact, tabIndex }: FeedCardProps) {
  return (
    <div className="rounded-card relative grid h-fit cursor-pointer overflow-hidden border border-border">
      <ArtifactThumbnail
        artifact={artifact}
        className="col-span-1 col-start-1 row-span-2 row-start-1 w-full rounded-card"
      />

      <div className="col-span-1 col-start-1 row-start-2 p-2 opacity-0 transition-opacity duration-300 hover:opacity-100 md:p-4 flex justify-between items-center">
        <Link
          href={`/a/?id=${artifact.id}`}
          className="after:absolute after:inset-0 after:content-['']"
          tabIndex={tabIndex}
        >
          <h3 className="text-small text-text-primary line-clamp-1 overflow-ellipsis p-2 rounded-button bg-primary/80 backdrop-blur-md">
            {artifact.name}
          </h3>
        </Link>
        <div className="flex gap-2">
          <p className="text-small text-text-primary p-2 rounded-button bg-primary/80 backdrop-blur-md">
            {artifact.reactions?.like?.length || 0} 😍
          </p>
          <p className="text-small text-text-primary p-2 rounded-button bg-primary/80 backdrop-blur-md">
            {artifact.reactions?.dislike?.length || 0} 🤔
          </p>
        </div>
      </div>
    </div>
  );
}
