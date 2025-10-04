"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DEFAULT_VIEWPORT_KEY, VIEWPORTS, type ViewportKey, getViewportDimensions } from "@/lib/viewports";

function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    return null;
  } catch {
    return null;
  }
}

type UrlMetadata = {
  width?: number;
  height?: number;
  viewport?: string;
};

export default function URLEmbed({ url, metadata }: { url: string; metadata?: UrlMetadata }) {
  const safeUrl = useMemo(() => sanitizeUrl(url), [url]);
  const [iframeError, setIframeError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number>(() => getViewportDimensions(DEFAULT_VIEWPORT_KEY).height);

  const dimensions = useMemo(() => {
    if (typeof metadata?.width === "number" && typeof metadata?.height === "number") {
      return { width: metadata.width, height: metadata.height };
    }
    const key = metadata?.viewport as ViewportKey | undefined;
    if (key && VIEWPORTS[key]) {
      return getViewportDimensions(key);
    }
    return getViewportDimensions(DEFAULT_VIEWPORT_KEY);
  }, [metadata?.height, metadata?.width, metadata?.viewport]);
  
  // Extract domain for display
  const domain = useMemo(() => {
    try {
      return new URL(safeUrl || "").hostname;
    } catch {
      return safeUrl;
    }
  }, [safeUrl]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableWidth = el.clientWidth;
      if (!availableWidth || !dimensions.width) return;
      const nextScale = availableWidth / dimensions.width;
      setScale(nextScale);
      setScaledHeight(dimensions.height * nextScale);
    };

    updateScale();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateScale());
      ro.observe(el);
    } else {
      window.addEventListener("resize", updateScale);
    }

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [dimensions.height, dimensions.width]);

  if (!safeUrl) return <div className="p-4 text-sm text-red-600">Invalid URL</div>;

  // Try to embed via iframe (fallback to card if it fails)
  if (!iframeError) {
    return (
      <div
        ref={containerRef}
        className="w-full"
        style={{ position: "relative", height: `${scaledHeight}px`, overflow: "hidden" }}
      >
        <div
          className="shadow-2xl border border-white/10"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "auto",
          }}
        >
          <iframe
            src={safeUrl}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
            allow="clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 0 }}
            onError={() => setIframeError(true)}
          />
        </div>
      </div>
    );
  }

  // Fallback: Show link card if iframe can't be embedded
  return (
    <div ref={containerRef} className="w-full flex items-start">
      <Card className="max-w-xl w-full bg-white/80 backdrop-blur border border-white/20 shadow-2xl">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-gray-900 truncate text-base">{domain}</CardTitle>
              <CardDescription className="text-gray-600 truncate mt-1">{safeUrl}</CardDescription>
              {iframeError && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  ⚠️ This site cannot be embedded. Click below to open.
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardFooter className="pt-0">
          <a
            href={safeUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Open in new tab →
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}


