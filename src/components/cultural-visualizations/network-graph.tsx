"use client";

import { useRef, useState } from "react";
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

// Type for library's node object (generic with our properties)
type LibraryNode = Record<string, unknown> & {
  id?: string | number;
  name?: string;
  country?: string;
  countryCode?: string;
  groupId?: string;
  groupNumber?: number;
};

// Type for library's link object (generic with our properties)
type LibraryLink = Record<string, unknown> & {
  distance?: number;
};

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
      // Color by group number
      const hue = (node.groupNumber * 137.508) % 360; // Golden angle for color distribution
      return `hsl(${hue}, 70%, 50%)`;
    }
    return "#6b7280"; // Gray for ungrouped
  };

  // Edge color based on distance
  const getEdgeColor = (link: LibraryLink): string => {
    const maxDistance = Math.max(...data.links.map((l) => l.distance), 1);
    const linkDistance = typeof link.distance === "number" ? link.distance : 0;
    const normalizedDistance = linkDistance / maxDistance;
    const opacity = Math.max(0.2, normalizedDistance);
    return `rgba(107, 114, 128, ${opacity})`;
  };

  // Edge width based on distance
  const getEdgeWidth = (link: LibraryLink): number => {
    const maxDistance = Math.max(...data.links.map((l) => l.distance), 1);
    const linkDistance = typeof link.distance === "number" ? link.distance : 0;
    const normalizedDistance = linkDistance / maxDistance;
    return Math.max(1, normalizedDistance * 3);
  };

  const handleNodeClick = (node: LibraryNode) => {
    // Convert to our GraphNode type for the callback
    if (
      typeof node.id === "string" &&
      typeof node.name === "string" &&
      typeof node.country === "string" &&
      typeof node.countryCode === "string"
    ) {
      const graphNode: GraphNode = {
        id: node.id,
        name: node.name,
        country: node.country,
        countryCode: node.countryCode,
        groupId: typeof node.groupId === "string" ? node.groupId : undefined,
        groupNumber:
          typeof node.groupNumber === "number" ? node.groupNumber : undefined,
      };
      onNodeClick?.(graphNode);
    }
  };

  const handleNodeHover = (node: LibraryNode | null) => {
    if (
      node &&
      typeof node.id === "string" &&
      typeof node.name === "string" &&
      typeof node.country === "string" &&
      typeof node.countryCode === "string"
    ) {
      // Convert to our GraphNode type
      const graphNode: GraphNode = {
        id: node.id,
        name: node.name,
        country: node.country,
        countryCode: node.countryCode,
        groupId: typeof node.groupId === "string" ? node.groupId : undefined,
        groupNumber:
          typeof node.groupNumber === "number" ? node.groupNumber : undefined,
      };
      setHoveredNode(graphNode);
      onNodeHover?.(graphNode);
    } else {
      setHoveredNode(null);
      onNodeHover?.(null);
    }
  };

  return (
    <div className={cn("w-full h-full min-h-[500px]", className)}>
      <ForceGraph2D
        // @ts-expect-error - react-force-graph-2d has complex ref types that require full ForceGraphMethods interface, but we only use zoomToFit which exists at runtime
        ref={graphRef}
        graphData={data}
        nodeLabel={(node: LibraryNode) => {
          const name = typeof node.name === "string" ? node.name : "";
          const country = typeof node.country === "string" ? node.country : "";
          return `${name} (${country})`;
        }}
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
