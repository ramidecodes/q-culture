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
import type { Framework } from "@/types/cultural";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  framework?: Framework;
};

export function NetworkGraph({
  data,
  selectedNodeId,
  onNodeClick,
  onNodeHover,
  className,
  framework,
}: NetworkGraphProps) {
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [edgeMode, setEdgeMode] = useState<"aggregate" | "dimensional">(
    "aggregate"
  );

  // Pre-compute max distance for normalization
  const maxDistance = useMemo(
    () => Math.max(...data.links.map((l) => l.distance), 1),
    [data.links]
  );

  // Dimension color mapping
  const getDimensionColor = useCallback(
    (dimension: string, framework?: Framework): string => {
      // Hofstede dimensions
      if (framework === "hofstede") {
        const hofstedeColors: Record<string, string> = {
          powerDistance: "#e6194b", // Red
          individualism: "#3cb44b", // Green
          masculinity: "#ffe119", // Yellow
          uncertaintyAvoidance: "#4363d8", // Blue
          longTermOrientation: "#f58231", // Orange
          indulgence: "#911eb4", // Purple
        };
        return hofstedeColors[dimension] ?? "#808080";
      }

      // Lewis dimensions
      if (framework === "lewis") {
        const lewisColors: Record<string, string> = {
          linearActive: "#3cb44b", // Green
          multiActive: "#f58231", // Orange
          reactive: "#4363d8", // Blue
        };
        return lewisColors[dimension] ?? "#808080";
      }

      // Hall dimensions
      if (framework === "hall") {
        const hallColors: Record<string, string> = {
          contextHigh: "#e6194b", // Red
          timePolychronic: "#3cb44b", // Green
          spacePrivate: "#4363d8", // Blue
        };
        return hallColors[dimension] ?? "#808080";
      }

      // Combined framework - use a cycling palette
      if (framework === "combined") {
        const combinedPalette = [
          "#e6194b", // Red
          "#3cb44b", // Green
          "#ffe119", // Yellow
          "#4363d8", // Blue
          "#f58231", // Orange
          "#911eb4", // Purple
          "#46f0f0", // Cyan
          "#f032e6", // Magenta
        ];
        // Use a hash-like approach to assign consistent colors
        let hash = 0;
        for (let i = 0; i < dimension.length; i++) {
          hash = dimension.charCodeAt(i) + ((hash << 5) - hash);
        }
        return combinedPalette[Math.abs(hash) % combinedPalette.length];
      }

      return "#808080"; // Gray fallback
    },
    []
  );

  // Transform graph data based on edge mode
  const transformedGraphData = useMemo(() => {
    if (edgeMode === "aggregate" || !framework) {
      return data;
    }

    // In dimensional mode, expand each link into multiple links (one per dimension)
    const expandedLinks: GraphLink[] = [];

    for (const link of data.links) {
      const dimDists = link.dimensionalDistances;
      if (dimDists && dimDists.length > 0) {
        // Create one link per dimension
        dimDists.forEach((dimDist, index) => {
          // Calculate curvature offset to fan out edges
          // Spread from -0.3 to 0.3 based on index
          const totalDims = dimDists.length;
          const curvatureOffset =
            totalDims > 1 ? -0.3 + (index / (totalDims - 1)) * 0.6 : 0;

          expandedLinks.push({
            source: link.source,
            target: link.target,
            distance: dimDist.distance,
            // Store dimension info in the link for rendering
            dimension: dimDist.dimension,
            dimensionLabel: dimDist.label,
            sourceValue: dimDist.sourceValue,
            targetValue: dimDist.targetValue,
            curvature: curvatureOffset,
          } as GraphLink & {
            dimension: string;
            dimensionLabel: string;
            sourceValue?: number;
            targetValue?: number;
            curvature: number;
          });
        });
      } else {
        // If no dimensional data, keep the original link
        expandedLinks.push(link);
      }
    }

    return {
      nodes: data.nodes,
      links: expandedLinks,
    };
  }, [data, edgeMode, framework]);

  // Get all unique dimensions for legend
  const dimensionLegend = useMemo(() => {
    if (edgeMode !== "dimensional" || !framework) {
      return [];
    }

    const dimensions = new Map<string, string>();
    for (const link of data.links) {
      if (link.dimensionalDistances) {
        for (const dimDist of link.dimensionalDistances) {
          if (!dimensions.has(dimDist.dimension)) {
            dimensions.set(dimDist.dimension, dimDist.label);
          }
        }
      }
    }

    return Array.from(dimensions.entries())
      .map(([dim, label]) => ({
        dimension: dim,
        label,
        color: getDimensionColor(dim, framework),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data.links, edgeMode, framework, getDimensionColor]);

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
      const graphLink = link as LibraryLink &
        Partial<GraphLink> & {
          dimension?: string;
          dimensionLabel?: string;
        };

      // In dimensional mode, use dimension color
      if (edgeMode === "dimensional" && graphLink.dimension && framework) {
        const dimensionColor = getDimensionColor(
          graphLink.dimension,
          framework
        );
        const linkDistance = graphLink.distance ?? 0;
        // Normalize dimensional distance (already 0-1)
        const normalized = linkDistance;
        const inverseNormalized = 1 - normalized;
        // Strong connections (close) = more opaque
        const opacity = Math.max(
          0.3,
          Math.min(0.9, 0.4 + inverseNormalized * 0.5)
        );
        // Convert hex to rgba
        const r = parseInt(dimensionColor.slice(1, 3), 16);
        const g = parseInt(dimensionColor.slice(3, 5), 16);
        const b = parseInt(dimensionColor.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }

      // Aggregate mode: gray scale based on distance
      const linkDistance = graphLink.distance ?? 0;
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
    [maxDistance, edgeMode, framework, getDimensionColor]
  );

  /**
   * Edge width based on distance (inverse) - thicker for SMALLER distances (stronger similarity)
   *
   * Encoding logic:
   * - Thicker edges = more similar (smaller distance)
   * - Thinner edges = less similar (larger distance)
   *
   * Aggregate mode:
   *   - Distance is normalized by maxDistance (0-1 range)
   *   - Thickness: 1 + (1 - normalized) * 4 = range 1-5px
   *   - Small distance → high (1-normalized) → thick edge ✓
   *
   * Dimensional mode:
   *   - Distance is already normalized 0-1 from computeDimensionalDistances
   *   - Thickness: 0.5 + (1 - distance) * 2.5 = range 0.5-3px
   *   - Small distance → high (1-distance) → thick edge ✓
   */
  const getEdgeWidth = useCallback(
    (link: LibraryLink): number => {
      const graphLink = link as LibraryLink & Partial<GraphLink>;
      const linkDistance = graphLink.distance ?? 0;

      if (edgeMode === "dimensional") {
        // In dimensional mode, use normalized distance (already 0-1)
        const normalized = linkDistance;
        const inverseNormalized = 1 - normalized;
        // Thinner edges in dimensional mode to avoid overlap
        return Math.max(0.5, Math.min(3, 0.5 + inverseNormalized * 2.5));
      }

      // Aggregate mode
      // Invert: close distance = thick, far distance = thin
      const normalized = linkDistance / maxDistance;
      const inverseNormalized = 1 - normalized;
      // Strong connections (close) = thicker edges
      return Math.max(0.5, Math.min(5, 1 + inverseNormalized * 4));
    },
    [maxDistance, edgeMode]
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

  const getNodeLabel = useCallback(
    (node: LibraryNode): string => {
      const n = node as LibraryNode & Partial<GraphNode>;
      const name = n.name ?? "";
      const country = n.country ?? "";
      const scores = n.culturalScores;

      if (!scores || !framework) {
        return `${name} (${country})`;
      }

      const lines: string[] = [`${name} (${country})`, "---"];

      // Format scores based on framework
      if (framework === "hofstede" && scores.hofstede) {
        lines.push(`Power Distance: ${scores.hofstede.powerDistance}`);
        lines.push(`Individualism: ${scores.hofstede.individualism}`);
        lines.push(`Masculinity: ${scores.hofstede.masculinity}`);
        lines.push(
          `Uncertainty Avoidance: ${scores.hofstede.uncertaintyAvoidance}`
        );
        lines.push(
          `Long-term Orientation: ${scores.hofstede.longTermOrientation}`
        );
        lines.push(`Indulgence: ${scores.hofstede.indulgence}`);
      } else if (framework === "lewis" && scores.lewis) {
        lines.push(`Linear Active: ${scores.lewis.linearActive}`);
        lines.push(`Multi Active: ${scores.lewis.multiActive}`);
        lines.push(`Reactive: ${scores.lewis.reactive}`);
      } else if (framework === "hall" && scores.hall) {
        lines.push(`Context (High): ${scores.hall.contextHigh}`);
        lines.push(`Time (Polychronic): ${scores.hall.timePolychronic}`);
        lines.push(`Space (Private): ${scores.hall.spacePrivate}`);
      } else if (framework === "combined") {
        // Show all available frameworks
        if (scores.hofstede) {
          lines.push("Hofstede:");
          lines.push(`  Power Distance: ${scores.hofstede.powerDistance}`);
          lines.push(`  Individualism: ${scores.hofstede.individualism}`);
          lines.push(`  Masculinity: ${scores.hofstede.masculinity}`);
          lines.push(
            `  Uncertainty Avoidance: ${scores.hofstede.uncertaintyAvoidance}`
          );
          lines.push(
            `  Long-term Orientation: ${scores.hofstede.longTermOrientation}`
          );
          lines.push(`  Indulgence: ${scores.hofstede.indulgence}`);
        }
        if (scores.lewis) {
          lines.push("Lewis:");
          lines.push(`  Linear Active: ${scores.lewis.linearActive}`);
          lines.push(`  Multi Active: ${scores.lewis.multiActive}`);
          lines.push(`  Reactive: ${scores.lewis.reactive}`);
        }
        if (scores.hall) {
          lines.push("Hall:");
          lines.push(`  Context (High): ${scores.hall.contextHigh}`);
          lines.push(`  Time (Polychronic): ${scores.hall.timePolychronic}`);
          lines.push(`  Space (Private): ${scores.hall.spacePrivate}`);
        }
      }

      return lines.join("\n");
    },
    [framework]
  );

  const getLinkLabel = useCallback(
    (link: LibraryLink): string => {
      const graphLink = link as LibraryLink &
        Partial<GraphLink> & {
          dimensionLabel?: string;
          sourceValue?: number;
          targetValue?: number;
        };
      const linkDistance = graphLink.distance ?? 0;

      if (edgeMode === "dimensional" && graphLink.dimensionLabel) {
        // Find source and target nodes to get their names
        const sourceNode = data.nodes.find(
          (n) => n.id === String(graphLink.source)
        );
        const targetNode = data.nodes.find(
          (n) => n.id === String(graphLink.target)
        );

        const sourceName = sourceNode
          ? `${sourceNode.name} (${sourceNode.country})`
          : String(graphLink.source);
        const targetName = targetNode
          ? `${targetNode.name} (${targetNode.country})`
          : String(graphLink.target);

        const lines: string[] = [graphLink.dimensionLabel, "---"];

        // Show both nodes' values if available
        if (
          graphLink.sourceValue !== undefined &&
          graphLink.targetValue !== undefined
        ) {
          lines.push(`${sourceName}: ${graphLink.sourceValue}`);
          lines.push(`${targetName}: ${graphLink.targetValue}`);
          lines.push("---");
        }

        // Calculate similarity percentage (inverse of distance)
        const similarity = (1 - linkDistance) * 100;
        lines.push(
          `Similarity: ${similarity.toFixed(
            1
          )}% (distance: ${linkDistance.toFixed(3)})`
        );

        return lines.join("\n");
      }

      // Aggregate mode
      return `Cultural Distance: ${linkDistance.toFixed(
        3
      )}\n(thicker = more similar)`;
    },
    [edgeMode, data.nodes]
  );

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
      {/* Edge Mode Toggle */}
      {framework && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2">
            <Label htmlFor="edge-mode-toggle" className="text-sm font-medium">
              Edge Display:
            </Label>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs",
                  edgeMode === "aggregate"
                    ? "font-semibold"
                    : "text-muted-foreground"
                )}
              >
                Aggregate
              </span>
              <Switch
                id="edge-mode-toggle"
                checked={edgeMode === "dimensional"}
                onCheckedChange={(checked) => {
                  setEdgeMode(checked ? "dimensional" : "aggregate");
                }}
              />
              <span
                className={cn(
                  "text-xs",
                  edgeMode === "dimensional"
                    ? "font-semibold"
                    : "text-muted-foreground"
                )}
              >
                Dimensional
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-full"
        style={{ aspectRatio: "16/9", minHeight: "500px" }}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={transformedGraphData}
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
          linkCurvature={(link: LibraryLink) => {
            const graphLink = link as LibraryLink &
              Partial<GraphLink> & {
                curvature?: number;
              };
            // Use custom curvature in dimensional mode, default in aggregate
            return edgeMode === "dimensional" &&
              graphLink.curvature !== undefined
              ? graphLink.curvature
              : 0.1;
          }}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
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
          {edgeMode === "dimensional" && dimensionLegend.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">
                Dimensions:
              </span>
              {dimensionLegend.map((dim) => (
                <div key={dim.dimension} className="flex items-center gap-1">
                  <div
                    className="w-4 h-3 rounded border border-background"
                    style={{ backgroundColor: dim.color }}
                  />
                  <span className="text-xs">{dim.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {edgeMode === "dimensional"
                ? "Each edge color represents a dimension. Edge thickness indicates similarity for that dimension (thicker = closer)."
                : "Edge thickness and darkness indicate similarity (thicker = closer culturally)"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
