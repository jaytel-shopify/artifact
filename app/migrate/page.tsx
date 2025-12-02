"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  runMigration,
  type MigrationProgress,
  type MigrationLog,
} from "@/lib/migration";
import { clearMigrationData, getMigrationStats } from "@/lib/migration-state";
import { useRouter } from "next/navigation";

export default function MigratePage() {
  const router = useRouter();
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await getMigrationStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleStartMigration = async () => {
    setIsRunning(true);

    try {
      await runMigration((progressUpdate) => {
        setProgress(progressUpdate);
      });
    } catch (error: any) {
      console.error("Migration failed:", error);
      setProgress({
        phase: "error",
        current: 0,
        total: 0,
        currentItem: error.message,
        logs: progress?.logs || [
          {
            timestamp: new Date().toISOString(),
            type: "error",
            message: error.message,
          },
        ],
        stats: progress?.stats || {
          totalPosts: 0,
          totalMedia: 0,
          postsProcessed: 0,
          artifactsCreated: 0,
          postsSkipped: 0,
          uploadsSkipped: 0,
          duplicatesSkipped: 0,
          errors: 1,
        },
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        "This will delete all migrated artifacts and clear the upload cache. Continue?"
      )
    ) {
      return;
    }

    try {
      const result = await clearMigrationData();
      alert(
        `Cleared ${result.artifactsDeleted} artifacts and ${result.cacheCleared} cached uploads`
      );
      await loadStats();
    } catch (error: any) {
      alert(`Failed to clear data: ${error.message}`);
    }
  };

  const getPhaseLabel = (phase: MigrationProgress["phase"]) => {
    switch (phase) {
      case "loading":
        return "Loading...";
      case "parsing":
        return "Parsing SQL Dump";
      case "uploading":
        return "Uploading Files";
      case "creating":
        return "Creating Artifacts";
      case "complete":
        return "Complete";
      case "error":
        return "Error";
      default:
        return "Processing";
    }
  };

  const getLogIcon = (type: MigrationLog["type"]) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  const getLogColor = (type: MigrationLog["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Data Migration</h1>
        <p className="text-gray-600">
          Migrate posts and media from PostgreSQL to Quick.db
        </p>
      </div>

      {!progress && stats && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold">
                  {stats.migratedArtifacts}
                </div>
                <div className="text-sm text-gray-600">Migrated Artifacts</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.cachedUploads}</div>
                <div className="text-sm text-gray-600">Cached Uploads</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {(stats.totalSize / 1024 / 1024).toFixed(1)} MB
                </div>
                <div className="text-sm text-gray-600">Total Cached</div>
              </div>
            </div>

            {stats.migratedArtifacts > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/migrate/results")}
                  variant="outline"
                >
                  View Results
                </Button>
                <Button onClick={handleClearData} variant="destructive">
                  Clear All Migration Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!progress && (
        <Card>
          <CardHeader>
            <CardTitle>Start Migration</CardTitle>
            <CardDescription>
              Upload cache will skip already-uploaded files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleStartMigration}
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning ? "Migration in Progress..." : "Start Migration"}
            </Button>
          </CardContent>
        </Card>
      )}

      {progress && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{getPhaseLabel(progress.phase)}</CardTitle>
              <CardDescription>{progress.currentItem}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                  <span>
                    {progress.total > 0
                      ? Math.round((progress.current / progress.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progress.phase === "complete"
                        ? "bg-green-500"
                        : progress.phase === "error"
                          ? "bg-red-500"
                          : "bg-blue-500"
                    }`}
                    style={{
                      width:
                        progress.total > 0
                          ? `${(progress.current / progress.total) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {progress.stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {progress.stats.artifactsCreated}
                    </div>
                    <div className="text-xs text-gray-600">Created</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {progress.stats.postsProcessed}
                    </div>
                    <div className="text-xs text-gray-600">Processed</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {progress.stats.uploadsSkipped}
                    </div>
                    <div className="text-xs text-gray-600">Cached</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-600">
                      {progress.stats.postsSkipped}
                    </div>
                    <div className="text-xs text-gray-600">No Media</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {progress.stats.duplicatesSkipped}
                    </div>
                    <div className="text-xs text-gray-600">Duplicates</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600">
                      {progress.stats.errors}
                    </div>
                    <div className="text-xs text-gray-600">Errors</div>
                  </div>
                </div>
              )}

              {progress.phase === "complete" && (
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => router.push("/migrate/results")}
                    className="flex-1"
                  >
                    View Results
                  </Button>
                  <Button
                    onClick={() => router.push("/")}
                    variant="outline"
                    className="flex-1"
                  >
                    Go to Home
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Migration Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                {progress.logs.map((log, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-gray-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>{" "}
                    <span className={getLogColor(log.type)}>
                      {getLogIcon(log.type)}
                    </span>{" "}
                    <span className="text-gray-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
