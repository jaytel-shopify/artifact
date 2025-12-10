"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { waitForQuick } from "@/lib/quick";

import type { ProjectArtifact, Artifact } from "@/types";

interface MigrationLog {
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface MigrationStats {
  projectArtifactsTotal: number;
  orphanedEntries: number;
  entriesDeleted: number;
  errors: number;
}

interface MigrationProgress {
  phase: "idle" | "analyzing" | "deleting" | "complete" | "error";
  current: number;
  total: number;
  currentItem: string;
  logs: MigrationLog[];
  stats: MigrationStats;
}

export default function OrphanProjectArtifactsMigrationPage() {
  const [progress, setProgress] = useState<MigrationProgress>({
    phase: "idle",
    current: 0,
    total: 0,
    currentItem: "",
    logs: [],
    stats: {
      projectArtifactsTotal: 0,
      orphanedEntries: 0,
      entriesDeleted: 0,
      errors: 0,
    },
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);

  const addLog = useCallback(
    (type: MigrationLog["type"], message: string) => {
      setProgress((prev) => ({
        ...prev,
        logs: [
          ...prev.logs,
          {
            timestamp: new Date().toISOString(),
            type,
            message,
          },
        ],
      }));
    },
    []
  );

  // Analyze project_artifacts to find orphaned entries
  const analyzeProjectArtifacts = useCallback(async () => {
    setProgress((prev) => ({
      ...prev,
      phase: "analyzing",
      currentItem: "Loading project_artifacts and artifacts...",
    }));
    addLog("info", "Analyzing project_artifacts collection...");

    const quick = await waitForQuick();
    const projectArtifactsCollection = quick.db.collection("project_artifacts");
    const artifactsCollection = quick.db.collection("artifacts");

    // Fetch all project_artifacts
    const projectArtifacts: ProjectArtifact[] =
      await projectArtifactsCollection.find();
    addLog("info", `Found ${projectArtifacts.length} total project_artifacts`);

    // Fetch all artifacts
    const artifacts: Artifact[] = await artifactsCollection.find();
    addLog("info", `Found ${artifacts.length} total artifacts`);

    // Build a set of existing artifact IDs for fast lookup
    const existingArtifactIds = new Set(artifacts.map((a) => a.id));

    // Find orphaned project_artifacts (where artifact_id doesn't exist)
    const orphanedEntries = projectArtifacts.filter(
      (pa) => !existingArtifactIds.has(pa.artifact_id)
    );

    addLog(
      orphanedEntries.length > 0 ? "warning" : "success",
      `Found ${orphanedEntries.length} orphaned project_artifact entries`
    );

    // Log some details about orphaned entries
    if (orphanedEntries.length > 0 && orphanedEntries.length <= 20) {
      orphanedEntries.forEach((entry) => {
        addLog(
          "info",
          `Orphaned: project_artifact ${entry.id} references missing artifact ${entry.artifact_id} (name: "${entry.name}")`
        );
      });
    } else if (orphanedEntries.length > 20) {
      addLog(
        "info",
        `First 20 orphaned entries shown, ${orphanedEntries.length - 20} more...`
      );
      orphanedEntries.slice(0, 20).forEach((entry) => {
        addLog(
          "info",
          `Orphaned: project_artifact ${entry.id} references missing artifact ${entry.artifact_id} (name: "${entry.name}")`
        );
      });
    }

    setProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        projectArtifactsTotal: projectArtifacts.length,
        orphanedEntries: orphanedEntries.length,
      },
    }));

