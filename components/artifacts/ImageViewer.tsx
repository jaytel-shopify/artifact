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

export default function ImageViewer({ src, alt }: { src: string; alt?: string }) {
  const useNextImage = useMemo(() => isQuickUrl(src), [src]);
  const commonClass = "w-full h-auto";

  return useNextImage ? (
    <Image src={src} alt={alt || ""} width={2000} height={1500} className={commonClass} />
  ) : (
    <img src={src} alt={alt || ""} className={commonClass} />
  );
}


