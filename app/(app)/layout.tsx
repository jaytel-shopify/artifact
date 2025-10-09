"use client";

import { ReactNode, useEffect } from "react";
import PageTransition from "@/components/transitions/PageTransition";
import { useAppShell } from "@/components/layout/AppShellProvider";

export default function AppRouteLayout({ children }: { children: ReactNode }) {
  const { reset } = useAppShell();

  useEffect(() => {
    reset();
  }, [reset]);

  return <PageTransition>{children}</PageTransition>;
}
