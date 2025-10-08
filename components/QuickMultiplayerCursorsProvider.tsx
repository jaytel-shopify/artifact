"use client";

import { useEffect } from "react";
import { QuickMultiplayerCursors } from "@/lib/multiplayerCursors";

declare global {
  interface Window {
    QuickMultiplayerCursors?: any;
    __quickCursors?: any;
  }
}

export default function QuickMultiplayerCursorsProvider() {
  useEffect(() => {
    let cursors: any = null;
    let mounted = true;

    async function initializeCursors() {
      cursors = new QuickMultiplayerCursors();
      await cursors.init();
      window.__quickCursors = cursors;
    }

    initializeCursors().catch((error) => {
      console.error("Failed to initialize QuickMultiplayerCursors:", error);
    });
  }, []);

  return null;
}
