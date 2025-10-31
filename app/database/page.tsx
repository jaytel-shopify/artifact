"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Database as DatabaseIcon, Table, GitBranch, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatabaseTableView } from "@/components/admin/DatabaseTableView";
import { DatabaseSchemaGraph } from "@/components/admin/DatabaseSchemaGraph";
import { getAllCollections, type CollectionInfo } from "@/lib/database-explorer";

/**
 * Database Visualization Page
 * 
 * Admin-only page for visualizing Quick.db collections in Artifact.
 * Protected route - only accessible to jaytel.provence@shopify.com
 */
export default function DatabasePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Check authorization
  useEffect(() => {
    if (authLoading) return;

    // Only allow jaytel.provence@shopify.com
    if (user?.email !== "jaytel.provence@shopify.com") {
      console.warn("[DatabasePage] Unauthorized access attempt by:", user?.email);
      router.push("/");
      return;
    }

    // Fetch database collections
    async function loadCollections() {
      try {
        setLoading(true);
        const data = await getAllCollections();
        setCollections(data);
      } catch (error) {
        console.error("[DatabasePage] Failed to load collections:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCollections();
  }, [user, authLoading, router]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4"></div>
          <p className="text-sm text-muted-foreground">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authorized (will redirect)
  if (user?.email !== "jaytel.provence@shopify.com") {
    return null;
  }

  const totalDocuments = collections.reduce((sum, c) => sum + c.documentCount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <DatabaseIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Database Visualizer</h1>
                <p className="text-sm text-muted-foreground">
                  Quick.db Collections Explorer
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="flex gap-6 mt-5 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="font-semibold text-foreground">{collections.length}</span>
                <span className="text-muted-foreground">Collections</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-semibold text-foreground">{totalDocuments}</span>
                <span className="text-muted-foreground">Documents</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table" className="gap-2">
              <Table className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Schema Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-0">
            <Card className="p-6">
              <DatabaseTableView collections={collections} loading={loading} />
            </Card>
          </TabsContent>

          <TabsContent value="graph" className="mt-0">
            <Card className="overflow-hidden" style={{ height: "calc(100vh - 280px)" }}>
              <DatabaseSchemaGraph collections={collections} loading={loading} />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

