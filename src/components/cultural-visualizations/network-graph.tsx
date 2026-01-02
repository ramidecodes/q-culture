"use client";

import { useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { GraphData, GraphNode } from "@/lib/utils/visualization-data";
import { cn } from "@/lib/utils";

// Dynamic import with ssr: false is necessary because react-force-graph-2d
// uses browser-only APIs (Canvas, D3) that don't exist during server-side rendering.
// Even with "use client", Next.js pre-renders Client Components on the server.
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  { ssr: false }
);

/**
 * Library node type - the library uses Record<string, unknown> internally
 * but our data includes these known properties
 */
type LibraryNode = Record<string, unknown> & Partial<GraphNode>;

/**
 * Library link type with our distance property
 */
type LibraryLink = Record<string, unknown> & {
  distance?: number;
};

/**
 * Converts a library node to our typed GraphNode, returning null if invalid
 */
function toGraphNode(node: LibraryNode): GraphNode | null {
  if (
    typeof node.id !== "string" ||
    typeof node.name !== "string" ||
    typeof node.country !== "string" ||
    typeof node.countryCode !== "string"
  ) {
    return null;
  }

  return {
    id: node.id,
    name: node.name,
    country: node.country,
    countryCode: node.countryCode,
    groupId: typeof node.groupId === "string" ? node.groupId : undefined,
    groupNumber:
      typeof node.groupNumber === "number" ? node.groupNumber : undefined,
  };
}

type NetworkGraphProps = {
  data: GraphData;
  selectedNodeId?: string;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  className?: string;
};

export function NetworkGraph({
  data,
  selectedNodeId,
  onNodeClick,
  onNodeHover,
  className,
}: NetworkGraphProps) {
  const graphRef = useRef<Record<string, unknown> | undefined>(undefined);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Pre-compute max distance for normalization
  const maxDistance = useMemo(
    () => Math.max(...data.links.map((l) => l.distance), 1),
    [data.links]
  );

  // Color scale for groups
  const getNodeColor = (node: LibraryNode): string => {
    const nodeId = String(node.id ?? "");
    if (nodeId === selectedNodeId) {
      return "#3b82f6"; // Blue for selected
    }
    if (hoveredNode?.id === nodeId) {
      return "#10b981"; // Green for hovered
    }
    if (typeof node.groupNumber === "number") {
      // Color by group number using golden angle for distribution
      const hue = (node.groupNumber * 137.508) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    }
    return "#6b7280"; // Gray for ungrouped
  };

  // Edge color based on distance (normalized)
  const getEdgeColor = (link: LibraryLink): string => {
    const linkDistance = typeof link.distance === "number" ? link.distance : 0;
    const opacity = Math.max(0.2, linkDistance / maxDistance);
    return `rgba(107, 114, 128, ${opacity})`;
  };

  // Edge width based on distance (normalized)
  const getEdgeWidth = (link: LibraryLink): number => {
    const linkDistance = typeof link.distance === "number" ? link.distance : 0;
    return Math.max(1, (linkDistance / maxDistance) * 3);
  };

  const handleNodeClick = (node: LibraryNode) => {
    const graphNode = toGraphNode(node);
    if (graphNode) {
      onNodeClick?.(graphNode);
    }
  };

  const handleNodeHover = (node: LibraryNode | null) => {
    if (node) {
      const graphNode = toGraphNode(node);
      setHoveredNode(graphNode);
      onNodeHover?.(graphNode);
    } else {
      setHoveredNode(null);
      onNodeHover?.(null);
    }
  };

  const getNodeLabel = (node: LibraryNode): string => {
    const name = typeof node.name === "string" ? node.name : "";
    const country = typeof node.country === "string" ? node.country : "";
    return `${name} (${country})`;
  };

  return (
    <div className={cn("w-full h-full min-h-[500px]", className)}>
      <ForceGraph2D
        // @ts-expect-error - react-force-graph-2d ref types require full ForceGraphMethods interface
        ref={graphRef}
        graphData={data}
        nodeLabel={getNodeLabel}
        nodeColor={getNodeColor}
        nodeVal={() => 8}
        linkColor={getEdgeColor as (link: Record<string, unknown>) => string}
        linkWidth={getEdgeWidth as (link: Record<string, unknown>) => number}
        linkDirectionalArrowLength={0}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        onEngineStop={() => {
          if (
            graphRef.current &&
            typeof graphRef.current.zoomToFit === "function"
          ) {
            graphRef.current.zoomToFit(400);
          }
        }}
      />
    </div>
  );
}
