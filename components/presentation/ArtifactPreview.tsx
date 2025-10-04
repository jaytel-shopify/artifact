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
        {/* Include title with same spacing as actual artifacts */}
        <div className="space-y-4">
          <div className="mb-2">
            <div className="text-center">
              <div 
                className="text-xs text-gray-400 truncate select-none px-2 py-1"
                style={{ 
                  fontSize: '14px',
                  lineHeight: '1.2',
                  maxWidth: '440px',
                  margin: '0 auto'
                }}
              >
                {artifact.name || "Untitled"}
              </div>
            </div>
          </div>
          <div>
            <PreviewContent artifact={artifact} />
          </div>
        </div>
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
