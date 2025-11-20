"use client";

import ArtifactThumbnail from "./ArtifactThumbnail";
import type { Artifact } from "@/types";

interface ArtifactCardProps {
  artifact: Artifact;
}

export default function ArtifactCard({ artifact }: ArtifactCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <ArtifactThumbnail artifact={artifact} />
      <h3 className="text-xs font-medium text-white line-clamp-1">
        {artifact.name}
      </h3>
    </div>
  );
}
