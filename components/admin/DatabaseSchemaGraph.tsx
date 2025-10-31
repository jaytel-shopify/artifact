"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Database } from "lucide-react";
import type { CollectionInfo } from "@/lib/database-explorer";
import { DATABASE_RELATIONSHIPS } from "@/lib/database-explorer";

interface DatabaseSchemaGraphProps {
  collections: CollectionInfo[];
  loading: boolean;
}

export function DatabaseSchemaGraph({ collections, loading }: DatabaseSchemaGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return generateNodesAndEdges(collections);
  }, [collections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Highlight connected nodes
    const connectedEdges = edges.filter(
      (edge) => edge.source === node.id || edge.target === node.id
    );
    const connectedNodeIds = new Set(
      connectedEdges.flatMap((edge) => [edge.source, edge.target])
    );

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: connectedNodeIds.has(n.id) ? 1 : 0.3,
        },
      }))
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: connectedEdges.some((ce) => ce.id === e.id) ? 1 : 0.1,
        },
      }))
    );
  }, [edges, setNodes, setEdges]);

  const onPaneClick = useCallback(() => {
    // Reset highlight
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
        },
      }))
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: 1,
        },
      }))
    );
  }, [setNodes, setEdges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading schema graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-slate-50/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#94a3b8" gap={16} />
        <Controls />
        <Panel position="top-right" className="bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border">
          <div className="text-xs space-y-3">
            <div className="font-semibold text-sm text-foreground">Legend</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-foreground">Core Collections</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-foreground">Access Control</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span className="text-foreground">Folders</span>
              </div>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              Click nodes to highlight
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

function generateNodesAndEdges(collections: CollectionInfo[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Define layout positions for each collection
  const positions: Record<string, { x: number; y: number; color: string }> = {
    projects: { x: 400, y: 200, color: "#3b82f6" }, // blue - center
    pages: { x: 400, y: 350, color: "#3b82f6" }, // blue
    artifacts: { x: 400, y: 500, color: "#3b82f6" }, // blue
    project_access: { x: 700, y: 200, color: "#22c55e" }, // green
    folders: { x: 100, y: 200, color: "#a855f7" }, // purple
    folder_access: { x: 100, y: 350, color: "#22c55e" }, // green
    allowed_users: { x: 700, y: 350, color: "#22c55e" }, // green
  };

  // Create nodes
  collections.forEach((collection) => {
    const position = positions[collection.name] || { x: 0, y: 0, color: "#6b7280" };
    
    nodes.push({
      id: collection.name,
      type: "default",
      position: { x: position.x, y: position.y },
      data: {
        label: (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4" style={{ color: position.color }} />
              <span className="font-semibold font-mono text-sm">{collection.name}</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {collection.documentCount} doc{collection.documentCount !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">
              {collection.schema.length} field{collection.schema.length !== 1 ? "s" : ""}
            </div>
          </div>
        ),
      },
      style: {
        background: "white",
        border: `2px solid ${position.color}`,
        borderRadius: "8px",
        padding: "0",
        width: "auto",
        minWidth: "190px",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      },
    });
  });

  // Create edges based on relationships
  DATABASE_RELATIONSHIPS.forEach((rel, idx) => {
    edges.push({
      id: `edge-${idx}`,
      source: rel.from,
      target: rel.to,
      type: "smoothstep",
      animated: true,
      label: rel.label,
      labelStyle: {
        fontSize: 11,
        fill: "#6b7280",
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: "white",
        fillOpacity: 0.9,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: "#6b7280",
      },
      style: {
        stroke: "#6b7280",
        strokeWidth: 2,
      },
    });
  });

  return { nodes, edges };
}

