"use client";

import { FileText } from "lucide-react";
import ArtifactCard from "@/components/presentation/ArtifactCard";
import type { Artifact } from "@/types";

interface ArtifactsSectionProps {
  artifacts: Artifact[];
  title?: string;
  showCount?: boolean;
}

/**
 * Reusable section component for displaying a grid of artifacts
 * Uses ArtifactCard for consistent UI across search and other pages
 */
export function ArtifactsSection({
  artifacts,
  title = "Artifacts",
}: ArtifactsSectionProps) {
  if (artifacts.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-large">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {artifacts.map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </div>
    </section>
  );
}