    return { projectArtifacts, orphanedEntries };
  }, [addLog]);

  // Delete orphaned project_artifacts
  const deleteOrphanedEntries = useCallback(
    async (orphanedEntries: ProjectArtifact[]) => {
      setProgress((prev) => ({
        ...prev,
        phase: "deleting",
        current: 0,
        total: orphanedEntries.length,
        currentItem: "Starting deletion of orphaned entries...",
      }));
      addLog("info", `Deleting ${orphanedEntries.length} orphaned entries...`);

      const quick = await waitForQuick();
      const projectArtifactsCollection =
        quick.db.collection("project_artifacts");

      let deleted = 0;
      let errors = 0;

      for (let i = 0; i < orphanedEntries.length; i++) {
        const entry = orphanedEntries[i];
        setProgress((prev) => ({
          ...prev,
          current: i + 1,
          currentItem: `Deleting project_artifact: ${entry.id} (${entry.name})`,
        }));

        try {
          if (!isDryRun) {
            await projectArtifactsCollection.delete(entry.id);
          }

          addLog(
            "success",
            `${isDryRun ? "[DRY RUN] Would delete" : "Deleted"} project_artifact ${entry.id} (artifact: ${entry.artifact_id}, name: "${entry.name}")`
          );
          deleted++;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          addLog(
            "error",
            `Error deleting project_artifact ${entry.id}: ${errorMessage}`
          );
          errors++;
        }

        // Update stats
        setProgress((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            entriesDeleted: deleted,
            errors,
          },
        }));
      }

      addLog(
        "info",
        `Deletion complete: ${deleted} deleted, ${errors} errors`
      );
    },
    [addLog, isDryRun]
  );

  // Run full migration
  const runMigration = async () => {
    setIsRunning(true);
    setProgress({
      phase: "analyzing",
      current: 0,
      total: 0,
      currentItem: "Starting analysis...",
      logs: [],
      stats: {
        projectArtifactsTotal: 0,
        orphanedEntries: 0,
        entriesDeleted: 0,
        errors: 0,
      },
    });

    try {
      addLog("info", `Starting migration (${isDryRun ? "DRY RUN" : "LIVE"})...`);

      // Analyze project_artifacts
      const { orphanedEntries } = await analyzeProjectArtifacts();

      if (orphanedEntries.length === 0) {
        addLog("success", "No orphaned project_artifact entries found!");
        setProgress((prev) => ({
          ...prev,
          phase: "complete",
          currentItem: "No cleanup needed",
        }));
        return;
      }

      // Delete orphaned entries
      await deleteOrphanedEntries(orphanedEntries);

      setProgress((prev) => ({
        ...prev,
        phase: "complete",
        currentItem: "Cleanup complete!",
      }));
      addLog("success", "Migration completed successfully!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setProgress((prev) => ({
        ...prev,
        phase: "error",
        currentItem: errorMessage,
      }));
      addLog("error", `Migration failed: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getPhaseLabel = (phase: MigrationProgress["phase"]) => {
    switch (phase) {
      case "idle":
        return "Ready";
      case "analyzing":
        return "Analyzing Data";
      case "deleting":
        return "Deleting Orphaned Entries";
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

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Orphan Project Artifacts Cleanup
        </h1>
        <p className="text-gray-600">
          Find and delete project_artifact entries that reference non-existent
          artifacts
        </p>
      </div>

      {progress.phase === "idle" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cleanup Options</CardTitle>
            <CardDescription>
              This cleanup will scan all project_artifact entries and delete any
              that reference artifacts which no longer exist in the database.
              This can happen when artifacts are deleted but their junction
              entries remain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="dryRun"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="dryRun" className="sr-only text-sm">
                Dry run (preview changes without modifying database)
              </label>
            </div>

            <Button
              onClick={runMigration}
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning
                ? "Cleanup in Progress..."
                : isDryRun
                  ? "Preview Cleanup (Dry Run)"
                  : "Run Cleanup"}
            </Button>
          </CardContent>
        </Card>
      )}

      {progress.phase !== "idle" && (
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

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-800">
                    {progress.stats.projectArtifactsTotal}
                  </div>
                  <div className="text-xs text-gray-600">
                    Total Project Artifacts
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">
                    {progress.stats.orphanedEntries}
                  </div>
                  <div className="text-xs text-gray-600">Orphaned Entries</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.stats.entriesDeleted}
                  </div>
                  <div className="text-xs text-gray-600">Entries Deleted</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-600">
                    {progress.stats.errors}
                  </div>
                  <div className="text-xs text-gray-600">Errors</div>
                </div>
              </div>

              {progress.phase === "complete" && (
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() =>
                      setProgress((prev) => ({ ...prev, phase: "idle" }))
                    }
                    variant="outline"
                    className="flex-1"
                  >
                    Run Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cleanup Log</CardTitle>
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

