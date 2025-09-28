"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  const [allowEmbed, setAllowEmbed] = useState<boolean | null>(null);
  const [meta, setMeta] = useState<{ title: string; description: string; iconUrl: string | null } | null>(null);
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

  useEffect(() => {
    let active = true;
    if (!safeUrl) return;
    (async () => {
      try {
        const res = await fetch(`/api/embed/preview?url=${encodeURIComponent(safeUrl)}`);
        const j = await res.json();
        if (!active) return;
        setAllowEmbed(j.allowEmbed ?? false);
        setMeta({ title: j.title || safeUrl, description: j.description || "", iconUrl: j.iconUrl || null });
      } catch {
        if (active) setAllowEmbed(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [safeUrl]);

  if (!safeUrl) return <div className="p-4 text-sm text-red-600">Invalid URL</div>;

  if (allowEmbed === true) {
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
          />
        </div>
      </div>
    );
  }

  // Fallback rich preview
  return (
    <div ref={containerRef} className="w-full flex items-start">
      <Card className="max-w-xl w-full bg-white/80 backdrop-blur border border-white/20 shadow-2xl">
        <CardHeader>
          <div className="flex items-start gap-3">
            {meta?.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meta.iconUrl} alt="" className="w-10 h-10 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <CardTitle className="text-gray-900 truncate text-base">{meta?.title || safeUrl}</CardTitle>
              {meta?.description && (
                <CardDescription className="text-gray-600 line-clamp-3 mt-1">{meta.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardFooter className="pt-0">
          <a
            href={safeUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-blue-600 hover:underline text-sm"
          >
            Open in new tab
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}


