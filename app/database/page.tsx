"use client";

import { useEffect, useState } from "react";

interface CollectionData {
  [collectionName: string]: any[];
}

interface RelationshipIssue {
  type: "orphaned_access" | "missing_access" | "invalid_reference";
  severity: "warning" | "error";
  message: string;
  resourceId?: string;
  accessEntryId?: string;
}

interface ResourceAccess {
  resource: any;
  resourceType: "project" | "folder";
  accessEntries: any[];
  issues: RelationshipIssue[];
}

export default function DatabaseViewerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CollectionData>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"raw" | "relationships">(
    "relationships"
  );
  const [fixing, setFixing] = useState(false);
  const [fixResults, setFixResults] = useState<string[]>([]);

  const COLLECTIONS = [
    "projects",
    "folders",
    "pages",
    "artifacts",
    "access_control",
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // @ts-ignore - quick is loaded via script tag
      const quick = window.quick;

      if (!quick) {
        setError("Quick SDK not loaded. Are you on a Quick deployment?");
        setLoading(false);
        return;
      }

      // Get current user
      const user = await quick.id.waitForUser();
      setCurrentUser(user);

      // Load all collections
      const allData: CollectionData = {};

      for (const collectionName of COLLECTIONS) {
        try {
          const collection = quick.db.collection(collectionName);
          const docs = await collection.find();
          allData[collectionName] = docs;
          console.log(`${collectionName}: ${docs.length} documents`);
        } catch (err) {
          console.error(`Error loading ${collectionName}:`, err);
          allData[collectionName] = [];
        }
      }

      setData(allData);
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading database:", err);
      setError(err.message || "Failed to load database");
      setLoading(false);
    }
  }

  function copyToClipboard() {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text).then(
      () => alert("✅ Database copied to clipboard!"),
      (err) => alert("❌ Failed to copy: " + err.message)
    );
  }

  function downloadJSON() {
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `artifact-db-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function analyzeRelationships(): {
    resources: ResourceAccess[];
    orphanedAccess: any[];
    stats: {
      totalProjects: number;
      totalFolders: number;
      totalAccessEntries: number;
      projectsWithAccess: number;
      foldersWithAccess: number;
      orphanedEntries: number;
      totalIssues: number;
    };
  } {
    const projects = data.projects || [];
    const folders = data.folders || [];
    const accessEntries = data.access_control || [];

    const resources: ResourceAccess[] = [];
    const orphanedAccess: any[] = [];
    let totalIssues = 0;

    // Analyze projects
    projects.forEach((project) => {
      const projectAccess = accessEntries.filter(
        (entry) =>
          entry.resource_type === "project" && entry.resource_id === project.id
      );
      const issues: RelationshipIssue[] = [];

      if (projectAccess.length === 0) {
        issues.push({
          type: "missing_access",
          severity: "warning",
          message: "No access control entries (not shared with anyone)",
          resourceId: project.id,
        });
        totalIssues++;
      }

      // Check if creator has owner access
      const creatorAccess = projectAccess.find(
        (entry) =>
          entry.user_email === project.creator_id &&
          entry.access_level === "owner"
      );

      if (!creatorAccess) {
        issues.push({
          type: "missing_access",
          severity: "error",
          message: `Creator (${project.creator_id}) is missing owner access`,
          resourceId: project.id,
        });
        totalIssues++;
      }

      resources.push({
        resource: project,
        resourceType: "project",
        accessEntries: projectAccess,
        issues,
      });
    });

    // Analyze folders
    folders.forEach((folder) => {
      const folderAccess = accessEntries.filter(
        (entry) =>
          entry.resource_type === "folder" && entry.resource_id === folder.id
      );
      const issues: RelationshipIssue[] = [];

      if (folderAccess.length === 0) {
        issues.push({
          type: "missing_access",
          severity: "warning",
          message: "No access control entries (not shared with anyone)",
          resourceId: folder.id,
        });
        totalIssues++;
      }

      // Check if creator has owner access
      const creatorAccess = folderAccess.find(
        (entry) =>
          entry.user_email === folder.creator_id &&
          entry.access_level === "owner"
      );

      if (!creatorAccess) {
        issues.push({
          type: "missing_access",
          severity: "error",
          message: `Creator (${folder.creator_id}) is missing owner access`,
          resourceId: folder.id,
        });
        totalIssues++;
      }

      resources.push({
        resource: folder,
        resourceType: "folder",
        accessEntries: folderAccess,
        issues,
      });
    });

    // Find orphaned access entries
    accessEntries.forEach((entry) => {
      const resourceExists =
        entry.resource_type === "project"
          ? projects.some((p) => p.id === entry.resource_id)
          : folders.some((f) => f.id === entry.resource_id);

      if (!resourceExists) {
        orphanedAccess.push(entry);
        totalIssues++;
      }
    });

    const projectsWithAccess = projects.filter((p) =>
      accessEntries.some(
        (e) => e.resource_type === "project" && e.resource_id === p.id
      )
    ).length;

    const foldersWithAccess = folders.filter((f) =>
      accessEntries.some(
        (e) => e.resource_type === "folder" && e.resource_id === f.id
      )
    ).length;

    return {
      resources,
      orphanedAccess,
      stats: {
        totalProjects: projects.length,
        totalFolders: folders.length,
        totalAccessEntries: accessEntries.length,
        projectsWithAccess,
        foldersWithAccess,
        orphanedEntries: orphanedAccess.length,
        totalIssues,
      },
    };
  }

  async function fixResourceAccess(
    resourceId: string,
    resourceType: "project" | "folder",
    creatorEmail: string,
    resourceName: string
  ) {
    setFixing(true);
    const results: string[] = [];

    try {
      // @ts-ignore
      const quick = window.quick;
      const accessCollection = quick.db.collection("access_control");

      await accessCollection.create({
        resource_id: resourceId,
        resource_type: resourceType,
        user_email: creatorEmail,
        user_name: creatorEmail,
        access_level: "owner",
        granted_by: creatorEmail,
      });

      results.push(
        `✅ Fixed ${resourceType}: ${resourceName} (${creatorEmail})`
      );
      setFixResults(results);

      // Reload data to show updated state
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (err: any) {
      results.push(
        `❌ Failed to fix ${resourceType} ${resourceName}: ${err.message}`
      );
      setFixResults(results);
    } finally {
      setFixing(false);
    }
  }

  async function addUserToResource(
    resourceId: string,
    resourceType: "project" | "folder",
    userEmail: string,
    accessLevel: "owner" | "editor" | "viewer",
    resourceName: string
  ) {
    setFixing(true);
    const results: string[] = [];

    try {
      // Normalize email
      const normalizedEmail = userEmail.toLowerCase().trim();
      const fullEmail = normalizedEmail.includes("@")
        ? normalizedEmail
        : `${normalizedEmail}@shopify.com`;

      // @ts-ignore
      const quick = window.quick;
      const accessCollection = quick.db.collection("access_control");

      // Check if already exists
      const existing = data.access_control?.find(
        (e) =>
          e.resource_id === resourceId &&
          e.resource_type === resourceType &&
          e.user_email.toLowerCase() === fullEmail
      );

      if (existing) {
        results.push(
          `⚠️ User ${fullEmail} already has access to this ${resourceType}`
        );
        setFixResults(results);
        setFixing(false);
        return;
      }

      await accessCollection.create({
        resource_id: resourceId,
        resource_type: resourceType,
        user_email: fullEmail,
        user_name: fullEmail,
        access_level: accessLevel,
        granted_by: currentUser?.email || "system",
      });

      results.push(
        `✅ Added ${fullEmail} as ${accessLevel} to ${resourceName}`
      );
      setFixResults(results);

      // Reload data
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (err: any) {
      results.push(`❌ Failed to add user: ${err.message}`);
      setFixResults(results);
    } finally {
      setFixing(false);
    }
  }

  async function updateAccessLevel(
    entryId: string,
    newAccessLevel: "owner" | "editor" | "viewer",
    userEmail: string,
    resourceName: string
  ) {
    setFixing(true);
    const results: string[] = [];

    try {
      // @ts-ignore
      const quick = window.quick;
      const accessCollection = quick.db.collection("access_control");

      await accessCollection.update(entryId, {
        access_level: newAccessLevel,
      });

      results.push(
        `✅ Updated ${userEmail} to ${newAccessLevel} on ${resourceName}`
      );
      setFixResults(results);

      // Reload data
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (err: any) {
      results.push(`❌ Failed to update access: ${err.message}`);
      setFixResults(results);
    } finally {
      setFixing(false);
    }
  }

  async function removeUserAccess(
    entryId: string,
    userEmail: string,
    resourceName: string
  ) {
    if (!confirm(`Remove ${userEmail} from ${resourceName}?`)) {
      return;
    }

    setFixing(true);
    const results: string[] = [];

    try {
      // @ts-ignore
      const quick = window.quick;
      const accessCollection = quick.db.collection("access_control");

      await accessCollection.delete(entryId);

      results.push(`✅ Removed ${userEmail} from ${resourceName}`);
      setFixResults(results);

      // Reload data
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (err: any) {
      results.push(`❌ Failed to remove access: ${err.message}`);
      setFixResults(results);
    } finally {
      setFixing(false);
    }
  }

  async function deleteOrphanedAccess() {
    if (
      !confirm(
        "This will DELETE all orphaned access control entries. This cannot be undone. Continue?"
      )
    ) {
      return;
    }

    setFixing(true);
    setFixResults([]);
    const results: string[] = [];

    try {
      // @ts-ignore
      const quick = window.quick;
      const accessCollection = quick.db.collection("access_control");

      const analysis = analyzeRelationships();
      let deleted = 0;

      for (const entry of analysis.orphanedAccess) {
        try {
          await accessCollection.delete(entry.id);
          results.push(
            `🗑️ Deleted orphaned ${entry.resource_type} access for ${entry.user_email}`
          );
          deleted++;
        } catch (err: any) {
          results.push(`❌ Failed to delete entry ${entry.id}: ${err.message}`);
        }
      }

      results.push(`\n🎉 Deleted ${deleted} orphaned entries!`);
      setFixResults(results);

      // Reload data
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (err: any) {
      results.push(`❌ Error: ${err.message}`);
      setFixResults(results);
    } finally {
      setFixing(false);
    }
  }

  function filterData(collectionData: any[]) {
    if (!searchQuery) return collectionData;
    const query = searchQuery.toLowerCase();
    return collectionData.filter((doc) => {
      return JSON.stringify(doc).toLowerCase().includes(query);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-primary p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-text-primary">
            🗄️ Database Viewer
          </h1>
          <div className="text-center py-20 text-medium text-text-secondary">
            Loading database...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-text-primary p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-text-primary">
            🗄️ Database Viewer
          </h1>
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
            <h2 className="text-medium font-bold text-destructive mb-2">Error</h2>
            <p className="text-destructive/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const analysis = analyzeRelationships();

  return (
    <div className="min-h-screen bg-background text-text-primary p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-text-primary">
          🗄️ Database Viewer
        </h1>

        {currentUser && (
          <div className="bg-primary border border-border rounded-lg p-4 mb-6">
            <div className="text-small text-text-secondary">
              <strong>👤 Logged in as:</strong> {currentUser.fullName} (
              {currentUser.email})
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary rounded-lg text-medium transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-medium transition-colors"
          >
            📋 Copy to Clipboard
          </button>
          <button
            onClick={downloadJSON}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-medium transition-colors"
          >
            💾 Download JSON
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("relationships")}
            className={`px-6 py-3 text-medium transition-colors ${
              activeTab === "relationships"
                ? "text-text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            🔗 Relationships & Access
            {analysis.stats.totalIssues > 0 && (
              <span className="ml-2 px-2 py-0.5 text-small bg-destructive/20 text-destructive rounded-full">
                {analysis.stats.totalIssues}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-6 py-3 text-medium transition-colors ${
              activeTab === "raw"
                ? "text-text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            📊 Raw Data
          </button>
        </div>

        {activeTab === "relationships" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="text-small text-text-secondary mb-2">
                  Total Resources
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {analysis.stats.totalProjects + analysis.stats.totalFolders}
                </div>
                <div className="text-small text-text-secondary mt-1">
                  {analysis.stats.totalProjects} projects,{" "}
                  {analysis.stats.totalFolders} folders
                </div>
              </div>
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="text-small text-text-secondary mb-2">
                  With Access Control
                </div>
                <div className="text-3xl font-bold text-primary">
                  {analysis.stats.projectsWithAccess +
                    analysis.stats.foldersWithAccess}
                </div>
                <div className="text-small text-text-secondary mt-1">
                  {analysis.stats.projectsWithAccess} projects,{" "}
                  {analysis.stats.foldersWithAccess} folders
                </div>
              </div>
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="text-small text-text-secondary mb-2">
                  Access Entries
                </div>
                <div className="text-3xl font-bold text-primary">
                  {analysis.stats.totalAccessEntries}
                </div>
                <div className="text-small text-text-secondary mt-1">
                  {analysis.stats.orphanedEntries} orphaned
                </div>
              </div>
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="text-small text-text-secondary mb-2">
                  Issues Found
                </div>
                <div
                  className={`text-3xl font-bold ${analysis.stats.totalIssues > 0 ? "text-destructive" : "text-primary"}`}
                >
                  {analysis.stats.totalIssues}
                </div>
                <div className="text-small text-text-secondary mt-1">
                  {analysis.stats.totalIssues === 0
                    ? "All good!"
                    : "Need attention"}
                </div>
              </div>
            </div>

            {/* Global Actions */}
            {analysis.orphanedAccess.length > 0 && (
              <div className="bg-primary rounded-lg p-6">
                <h3 className="text-medium font-bold text-primary mb-3">
                  🔧 Global Actions
                </h3>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={deleteOrphanedAccess}
                    disabled={fixing}
                    className="px-4 py-2 bg-destructive hover:bg-destructive/80 disabled:bg-secondary disabled:cursor-not-allowed rounded-lg text-medium transition-colors"
                  >
                    {fixing
                      ? "⏳ Deleting..."
                      : "🗑️ Delete All Orphaned Entries"}
                  </button>
                </div>
                <p className="text-small text-text-secondary mt-3">
                  This will remove {analysis.orphanedAccess.length} orphaned
                  access entries that point to deleted resources.
                </p>
              </div>
            )}

            {/* Fix Results */}
            {fixResults.length > 0 && (
              <div className="bg-primary border border-border rounded-lg p-6">
                <h3 className="text-medium font-bold text-text-primary mb-3">
                  📋 Results
                </h3>
                <div className="bg-secondary rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-small text-text-secondary whitespace-pre-wrap font-mono">
                    {fixResults.join("\n")}
                  </pre>
                </div>
                <button
                  onClick={() => setFixResults([])}
                  className="mt-3 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-small"
                >
                  Clear Results
                </button>
              </div>
            )}

            {/* Orphaned Access Entries */}
            {analysis.orphanedAccess.length > 0 && (
              <div className="bg-destructive/10 border border-destructive rounded-lg overflow-hidden">
                <div className="bg-destructive/20 px-6 py-4">
                  <h2 className="text-medium font-bold text-destructive">
                    ⚠️ Orphaned Access Entries ({analysis.orphanedAccess.length}
                    )
                  </h2>
                  <p className="text-small text-destructive/80 mt-1">
                    These access entries point to resources that no longer exist
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  {analysis.orphanedAccess.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-background border border-destructive rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-small font-bold text-destructive">
                            {entry.resource_type === "project" ? "📊" : "📁"}{" "}
                            {entry.resource_type}
                          </span>
                          <span className="ml-2 text-small text-text-secondary">
                            ID: {entry.resource_id}
                          </span>
                        </div>
                        <span className="px-2 py-1 text-small bg-secondary text-text-secondary rounded">
                          {entry.access_level}
                        </span>
                      </div>
                      <div className="text-small text-text-primary">
                        <strong>User:</strong> {entry.user_email}
                      </div>
                      <div className="text-small text-text-secondary mt-1">
                        Granted by: {entry.granted_by} • Created:{" "}
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources with Access Control */}
            <div className="space-y-4">
              {analysis.resources.map((resource) => {
                const hasCreatorIssue = resource.issues.some(
                  (issue) =>
                    issue.type === "missing_access" &&
                    issue.severity === "error"
                );

                return (
                  <div
                    key={resource.resource.id}
                    className={`border rounded-lg overflow-hidden ${
                      resource.issues.length > 0
                        ? "bg-primary border-border"
                        : "bg-primary border-border"
                    }`}
                  >
                    <div
                      className={`px-6 py-4 ${
                        resource.issues.length > 0
                          ? "bg-primary"
                          : "bg-secondary"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-medium font-bold text-text-primary flex items-center gap-2">
                            {resource.resourceType === "project" ? "📊" : "📁"}{" "}
                            {resource.resource.name}
                            <span className="text-small font-normal text-text-secondary">
                              ({resource.resourceType})
                            </span>
                          </h3>
                          <div className="text-small text-text-secondary mt-1">
                            Creator: {resource.resource.creator_id} • Created:{" "}
                            {new Date(
                              resource.resource.created_at
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-small text-text-secondary">
                          {resource.accessEntries.length} user
                          {resource.accessEntries.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {/* Issues */}
                      {resource.issues.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {resource.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className={`text-small px-3 py-2 rounded flex justify-between items-center ${
                                issue.severity === "error"
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-primary text-text-primary"
                              }`}
                            >
                              <span>
                                {issue.severity === "error" ? "❌" : "⚠️"}{" "}
                                {issue.message}
                              </span>
                              {hasCreatorIssue &&
                                issue.severity === "error" && (
                                  <button
                                    onClick={() =>
                                      fixResourceAccess(
                                        resource.resource.id,
                                        resource.resourceType,
                                        resource.resource.creator_id,
                                        resource.resource.name
                                      )
                                    }
                                    disabled={fixing}
                                    className="ml-3 px-3 py-1 bg-primary disabled:bg-secondary disabled:cursor-not-allowed rounded text-medium transition-colors"
                                  >
                                    {fixing ? "⏳" : "Fix"}
                                  </button>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Access List */}
                    <div className="p-6">
                      {resource.accessEntries.length > 0 && (
                        <div className="grid gap-3 mb-4">
                          {resource.accessEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="bg-background border border-border rounded-lg p-4 flex justify-between items-center gap-4"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-medium text-text-primary truncate">
                                  {entry.user_email}
                                </div>
                                <div className="text-small text-text-secondary mt-1">
                                  Granted by: {entry.granted_by} •{" "}
                                  {new Date(
                                    entry.created_at
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={entry.access_level}
                                  onChange={(e) => {
                                    updateAccessLevel(
                                      entry.id,
                                      e.target.value as
                                        | "owner"
                                        | "editor"
                                        | "viewer",
                                      entry.user_email,
                                      resource.resource.name
                                    );
                                  }}
                                  disabled={fixing}
                                  className={`px-3 py-1 text-medium rounded border-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                                    entry.access_level === "owner"
                                      ? "bg-primary text-text-primary border-border"
                                      : entry.access_level === "editor"
                                        ? "bg-primary text-text-primary border-border"
                                        : "bg-secondary text-text-secondary border-border"
                                  }`}
                                >
                                  <option value="viewer">viewer</option>
                                  <option value="editor">editor</option>
                                  <option value="owner">owner</option>
                                </select>
                                <button
                                  onClick={() =>
                                    removeUserAccess(
                                      entry.id,
                                      entry.user_email,
                                      resource.resource.name
                                    )
                                  }
                                  disabled={fixing}
                                  className="px-3 py-1 bg-destructive hover:bg-destructive/80 disabled:bg-secondary disabled:cursor-not-allowed rounded text-medium transition-colors"
                                  title="Remove user"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add User Form */}
                      <div className="bg-background border border-border rounded-lg p-4">
                        <h4 className="text-small font-bold text-text-primary mb-3">
                          ➕ Add User
                        </h4>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const email = formData.get("email") as string;
                            const accessLevel = formData.get("accessLevel") as
                              | "owner"
                              | "editor"
                              | "viewer";
                            if (email) {
                              addUserToResource(
                                resource.resource.id,
                                resource.resourceType,
                                email,
                                accessLevel,
                                resource.resource.name
                              );
                              e.currentTarget.reset();
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            name="email"
                            placeholder="user.name or email@shopify.com"
                            className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-small text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-border"
                            disabled={fixing}
                          />
                          <select
                            name="accessLevel"
                            className="px-3 py-2 bg-secondary border border-border rounded text-small text-text-primary focus:outline-none focus:ring-2 focus:ring-border"
                            disabled={fixing}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="owner">Owner</option>
                          </select>
                          <button
                            type="submit"
                            disabled={fixing}
                            className="px-4 py-2 bg-primary disabled:bg-secondary disabled:cursor-not-allowed rounded text-medium transition-colors"
                          >
                            {fixing ? "⏳" : "Add"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "raw" && (
          <div className="space-y-6">
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all collections..."
                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-border"
              />
            </div>

            <div className="grid grid-cols-5 gap-4 mb-6">
              {COLLECTIONS.map((name) => (
                <div
                  key={name}
                  className="bg-primary border border-border rounded-lg p-4"
                >
                  <div className="text-small text-text-secondary uppercase tracking-wider mb-2">
                    {name}
                  </div>
                  <div className="text-3xl font-bold text-text-primary">
                    {data[name]?.length || 0}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {COLLECTIONS.map((collectionName) => {
                const collectionData = filterData(data[collectionName] || []);
                const totalCount = data[collectionName]?.length || 0;
                const filteredCount = collectionData.length;

                return (
                  <div
                    key={collectionName}
                    className="bg-primary border border-border rounded-lg overflow-hidden"
                  >
                    <div className="bg-secondary px-6 py-4 flex justify-between items-center">
                      <h2 className="text-medium font-bold text-text-primary">
                        {collectionName}
                      </h2>
                      <div className="text-small text-text-secondary">
                        {filteredCount === totalCount
                          ? `${totalCount} documents`
                          : `${filteredCount} / ${totalCount} documents`}
                      </div>
                    </div>
                    <div className="p-6 max-h-[600px] overflow-y-auto">
                      {collectionData.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary italic">
                          {totalCount === 0
                            ? "No documents"
                            : "No documents match search"}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {collectionData.map((doc) => (
                            <div
                              key={doc.id}
                              className="bg-background border border-border rounded-lg p-4"
                            >
                              <div className="font-bold text-text-primary text-small mb-2">
                                ID: {doc.id}
                              </div>
                              <pre className="text-small text-text-primary overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(doc, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
