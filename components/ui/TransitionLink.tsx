"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * Custom Link component that disables prefetching by default.
 * This prevents RSC payload fetch errors in static exports.
 */
export default function Link({
  prefetch = false,
  ...props
}: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
