"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /projects so URL always shows /projects
    router.replace("/projects");
  }, [router]);

  return null; // Clean redirect, no loading text
}
