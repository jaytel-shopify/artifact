"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * LocalDevWarning
 * 
 * Shows a small notice when running on localhost with mock data.
 */
export default function LocalDevWarning() {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running on localhost
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || 
                    hostname === "127.0.0.1" ||
                    hostname.startsWith("192.168.");
    
    setIsLocalhost(isLocal);

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem('local-dev-notice-dismissed') === 'true';
    setDismissed(wasDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('local-dev-notice-dismissed', 'true');
  };

  // Don't show anything if not on localhost or if dismissed
  if (!isLocalhost || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span>💡</span>
              <span>Local Development Mode</span>
            </CardTitle>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <CardDescription className="text-xs">
            Using mock data. Deploy to Quick for full functionality.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <p className="text-xs text-muted-foreground mb-2">
            You&apos;re seeing placeholder data. File uploads will use sample images.
          </p>
          <div className="bg-muted/50 p-2 rounded text-xs font-mono">
            pnpm build && quick deploy dist artifact
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

