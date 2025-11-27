"use client";

import ArtifactThumbnail from "./ArtifactThumbnail";
import type { Artifact } from "@/types";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Trash2 } from "lucide-react";

interface ArtifactCardProps {
  artifact: Artifact;
  onDelete?: (artifact: Artifact) => void;
}

export default function ArtifactCard({
  artifact,
  onDelete,
}: ArtifactCardProps) {
  const { user } = useAuth();
  const isCreator = user?.id === artifact.creator_id;

  return (
    <div className="relative group">
      <Link href={`/a/?id=${artifact.id}`} aria-label={artifact.name}>
        <ArtifactThumbnail artifact={artifact} className="rounded-card-inner" />
      </Link>
      {isCreator && onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(artifact);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          aria-label="Delete artifact"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
