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

    console.log("attempting to initialize multiplayer cursors");

    async function initializeCursors() {
      // Wait for Quick SDK to be available

      if (!mounted) return;

      try {
        // Initialize multiplayer cursors
        // With options
        cursors = new QuickMultiplayerCursors();
        await cursors.init();

        console.log(cursors);

        // Store reference globally for debugging
        window.__quickCursors = cursors;
      } catch (error) {
        console.error("Failed to initialize QuickMultiplayerCursors:", error);
      }
    }

    initializeCursors();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (cursors) {
        cursors.destroy().catch((error: Error) => {
          console.error("Failed to destroy QuickMultiplayerCursors:", error);
        });
      }
    };
  }, []);

  return null;
}
