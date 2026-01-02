"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import type {
  ForceGraphMethods,
  NodeObject,
  LinkObject,
} from "react-force-graph-2d";
import type {
  GraphData,
  GraphNode,
  GraphLink,
} from "@/lib/utils/visualization-data";
import { cn } from "@/lib/utils";

// Dynamic import with ssr: false is necessary because react-force-graph-2d
// uses browser-only APIs (Canvas, D3) that don't exist during server-side rendering.
// Even with "use client", Next.js pre-renders Client Components on the server.
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  { ssr: false }
);

// Type aliases for the library's generic node/link types
type LibraryNode = NodeObject;
type LibraryLink = LinkObject;

/**
 * Type guard to check if a library node has our GraphNode properties
 */
function isGraphNode(node: LibraryNode): node is LibraryNode & GraphNode {
  return (
    typeof node.id === "string" &&
    typeof (node as GraphNode).name === "string" &&
    typeof (node as GraphNode).country === "string" &&
    typeof (node as GraphNode).countryCode === "string"
  );
}

/**
 * Extracts GraphNode from library node, assuming data contains our properties
 */
function toGraphNode(node: LibraryNode): GraphNode {
  const n = node as LibraryNode & Partial<GraphNode>;
  return {
    id: String(node.id ?? ""),
    name: n.name ?? "",
    country: n.country ?? "",
    countryCode: n.countryCode ?? "",
    groupId: n.groupId,
    groupNumber: n.groupNumber,
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
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Pre-compute max distance for normalization
  const maxDistance = useMemo(
    () => Math.max(...data.links.map((l) => l.distance), 1),
    [data.links]
  );

  // Color scale for groups
  const getNodeColor = useCallback(
    (node: LibraryNode): string => {
      const nodeId = String(node.id ?? "");
      if (nodeId === selectedNodeId) {
        return "#3b82f6"; // Blue for selected
      }
      if (hoveredNode?.id === nodeId) {
        return "#10b981"; // Green for hovered
      }
      const groupNumber = (node as LibraryNode & Partial<GraphNode>)
        .groupNumber;
      if (typeof groupNumber === "number") {
        // Color by group number using golden angle for distribution
        const hue = (groupNumber * 137.508) % 360;
        return `hsl(${hue}, 70%, 50%)`;
      }
      return "#6b7280"; // Gray for ungrouped
    },
    [selectedNodeId, hoveredNode]
  );

  // Edge color based on distance (normalized)
  const getEdgeColor = useCallback(
    (link: LibraryLink): string => {
      const linkDistance =
        (link as LibraryLink & Partial<GraphLink>).distance ?? 0;
      const opacity = Math.max(0.2, linkDistance / maxDistance);
      return `rgba(107, 114, 128, ${opacity})`;
    },
    [maxDistance]
  );

  // Edge width based on distance (normalized)
  const getEdgeWidth = useCallback(
    (link: LibraryLink): number => {
      const linkDistance =
        (link as LibraryLink & Partial<GraphLink>).distance ?? 0;
      return Math.max(1, (linkDistance / maxDistance) * 3);
    },
    [maxDistance]
  );

  const handleNodeClick = useCallback(
    (node: LibraryNode) => {
      if (isGraphNode(node)) {
        onNodeClick?.(toGraphNode(node));
      }
    },
    [onNodeClick]
  );

  const handleNodeHover = useCallback(
    (node: LibraryNode | null) => {
      if (node && isGraphNode(node)) {
        const graphNode = toGraphNode(node);
        setHoveredNode(graphNode);
        onNodeHover?.(graphNode);
      } else {
        setHoveredNode(null);
        onNodeHover?.(null);
      }
    },
    [onNodeHover]
  );

  const getNodeLabel = useCallback((node: LibraryNode): string => {
    const n = node as LibraryNode & Partial<GraphNode>;
    return `${n.name ?? ""} (${n.country ?? ""})`;
  }, []);

  const handleEngineStop = useCallback(() => {
    graphRef.current?.zoomToFit(400);
  }, []);

  return (
    <div className={cn("w-full h-full min-h-[500px]", className)}>
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeLabel={getNodeLabel}
        nodeColor={getNodeColor}
        nodeVal={() => 8}
        linkColor={getEdgeColor}
        linkWidth={getEdgeWidth}
        linkDirectionalArrowLength={0}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        onEngineStop={handleEngineStop}
      />
    </div>
  );
}
