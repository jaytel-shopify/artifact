"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Database, FileJson, Search } from "lucide-react";
import type { CollectionInfo } from "@/lib/database-explorer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DatabaseTableViewProps {
  collections: CollectionInfo[];
  loading: boolean;
}

export function DatabaseTableView({ collections, loading }: DatabaseTableViewProps) {
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading database collections...</p>
        </div>
      </div>
    );
  }

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search collections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Collections Table */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-sm text-foreground">Collection</th>
              <th className="text-left px-4 py-3 font-medium text-sm text-foreground">Documents</th>
              <th className="text-left px-4 py-3 font-medium text-sm text-foreground">Fields</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-background">
            {filteredCollections.map((collection) => (
              <CollectionRow
                key={collection.name}
                collection={collection}
                isExpanded={expandedCollection === collection.name}
                onToggle={() => setExpandedCollection(
                  expandedCollection === collection.name ? null : collection.name
                )}
              />
            ))}
          </tbody>
        </table>
      </div>

      {filteredCollections.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No collections found</p>
        </div>
      )}
    </div>
  );
}

interface CollectionRowProps {
  collection: CollectionInfo;
  isExpanded: boolean;
  onToggle: () => void;
}

function CollectionRow({ collection, isExpanded, onToggle }: CollectionRowProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "json">("table");
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(collection.documents.length / itemsPerPage);
  const paginatedDocs = collection.documents.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <>
      <tr 
        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Database className="h-4 w-4 text-primary" />
            <span className="font-mono font-semibold text-foreground">{collection.name}</span>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
            {collection.documentCount}
          </span>
        </td>
        <td className="px-4 py-3.5 text-sm text-muted-foreground">
          {collection.schema.length}
        </td>
        <td className="px-4 py-3.5">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </td>
      </tr>
      
      {isExpanded && (
        <tr className="border-b bg-muted/30">
          <td colSpan={4} className="p-0">
            <div className="p-6 space-y-5 bg-slate-50">
              {/* Schema */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <FileJson className="h-4 w-4" />
                  Schema
                </h4>
                <div className="bg-background border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                  {collection.schema.map((field) => (
                    <div key={field.name} className="flex items-start gap-2.5 text-sm font-mono">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold min-w-[120px]">{field.name}:</span>
                      <span className="text-blue-600 dark:text-blue-400">{field.type}</span>
                      {field.nullable && (
                        <span className="text-orange-600 dark:text-orange-400 text-xs">| null</span>
                      )}
                    </div>
                  ))}
                  {collection.schema.length === 0 && (
                    <p className="text-sm text-muted-foreground">No documents to infer schema</p>
                  )}
                </div>
              </div>

              {/* View Mode Toggle */}
              {collection.documentCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">View:</span>
                  <Button
                    size="sm"
                    variant={viewMode === "table" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode("table");
                    }}
                  >
                    Table
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "json" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode("json");
                    }}
                  >
                    JSON
                  </Button>
                </div>
              )}

              {/* Documents */}
              {collection.documentCount > 0 ? (
                <>
                  {viewMode === "table" ? (
                    <DocumentsTable documents={paginatedDocs} schema={collection.schema} />
                  ) : (
                    <DocumentsJSON documents={paginatedDocs} />
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage(Math.max(0, currentPage - 1));
                          }}
                          disabled={currentPage === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
                          }}
                          disabled={currentPage === totalPages - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">No documents in this collection</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DocumentsTable({ documents, schema }: { documents: any[]; schema: any[] }) {
  // Show first 6 fields for table view
  const displayFields = schema.slice(0, 6).map(f => f.name);
  
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-y-auto max-h-96">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-muted sticky top-0">
            <tr>
              {displayFields.map((field) => (
                <th key={field} className="text-left px-3 py-2.5 font-mono text-xs font-semibold text-foreground truncate">
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background">
            {documents.map((doc, idx) => (
              <tr key={doc.id || idx} className="border-t hover:bg-muted/30">
                {displayFields.map((field) => (
                  <td key={field} className="px-3 py-2.5 font-mono text-xs text-foreground truncate" title={formatValue(doc[field])}>
                    {formatValue(doc[field])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsJSON({ documents }: { documents: any[] }) {
  return (
    <div className="bg-slate-950 border rounded-md p-4 overflow-y-auto max-h-96">
      <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap break-all">{JSON.stringify(documents, null, 2)}</pre>
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && value.length > 50) return value.substring(0, 47) + "...";
  return String(value);
}

