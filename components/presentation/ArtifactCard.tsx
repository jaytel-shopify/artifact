"use client";

import ArtifactThumbnail from "./ArtifactThumbnail";
import type { Artifact } from "@/types";
import Link from "next/link";

interface ArtifactCardProps {
  artifact: Artifact;
}

export default function ArtifactCard({ artifact }: ArtifactCardProps) {
  return (
    <div className="relative flex flex-col gap-2">
      <ArtifactThumbnail artifact={artifact} />
      <Link
        href={`/a/?id=${artifact.id}`}
        className="after:content-[''] after:absolute after:inset-0"
      >
        <h3 className="text-xs font-medium text-white line-clamp-1">
          {artifact.name}
        </h3>
      </Link>
    </div>
  );
}
