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
import { X } from "lucide-react";

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
  const [hoveredLink, setHoveredLink] = useState<LibraryLink | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [edgeMode, setEdgeMode] = useState<"aggregate" | "dimensional">(
    "aggregate"
  );
  const [selectedElement, setSelectedElement] = useState<{
    type: "node" | "edge";
    node?: GraphNode;
    link?: LibraryLink;
    position: { x: number; y: number };
  } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
      const isHovered = hoveredLink === link;

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
        let opacity = Math.max(
          0.3,
          Math.min(0.9, 0.4 + inverseNormalized * 0.5)
        );
        // Increase opacity when hovered
        if (isHovered) {
          opacity = Math.min(1, opacity * 1.3);
        }
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
      let opacity = Math.max(0.2, Math.min(0.9, 0.3 + inverseNormalized * 0.6));
      let lightness = Math.max(20, 100 - inverseNormalized * 60);
      // Brighten when hovered
      if (isHovered) {
        opacity = Math.min(1, opacity * 1.4);
        lightness = Math.min(100, lightness + 30);
      }
      return `hsl(0, 0%, ${lightness}%, ${opacity})`;
    },
    [maxDistance, edgeMode, framework, getDimensionColor, hoveredLink]
  );

  /**
   * Edge width based on distance (inverse) - thicker for SMALLER distances (stronger similarity)
   *
   * Values are in pixels for library's default rendering.
   *
   * Dimensional mode: Very thin (0.5-1.5px) since many edges overlap
   * Aggregate mode: Slightly thicker (0.8-2.5px) since only one edge per pair
   */
  const getEdgeWidth = useCallback(
    (link: LibraryLink): number => {
      const graphLink = link as LibraryLink & Partial<GraphLink>;
      const linkDistance = graphLink.distance ?? 0;
      const isHovered = hoveredLink === link;

      let baseWidth: number;
      if (edgeMode === "dimensional") {
        const inverseNormalized = 1 - linkDistance;
        // Very thin: 0.5 to 1.5 pixels
        baseWidth = 0.5 + inverseNormalized * 1;
      } else {
        const normalized = linkDistance / maxDistance;
        const inverseNormalized = 1 - normalized;
        // Thin: 0.8 to 2.5 pixels
        baseWidth = 0.8 + inverseNormalized * 1.7;
      }

      return isHovered ? baseWidth * 2 : baseWidth;
    },
    [maxDistance, edgeMode, hoveredLink]
  );

  const handleNodeClick = useCallback(
    (node: LibraryNode) => {
      if (!isGraphNode(node)) return;

      const nodeId = String(node.id ?? "");
      // Find the full node data from data.nodes to get culturalScores
      const fullNode = data.nodes.find((n) => n.id === nodeId);
      if (!fullNode) return;

      // Toggle off if clicking the same node
      if (
        selectedElement?.type === "node" &&
        selectedElement.node?.id === fullNode.id
      ) {
        setSelectedElement(null);
        onNodeClick?.(fullNode);
        return;
      }

      // Get screen coordinates for tooltip positioning
      const screenCoords =
        node.x !== undefined && node.y !== undefined && graphRef.current
          ? graphRef.current.graph2ScreenCoords(node.x, node.y)
          : null;

      setSelectedElement({
        type: "node",
        node: fullNode,
        position: { x: screenCoords?.x ?? 0, y: screenCoords?.y ?? 0 },
      });

      onNodeClick?.(fullNode);
    },
    [selectedElement, onNodeClick, data.nodes]
  );

  // Format node tooltip content as React component
  const formatNodeTooltip = useCallback(
    (node: GraphNode): React.ReactNode => {
      const name = node.name ?? "";
      const country = node.country ?? "";
      const scores = node.culturalScores;

      if (!scores || !framework) {
        return (
          <div className="space-y-1">
            <div className="font-semibold text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground">{country}</div>
          </div>
        );
      }

      const scoreItems: React.ReactNode[] = [];

      // Format scores based on framework
      if (framework === "hofstede" && scores.hofstede) {
        scoreItems.push(
          <div key="powerDistance" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Power Distance</span>
            <span className="font-mono font-medium text-foreground">
              {scores.hofstede.powerDistance}
            </span>
          </div>
        );
        scoreItems.push(
          <div key="individualism" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Individualism</span>
            <span className="font-mono font-medium text-foreground">
              {scores.hofstede.individualism}
            </span>
          </div>
        );
        scoreItems.push(
          <div key="masculinity" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Masculinity</span>
            <span className="font-mono font-medium text-foreground">
              {scores.hofstede.masculinity}
            </span>
          </div>
        );
        scoreItems.push(
          <div
            key="uncertaintyAvoidance"
            className="flex justify-between text-xs"
          >
            <span className="text-muted-foreground">Uncertainty Avoidance</span>
            <span className="font-mono font-medium text-foreground">
              {scores.hofstede.uncertaintyAvoidance}
            </span>
          </div>
        );
        scoreItems.push(
          <div
            key="longTermOrientation"
            className="flex justify-between text-xs"
          >
            <span className="text-muted-foreground">Long-term Orientation</span>
            <span className="font-mono font-medium text-foreground">
              {scores.hofstede.longTermOrientation}
            </span>
          </div>
        );
        scoreItems.push(
          <div key="indulgence" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Indulgence</span>
            <span className="font-mono font-medium text-foreground">
              {scores.hofstede.indulgence}
            </span>
          </div>
        );
      } else if (framework === "lewis" && scores.lewis) {
        scoreItems.push(
          <div key="linearActive" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Linear Active</span>
            <span className="font-mono font-medium text-foreground">
              {scores.lewis.linearActive}
            </span>
          </div>
        );
        scoreItems.push(
          <div key="multiActive" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Multi Active</span>
            <span className="font-mono font-medium text-foreground">
              {scores.lewis.multiActive}
            </span>
          </div>
        );
        scoreItems.push(
          <div key="reactive" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Reactive</span>
            <span className="font-mono font-medium text-foreground">
              {scores.lewis.reactive}
            </span>
          </div>
        );
      } else if (framework === "hall" && scores.hall) {
        scoreItems.push(
          <div key="contextHigh" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Context (High)</span>
            <span className="font-mono font-medium text-foreground">
              {scores.hall.contextHigh}
            </span>
          </div>
        );
        scoreItems.push(
          <div key="timePolychronic" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Time (Polychronic)</span>
            <span className="font-mono font-medium text-foreground">
              {scores.hall.timePolychronic}
            </span>
          </div>
        );
        scoreItems.push(
          <div key="spacePrivate" className="flex justify-between text-xs">
            <span className="text-muted-foreground">Space (Private)</span>
            <span className="font-mono font-medium text-foreground">
              {scores.hall.spacePrivate}
            </span>
          </div>
        );
      } else if (framework === "combined") {
        // Show all available frameworks
        if (scores.hofstede) {
          scoreItems.push(
            <div
              key="hofstede-header"
              className="text-xs font-medium text-muted-foreground mt-2 first:mt-0"
            >
              Hofstede
            </div>
          );
          scoreItems.push(
            <div key="powerDistance" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Power Distance</span>
              <span className="font-mono font-medium text-foreground">
                {scores.hofstede.powerDistance}
              </span>
            </div>
          );
          scoreItems.push(
            <div key="individualism" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Individualism</span>
              <span className="font-mono font-medium text-foreground">
                {scores.hofstede.individualism}
              </span>
            </div>
          );
          scoreItems.push(
            <div key="masculinity" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Masculinity</span>
              <span className="font-mono font-medium text-foreground">
                {scores.hofstede.masculinity}
              </span>
            </div>
          );
          scoreItems.push(
            <div
              key="uncertaintyAvoidance"
              className="flex justify-between text-xs"
            >
              <span className="text-muted-foreground">
                Uncertainty Avoidance
              </span>
              <span className="font-mono font-medium text-foreground">
                {scores.hofstede.uncertaintyAvoidance}
              </span>
            </div>
          );
          scoreItems.push(
            <div
              key="longTermOrientation"
              className="flex justify-between text-xs"
            >
              <span className="text-muted-foreground">
                Long-term Orientation
              </span>
              <span className="font-mono font-medium text-foreground">
                {scores.hofstede.longTermOrientation}
              </span>
            </div>
          );
          scoreItems.push(
            <div key="indulgence" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Indulgence</span>
              <span className="font-mono font-medium text-foreground">
                {scores.hofstede.indulgence}
              </span>
            </div>
          );
        }
        if (scores.lewis) {
          scoreItems.push(
            <div
              key="lewis-header"
              className="text-xs font-medium text-muted-foreground mt-2 first:mt-0"
            >
              Lewis
            </div>
          );
          scoreItems.push(
            <div key="linearActive" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Linear Active</span>
              <span className="font-mono font-medium text-foreground">
                {scores.lewis.linearActive}
              </span>
            </div>
          );
          scoreItems.push(
            <div key="multiActive" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Multi Active</span>
              <span className="font-mono font-medium text-foreground">
                {scores.lewis.multiActive}
              </span>
            </div>
          );
          scoreItems.push(
            <div key="reactive" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Reactive</span>
              <span className="font-mono font-medium text-foreground">
                {scores.lewis.reactive}
              </span>
            </div>
          );
        }
        if (scores.hall) {
          scoreItems.push(
            <div
              key="hall-header"
              className="text-xs font-medium text-muted-foreground mt-2 first:mt-0"
            >
              Hall
            </div>
          );
          scoreItems.push(
            <div key="contextHigh" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Context (High)</span>
              <span className="font-mono font-medium text-foreground">
                {scores.hall.contextHigh}
              </span>
            </div>
          );
          scoreItems.push(
            <div key="timePolychronic" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Time (Polychronic)</span>
              <span className="font-mono font-medium text-foreground">
                {scores.hall.timePolychronic}
              </span>
            </div>
          );
          scoreItems.push(
            <div key="spacePrivate" className="flex justify-between text-xs">
              <span className="text-muted-foreground">Space (Private)</span>
              <span className="font-mono font-medium text-foreground">
                {scores.hall.spacePrivate}
              </span>
            </div>
          );
        }
      }

      return (
        <div className="space-y-2">
          <div>
            <div className="font-semibold text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground">{country}</div>
          </div>
          {scoreItems.length > 0 && (
            <div className="border-t border-border pt-2 mt-2 space-y-1">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Cultural Dimensions
              </div>
              {scoreItems}
            </div>
          )}
        </div>
      );
    },
    [framework]
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

  // Disable native tooltips - we use custom tooltips instead
  const getNodeLabel = useCallback((): string => {
    return "";
  }, []);

  // Helper to extract node ID from source/target (can be string or NodeObject)
  const getNodeId = useCallback(
    (node: string | LibraryNode | undefined): string => {
      if (!node) {
        return "";
      }
      if (typeof node === "string") {
        return node;
      }
      return String(node.id ?? "");
    },
    []
  );

  // Disable native tooltips - we use custom tooltips instead
  const getLinkLabel = useCallback((): string => {
    return "";
  }, []);

  const handleEngineStop = useCallback(() => {
    graphRef.current?.zoomToFit(400);
  }, []);

  const handleLinkClick = useCallback(
    (link: LibraryLink) => {
      // Toggle off if clicking the same link
      if (selectedElement?.type === "edge" && selectedElement.link === link) {
        setSelectedElement(null);
        return;
      }

      // Position at mouse location
      setSelectedElement({
        type: "edge",
        link,
        position: { x: mousePosition.x, y: mousePosition.y },
      });
    },
    [selectedElement, mousePosition]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedElement(null);
  }, []);

  // Format edge tooltip content as React component
  const formatEdgeTooltip = useCallback(
    (link: LibraryLink): React.ReactNode => {
      const graphLink = link as LibraryLink &
        Partial<GraphLink> & {
          dimensionLabel?: string;
          sourceValue?: number;
          targetValue?: number;
        };
      const linkDistance = graphLink.distance ?? 0;

      if (edgeMode === "dimensional" && graphLink.dimensionLabel) {
        // Extract IDs properly
        const sourceId = getNodeId(graphLink.source);
        const targetId = getNodeId(graphLink.target);

        // Find source and target nodes to get their names
        const sourceNode = data.nodes.find((n) => n.id === sourceId);
        const targetNode = data.nodes.find((n) => n.id === targetId);

        const sourceName = sourceNode
          ? `${sourceNode.name} (${sourceNode.country})`
          : sourceId;
        const targetName = targetNode
          ? `${targetNode.name} (${targetNode.country})`
          : targetId;

        // Calculate similarity percentage (inverse of distance)
        const similarity = (1 - linkDistance) * 100;

        return (
          <div className="space-y-2">
            <div className="font-semibold text-foreground">
              {graphLink.dimensionLabel}
            </div>
            {graphLink.sourceValue !== undefined &&
              graphLink.targetValue !== undefined && (
                <div className="border-t border-border pt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground truncate pr-2">
                      {sourceName}
                    </span>
                    <span className="font-mono font-medium text-foreground flex-shrink-0">
                      {graphLink.sourceValue}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground truncate pr-2">
                      {targetName}
                    </span>
                    <span className="font-mono font-medium text-foreground flex-shrink-0">
                      {graphLink.targetValue}
                    </span>
                  </div>
                </div>
              )}
            <div className="border-t border-border pt-2">
              <div className="text-xs">
                <span className="text-muted-foreground">Similarity: </span>
                <span className="text-foreground font-medium">
                  {similarity.toFixed(1)}%
                </span>
                <span className="text-muted-foreground text-[10px] ml-1">
                  (distance: {linkDistance.toFixed(3)})
                </span>
              </div>
            </div>
          </div>
        );
      }

      // Aggregate mode
      return (
        <div className="space-y-1">
          <div className="font-semibold text-foreground">Cultural Distance</div>
          <div className="text-xs">
            <span className="font-mono font-medium text-foreground">
              {linkDistance.toFixed(3)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground pt-1 border-t border-border">
            (thicker = more similar)
          </div>
        </div>
      );
    },
    [edgeMode, data.nodes, getNodeId]
  );

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

  // Track mouse position for edge tooltips
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, []);


  // Custom node rendering with labels
  const renderNode = useCallback(
    (node: LibraryNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const graphNode = toGraphNode(node);
      const nodeId = String(node.id ?? "");
      const label = graphNode.name || "";
      const fontSize = 12 / globalScale;
      const nodeSize = 6;
      const nodeColor = getNodeColor(node);
      const isHovered = hoveredNode?.id === nodeId;
      const isSelected =
        selectedElement?.type === "node" && selectedElement.node?.id === nodeId;

      // Draw highlight ring when hovered or selected (before the node)
      if (isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, nodeSize + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = isSelected ? "#3b82f6" : "#ffffff";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

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
    [getNodeColor, hoveredNode, selectedElement]
  );

  // Define hit detection area for nodes (invisible, used for hover/click detection)
  const paintNodePointerArea = useCallback(
    (
      node: LibraryNode,
      color: string,
      ctx: CanvasRenderingContext2D,
      _globalScale: number
    ) => {
      const nodeSize = 6;
      // Constant hit area in graph coordinates (not screen coordinates)
      const hitRadius = nodeSize + 4;
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, hitRadius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  // Define hit detection area for links (invisible, used for hover/click detection)
  // Matches the library's quadratic bezier curve rendering
  const paintLinkPointerArea = useCallback(
    (
      link: LibraryLink,
      color: string,
      ctx: CanvasRenderingContext2D,
      _globalScale: number
    ) => {
      const source = link.source as LibraryNode;
      const target = link.target as LibraryNode;
      if (!source?.x || !source?.y || !target?.x || !target?.y) return;

      const sourceX = source.x;
      const sourceY = source.y;
      const targetX = target.x;
      const targetY = target.y;

      if (
        sourceX === undefined ||
        sourceY === undefined ||
        targetX === undefined ||
        targetY === undefined
      ) {
        return;
      }

      const graphLink = link as LibraryLink &
        Partial<GraphLink> & {
          curvature?: number;
        };
      const curvature =
        edgeMode === "dimensional" && graphLink.curvature !== undefined
          ? graphLink.curvature
          : 0.1;

      // Draw path matching library's curve formula
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);

      if (Math.abs(curvature) > 0.001) {
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const controlX = midX + curvature * dy;
        const controlY = midY - curvature * dx;
        ctx.quadraticCurveTo(controlX, controlY, targetX, targetY);
      } else {
        ctx.lineTo(targetX, targetY);
      }

      // Hit area slightly wider than visual for easier interaction
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.stroke();
    },
    [edgeMode]
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
        {/* Custom Tooltip */}
        {selectedElement && (
          <div
            className="absolute z-50"
            style={{
              left: `${selectedElement.position.x}px`,
              top: `${selectedElement.position.y}px`,
              transform:
                selectedElement.type === "node"
                  ? "translate(-50%, calc(-100% - 16px))"
                  : "translate(12px, -50%)",
            }}
          >
            <div className="bg-popover border border-border rounded-lg shadow-xl p-3 text-sm max-w-xs min-w-[220px] animate-in fade-in-0 zoom-in-95 duration-150">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelectedElement(null)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-accent transition-colors z-10"
                aria-label="Close tooltip"
              >
                <X className="h-3 w-3" />
              </button>

              {selectedElement.type === "node" && selectedElement.node
                ? formatNodeTooltip(selectedElement.node)
                : selectedElement.link &&
                  formatEdgeTooltip(selectedElement.link)}
            </div>
            {/* Tooltip arrow */}
            <div
              className="absolute w-2 h-2 bg-popover border-r border-b border-border"
              style={{
                left: selectedElement.type === "node" ? "50%" : "0px",
                top: selectedElement.type === "node" ? "100%" : "50%",
                transform: "translate(-50%, -50%) rotate(45deg)",
              }}
            />
          </div>
        )}

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
          nodePointerAreaPaint={paintNodePointerArea}
          linkColor={getEdgeColor}
          linkWidth={getEdgeWidth}
          linkLabel={getLinkLabel}
          linkPointerAreaPaint={paintLinkPointerArea}
          enablePointerInteraction={true}
          linkHoverPrecision={4}
          linkDirectionalArrowLength={0}
          linkDirectionalArrowRelPos={1}
          linkCurvature={(link: LibraryLink) => {
            const graphLink = link as LibraryLink &
              Partial<GraphLink> & {
                curvature?: number;
              };
            // Use custom curvature in dimensional mode, default in aggregate
            // This is still used for force simulation calculations
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
          onLinkClick={handleLinkClick}
          onLinkHover={(link: LibraryLink | null) => {
            setHoveredLink(link);
          }}
          onBackgroundClick={handleBackgroundClick}
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
