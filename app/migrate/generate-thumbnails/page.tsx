"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateMissingThumbnails } from "@/lib/generate-thumbnails";

export default function GenerateThumbnailsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [force, setForce] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [result, setResult] = useState<{ total: number; generated: number; errors: number } | null>(null);

  const handleGenerate = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const stats = await generateMissingThumbnails((current, total, message) => {
        setProgress({ current, total, message });
      }, force);
      
      setResult(stats);
    } catch (error: any) {
      alert(`Failed to generate thumbnails: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Video Thumbnails</CardTitle>
          <CardDescription>
            Generate thumbnails for all videos that don't have one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isRunning && !result && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="force"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="force" className="sr-only text-sm">
                  Force regenerate all thumbnails (even if they already exist)
                </label>
              </div>
              <Button onClick={handleGenerate} size="lg">
                {force ? "Regenerate All Thumbnails" : "Generate Missing Thumbnails"}
              </Button>
              {force && (
                <p className="text-sm text-yellow-600">
                  ⚠️ This will regenerate thumbnails for ALL videos with correct aspect ratios
                </p>
              )}
            </div>
          )}

          {isRunning && progress && (
            <div className="space-y-4">
              <div className="text-lg font-semibold">
                Processing {progress.current} / {progress.total}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">{progress.message}</div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="text-xl font-bold text-green-600">
                ✓ Complete!
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-blue-600">{result.total}</div>
                    <div className="text-sm text-gray-600">Total Videos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-green-600">{result.generated}</div>
                    <div className="text-sm text-gray-600">Generated</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-red-600">{result.errors}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </CardContent>
                </Card>
              </div>
              <Button
                onClick={() => {
                  setResult(null);
                  setProgress(null);
                }}
                variant="outline"
              >
                Run Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

