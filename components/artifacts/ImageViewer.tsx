"use client";

import Image from "next/image";
import { useMemo } from "react";

function isQuickUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("quick.shopify.io");
  } catch {
    return false;
  }
}

export default function ImageViewer({ src, alt, fitMode = false }: { src: string; alt?: string; fitMode?: boolean }) {
  const useNextImage = useMemo(() => isQuickUrl(src), [src]);
  
  const commonClass = fitMode ? "" : "w-full h-auto";
  const fitStyle = fitMode ? {
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 194px)', // viewport - header(64) - topPadding(12) - title(30) - titleMargin(24) - bottomPadding(64)
    width: 'auto',
    height: 'auto',
    objectFit: 'contain' as const,
  } : undefined;

  return useNextImage ? (
    <Image src={src} alt={alt || ""} width={2000} height={1500} className={commonClass} style={fitStyle} />
  ) : (
    <img src={src} alt={alt || ""} className={commonClass} style={fitStyle} />
  );
}


