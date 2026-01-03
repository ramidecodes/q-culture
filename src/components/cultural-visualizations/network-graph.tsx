"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

  // Pre-compute max distance for normalization
  const maxDistance = useMemo(
    () => Math.max(...data.links.map((l) => l.distance), 1),
    [data.links]
  );

  // Distinct color palette for countries
  const countryColorPalette = useMemo(
    () => [
      "#e6194b", // Red
      "#3cb44b", // Green
      "#ffe119", // Yellow
      "#4363d8", // Blue
      "#f58231", // Orange
      "#911eb4", // Purple
      "#46f0f0", // Cyan
      "#f032e6", // Magenta
      "#bcf60c", // Lime
      "#fabebe", // Pink
      "#008080", // Teal
      "#e6beff", // Lavender
      "#9a6324", // Brown
      "#fffac8", // Beige
      "#800000", // Maroon
      "#aaffc3", // Mint
      "#808000", // Olive
      "#ffd8b1", // Peach
      "#000075", // Navy
      "#808080", // Gray
    ],
    []
  );

  // Create country-to-color mapping
  const countryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueCountries = Array.from(
      new Set(data.nodes.map((n) => n.countryCode))
    ).sort();

    uniqueCountries.forEach((countryCode, index) => {
      map.set(
        countryCode,
        countryColorPalette[index % countryColorPalette.length]
      );
    });

    return map;
  }, [data.nodes, countryColorPalette]);

  // Get country info for legend
  const countryLegend = useMemo(() => {
    const countries = new Map<string, { code: string; name: string }>();
    for (const node of data.nodes) {
      if (!countries.has(node.countryCode)) {
        countries.set(node.countryCode, {
          code: node.countryCode,
          name: node.country,
        });
      }
    }
    return Array.from(countries.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [data.nodes]);

  // Get unique group numbers for legend
  const groupNumbers = useMemo(() => {
    const groups = new Set<number>();
    for (const node of data.nodes) {
      if (node.groupNumber !== undefined) {
        groups.add(node.groupNumber);
      }
    }
    return Array.from(groups).sort((a, b) => a - b);
  }, [data.nodes]);

  // Color scale for groups with better palette
  const getGroupColor = useCallback((groupNumber: number): string => {
    // Use a more distinct color palette
    const colors = [
      "#3b82f6", // Blue
      "#10b981", // Green
      "#f59e0b", // Amber
      "#ef4444", // Red
      "#8b5cf6", // Purple
      "#ec4899", // Pink
      "#06b6d4", // Cyan
      "#84cc16", // Lime
    ];
    return colors[(groupNumber - 1) % colors.length];
  }, []);

  // Color nodes by country (with special states for selected/hovered)
  const getNodeColor = useCallback(
    (node: LibraryNode): string => {
      const nodeId = String(node.id ?? "");
      const graphNode = toGraphNode(node);

      // Special states override country color
      if (nodeId === selectedNodeId) {
        return "#3b82f6"; // Blue for selected
      }
      if (hoveredNode?.id === nodeId) {
        return "#10b981"; // Green for hovered
      }

      // Color by country
      const countryColor = countryColorMap.get(graphNode.countryCode);
      return countryColor ?? "#6b7280"; // Gray fallback
    },
    [selectedNodeId, hoveredNode, countryColorMap]
  );

  // Edge color based on distance (inverse) - darker/thicker for SMALLER distances (stronger similarity)
  const getEdgeColor = useCallback(
    (link: LibraryLink): string => {
      const linkDistance =
        (link as LibraryLink & Partial<GraphLink>).distance ?? 0;
      // Invert: close distance = high opacity, far distance = low opacity
      const normalized = linkDistance / maxDistance;
      const inverseNormalized = 1 - normalized;
      // Strong connections (close) = darker and more opaque
      const opacity = Math.max(
        0.2,
        Math.min(0.9, 0.3 + inverseNormalized * 0.6)
      );
      const lightness = Math.max(20, 100 - inverseNormalized * 60);
      return `hsl(0, 0%, ${lightness}%, ${opacity})`;
    },
    [maxDistance]
  );

  // Edge width based on distance (inverse) - thicker for SMALLER distances (stronger similarity)
  const getEdgeWidth = useCallback(
    (link: LibraryLink): number => {
      const linkDistance =
        (link as LibraryLink & Partial<GraphLink>).distance ?? 0;
      // Invert: close distance = thick, far distance = thin
      const normalized = linkDistance / maxDistance;
      const inverseNormalized = 1 - normalized;
      // Strong connections (close) = thicker edges
      return Math.max(0.5, Math.min(5, 1 + inverseNormalized * 4));
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

  const getLinkLabel = useCallback((link: LibraryLink): string => {
    const linkDistance =
      (link as LibraryLink & Partial<GraphLink>).distance ?? 0;
    return `Distance: ${linkDistance.toFixed(3)}`;
  }, []);

  const handleEngineStop = useCallback(() => {
    graphRef.current?.zoomToFit(400);
  }, []);

  // Track container dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Custom node rendering with labels
  const renderNode = useCallback(
    (node: LibraryNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const graphNode = toGraphNode(node);
      const label = graphNode.name || "";
      const fontSize = 12 / globalScale;
      const nodeSize = 6;
      const nodeColor = getNodeColor(node);

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();

      // Draw label below node
      if (globalScale > 0.5) {
        // Only show labels when zoomed in enough
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#e5e7eb"; // Light gray for dark background
        ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + nodeSize + 2);
      }
    },
    [getNodeColor]
  );

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ aspectRatio: "16/9", minHeight: "500px" }}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={data}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel={getNodeLabel}
          nodeColor={getNodeColor}
          nodeVal={1}
          nodeRelSize={4}
          nodeCanvasObject={renderNode}
          nodeCanvasObjectMode={() => "replace"}
          linkColor={getEdgeColor}
          linkWidth={getEdgeWidth}
          linkLabel={getLinkLabel}
          linkDirectionalArrowLength={0}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.1}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          // biome-ignore lint/suspicious/noExplicitAny: d3Force types are incomplete
          // @ts-expect-error - d3Force is valid but types may be outdated
          d3Force={(
            forceName: string,
            force: {
              distance: (
                fn: (link: LibraryLink & Partial<GraphLink>) => number
              ) => void;
            }
          ) => {
            if (forceName === "link") {
              // Set link distance proportional to cultural distance
              // Scale factor: multiply distance by ~100-200 to get reasonable pixel distances
              force.distance((link: LibraryLink & Partial<GraphLink>) => {
                const distance = link.distance ?? 0;
                // Scale cultural distance to visual distance (pixels)
                // Closer cultures = shorter visual links
                return Math.max(30, distance * 150);
              });
            }
          }}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          cooldownTicks={100}
          onEngineStop={handleEngineStop}
          backgroundColor="transparent"
        />
      </div>

      {/* Legend */}
      {(countryLegend.length > 0 ||
        groupNumbers.length > 0 ||
        selectedNodeId ||
        hoveredNode) && (
        <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg border bg-muted/30 text-sm">
          {countryLegend.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">
                Countries:
              </span>
              {countryLegend.map((country) => (
                <div key={country.code} className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-background"
                    style={{
                      backgroundColor:
                        countryColorMap.get(country.code) ?? "#6b7280",
                    }}
                  />
                  <span className="text-xs">{country.name}</span>
                </div>
              ))}
            </div>
          )}
          {groupNumbers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">
                Groups:
              </span>
              {groupNumbers.map((groupNum) => (
                <div key={groupNum} className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-background"
                    style={{ backgroundColor: getGroupColor(groupNum) }}
                  />
                  <span className="text-xs">Group {groupNum}</span>
                </div>
              ))}
            </div>
          )}
          {selectedNodeId && (
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-background" />
              <span className="text-xs">Selected</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Edge thickness and darkness indicate similarity (thicker = closer
              culturally)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
