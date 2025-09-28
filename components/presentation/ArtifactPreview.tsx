"use client";

import ImageViewer from "@/components/artifacts/ImageViewer";
import URLEmbed from "@/components/artifacts/URLEmbed";
import VideoPlayer from "@/components/artifacts/VideoPlayer";
import PDFViewer from "@/components/artifacts/PDFViewer";
import type { Artifact } from "@/types";

export default function ArtifactPreview({ artifact, maxHeight }: { artifact: Artifact; maxHeight?: number }) {
  return (
    <div
      className="pointer-events-none overflow-y-auto"
      style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
    >
      <div className="overflow-hidden">
        <PreviewContent artifact={artifact} />
      </div>
    </div>
  );
}

function PreviewContent({ artifact }: { artifact: Artifact }) {
  if (artifact.type === "image") {
    return <ImageViewer src={artifact.source_url} alt="" />;
  }
  if (artifact.type === "url") {
    return <URLEmbed url={artifact.source_url} />;
  }
  if (artifact.type === "video") {
    return <VideoPlayer src={artifact.source_url} />;
  }
  if (artifact.type === "pdf") {
    return <PDFViewer src={artifact.source_url} />;
  }
  return <div className="text-sm text-white/70">Unsupported</div>;
}
