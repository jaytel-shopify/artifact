"use client";

import ArtifactThumbnail from "./ArtifactThumbnail";
import type { Artifact } from "@/types";
import Link from "next/link";

interface ArtifactCardProps {
  artifact: Artifact;
}

export default function ArtifactCard({ artifact }: ArtifactCardProps) {
  return (
      <Link
        href={`/a/?id=${artifact.id}`}
        aria-label={artifact.name}
      >
        <ArtifactThumbnail artifact={artifact} />
      </Link>
  );
}
