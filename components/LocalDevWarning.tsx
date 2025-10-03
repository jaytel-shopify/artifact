"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * LocalDevWarning
 * 
 * Shows a warning message when running on localhost.
 * Quick SDK only works on deployed Quick sites, not localhost.
 */
export default function LocalDevWarning() {
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // Check if running on localhost
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || 
                    hostname === "127.0.0.1" ||
                    hostname.startsWith("192.168.");
    
    setIsLocalhost(isLocal);
  }, []);

  // Don't show anything if not on localhost
  if (!isLocalhost) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">⚠️ Local Development Not Supported</CardTitle>
          <CardDescription>
            This app requires Quick platform APIs and must be deployed to Quick to function.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The Artifact app uses Quick&apos;s serverless APIs (quick.db, quick.fs, quick.id) 
              which are only available on deployed Quick sites.
            </p>
          </div>

          <div className="space-y-3">
            <div className="font-semibold text-sm">To deploy and use this app:</div>
            
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">1. Build the static site:</div>
                <code className="text-sm bg-black/50 px-3 py-1.5 rounded block font-mono">
                  pnpm build
                </code>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">2. Deploy to Quick:</div>
                <code className="text-sm bg-black/50 px-3 py-1.5 rounded block font-mono">
                  quick deploy dist artifact
                </code>
                <div className="text-xs text-muted-foreground mt-1">
                  (Type <span className="font-mono bg-black/50 px-1">y</span> when prompted to overwrite)
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">3. Visit your deployed site:</div>
                <a 
                  href="https://artifact.quick.shopify.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-400 underline block font-mono"
                >
                  https://artifact.quick.shopify.io
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Quick Deployment Workflow:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Make code changes locally</li>
                <li>Build and deploy (takes ~10-15 seconds)</li>
                <li>Test on the deployed Quick site</li>
                <li>Iterate and deploy again</li>
              </ul>
              <p className="pt-2">
                This is the intended workflow for Quick-based applications. 
                All Quick SDK features work only on Quick&apos;s infrastructure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

