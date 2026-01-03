"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import type cytoscape from "cytoscape";
import type {
  GraphData,
  GraphNode,
  GraphLink,
} from "@/lib/utils/visualization-data";
import type { Framework } from "@/types/cultural";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  transformToCytoscape,
  getDimensionLegend,
} from "./utils/graph-data-transform";
import { GraphLegend } from "./graph-legend";
import { GraphTooltip } from "./graph-tooltip";

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
  const cyRef = useRef<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cytoscapeInstanceRef = useRef<typeof cytoscape | null>(null);
  const layoutRef = useRef<cytoscape.Layouts | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [edgeMode, setEdgeMode] = useState<"aggregate" | "dimensional">(
    "aggregate"
  );
  const [selectedElement, setSelectedElement] = useState<{
    type: "node" | "edge";
    node?: GraphNode;
    link?: GraphLink;
    sourceNode?: GraphNode;
    targetNode?: GraphNode;
    position: { x: number; y: number };
    dimensionLabel?: string;
    sourceValue?: number;
    targetValue?: number;
  } | null>(null);

  // Transform data to Cytoscape format
  const cytoscapeData = useMemo(
    () => transformToCytoscape(data, edgeMode, framework),
    [data, edgeMode, framework]
  );

  // Get dimension legend
  const dimensionLegend = useMemo(
    () => getDimensionLegend(data, framework),
    [data, framework]
  );

  // Cytoscape stylesheet
  const stylesheet = useMemo((): Array<{
    selector: string;
    style: Record<string, unknown>;
  }> => {
    const baseStyles: Array<{
      selector: string;
      style: Record<string, unknown>;
    }> = [
      // Node base style
      {
        selector: "node",
        style: {
          shape: "ellipse",
          "background-color": "data(color)",
          label: "data(label)",
          "text-valign": "bottom",
          "text-halign": "center",
          "font-size": "11px",
          "font-weight": "500",
          color: "#e5e7eb",
          "text-margin-y": 5,
          width: 14,
          height: 14,
          "border-width": 0,
          "border-color": "transparent",
          "overlay-opacity": 0,
          "overlay-color": "transparent",
          "outline-width": 0,
          "outline-color": "transparent",
          "text-background-opacity": 0,
          "text-background-color": "transparent",
          "text-border-width": 0,
          "text-border-color": "transparent",
          "text-border-opacity": 0,
          "text-outline-width": 0,
          "text-outline-color": "transparent",
          "text-outline-opacity": 0,
          "text-wrap": "none",
          "text-max-width": "none",
        },
      },
      // Node hover state - subtle scale and glow effect
      {
        selector: "node:hover",
        style: {
          width: 16,
          height: 16,
          "overlay-opacity": 0.2,
          "overlay-color": "#ffffff",
          "z-index": 10,
        },
      },
      // Node selected state - subtle blue border
      {
        selector: "node:selected",
        style: {
          "border-width": 2,
          "border-color": "#3b82f6",
          "border-opacity": 0.8,
          "z-index": 20,
        },
      },
      // Edge base style
      {
        selector: "edge",
        style: {
          width: "data(width)",
          "line-color": "data(color)",
          "curve-style": "bezier",
          opacity: "data(opacity)",
          "line-style": "solid",
        },
      },
      // Edge hover state - subtle highlight
      {
        selector: "edge:hover",
        style: {
          width: "mapData(width, 0.5, 3.5, 2, 5)",
          opacity: "mapData(opacity, 0.25, 0.85, 0.9, 1)",
          "z-index": 10,
        },
      },
      // Edge selected state
      {
        selector: "edge:selected",
        style: {
          width: "mapData(width, 0.5, 3.5, 2, 5)",
          opacity: "mapData(opacity, 0.25, 0.85, 0.9, 1)",
          "z-index": 20,
        },
      },
    ];

    // Add dimensional mode edge styling
    if (edgeMode === "dimensional") {
      baseStyles.push({
        selector: "edge[controlPointStep]",
        style: {
          "curve-style": "unbundled-bezier",
          "control-point-distances": "data(controlPointStep)",
          "control-point-weights": 0.5,
        },
      });
    }

    return baseStyles;
  }, [edgeMode]);

  // Layout configuration
  const layoutOptions = useMemo((): cytoscape.LayoutOptions => {
    return {
      name: "cose",
      animate: true,
      animationDuration: 500,
      fit: false,
      padding: 100,
      nodeRepulsion: 400000,
      idealEdgeLength: (edge: cytoscape.EdgeSingular) => {
        // Longer edges for more distant cultures
        const distance = edge.data("distance") ?? 0.5;
        return 200 + distance * 400;
      },
      edgeElasticity: 20,
      gravity: 0.005,
      componentSpacing: 250,
      numIter: 2000,
      nestingFactor: 0.1,
      randomize: false, // We set initial positions manually
    };
  }, []);

  // Initialize Cytoscape instance (only once)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || cyRef.current) {
      return;
    }

    // Dynamically import and initialize Cytoscape
    import("cytoscape").then((cytoscapeModule) => {
      if (!container || cyRef.current) {
        return;
      }

      const cytoscape = cytoscapeModule.default;
      cytoscapeInstanceRef.current = cytoscape;

      // Initialize with empty elements - will be populated by update effect
      const cy = cytoscape({
        container,
        elements: [],
        style: [],
        userPanningEnabled: true,
        userZoomingEnabled: true,
        minZoom: 0.1,
        maxZoom: 2,
      });

      cyRef.current = cy;
    });

    return () => {
      if (layoutRef.current) {
        layoutRef.current.stop();
        layoutRef.current = null;
      }
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  // Update elements when data changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    // Stop previous layout if exists
    if (layoutRef.current) {
      layoutRef.current.stop();
      layoutRef.current = null;
    }

    // Remove all existing elements
    cy.elements().remove();

    // Apply stylesheet first
    cy.style(stylesheet);

    // Add new elements
    cy.add([...cytoscapeData.nodes, ...cytoscapeData.edges]);

    // Force style update to ensure all styles are applied
    cy.style().update();

    // Set initial positions in a circle to prevent clumping
    const nodeCount = cytoscapeData.nodes.length;
    const centerX = cy.width() / 2;
    const centerY = cy.height() / 2;
    const radius = Math.min(cy.width(), cy.height()) * 0.3;
    
    cytoscapeData.nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodeCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      cy.getElementById(node.data.id).position({ x, y });
    });

    // Run layout and fit after completion
    const layout = cy.layout(layoutOptions);
    layoutRef.current = layout;

    const handleLayoutStop = () => {
      cy.fit(undefined, 100);
    };

    layout.one("layoutstop", handleLayoutStop);
    layout.run();

    return () => {
      layout.off("layoutstop", handleLayoutStop);
      layout.stop();
    };
  }, [cytoscapeData, stylesheet, layoutOptions]);

  // Set up event handlers when cytoscape instance is ready
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    // Node hover
    const handleNodeMouseover = (event: cytoscape.EventObjectNode) => {
      const node = event.target;
      const nodeData = node.data() as { id: string };
      const graphNode = data.nodes.find((n) => n.id === nodeData.id);
      if (graphNode) {
        setHoveredNodeId(nodeData.id);
        onNodeHover?.(graphNode);
      }
    };

    const handleNodeMouseout = () => {
      setHoveredNodeId(null);
      onNodeHover?.(null);
    };

    // Node click/tap
    const handleNodeTap = (event: cytoscape.EventObjectNode) => {
      const node = event.target;
      const nodeData = node.data() as { id: string };
      const graphNode = data.nodes.find((n) => n.id === nodeData.id);
      if (!graphNode) {
        return;
      }

      const position = event.renderedPosition || event.position;

      // Toggle off if clicking the same node
      setSelectedElement((prev) => {
        if (prev?.type === "node" && prev.node?.id === graphNode.id) {
          onNodeClick?.(graphNode);
          return null;
        }
        return {
          type: "node",
          node: graphNode,
          position: { x: position.x, y: position.y },
        };
      });

      onNodeClick?.(graphNode);
    };

    // Edge click/tap
    const handleEdgeTap = (event: cytoscape.EventObjectEdge) => {
      const edge = event.target;
      const edgeData = edge.data() as {
        source: string;
        target: string;
        dimensionLabel?: string;
        sourceValue?: number;
        targetValue?: number;
      };
      const sourceId = edgeData.source;
      const targetId = edgeData.target;

      const sourceNode = data.nodes.find((n) => n.id === sourceId);
      const targetNode = data.nodes.find((n) => n.id === targetId);

      // Find the original link from graphData
      const link = data.links.find(
        (l) =>
          (l.source === sourceId && l.target === targetId) ||
          (l.source === targetId && l.target === sourceId)
      );

      if (!link) {
        return;
      }

      const position = event.renderedPosition || event.position;

      // Toggle off if clicking the same edge
      setSelectedElement((prev) => {
        if (
          prev?.type === "edge" &&
          prev.link === link &&
          prev.dimensionLabel === edgeData.dimensionLabel
        ) {
          return null;
        }
        return {
          type: "edge",
          link,
          sourceNode,
          targetNode,
          position: { x: position.x, y: position.y },
          dimensionLabel: edgeData.dimensionLabel,
          sourceValue: edgeData.sourceValue,
          targetValue: edgeData.targetValue,
        };
      });
    };

    // Background click to deselect
    const handleBackgroundTap = (event: cytoscape.EventObject) => {
      if (event.target === cy) {
        setSelectedElement(null);
      }
    };

    cy.on("mouseover", "node", handleNodeMouseover);
    cy.on("mouseout", "node", handleNodeMouseout);
    cy.on("tap", "node", handleNodeTap);
    cy.on("tap", "edge", handleEdgeTap);
    cy.on("tap", handleBackgroundTap);

    // Update selected node styling
    if (selectedNodeId) {
      cy.nodes(`[id = "${selectedNodeId}"]`).select();
    } else {
      cy.nodes().unselect();
    }

    return () => {
      cy.off("mouseover", "node", handleNodeMouseover);
      cy.off("mouseout", "node", handleNodeMouseout);
      cy.off("tap", "node", handleNodeTap);
      cy.off("tap", "edge", handleEdgeTap);
      cy.off("tap", handleBackgroundTap);
    };
  }, [data.nodes, data.links, selectedNodeId, onNodeHover, onNodeClick]);

  // Track container dimensions and resize Cytoscape
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      // Resize cytoscape instance when container size changes
      if (cyRef.current) {
        cyRef.current.resize();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Fit graph when data or mode changes
  const prevEdgeModeRef = useRef(edgeMode);
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    if (prevEdgeModeRef.current !== edgeMode) {
      cy.fit(undefined, 50);
      prevEdgeModeRef.current = edgeMode;
    }
  }, [edgeMode]);

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
        style={{
          aspectRatio: "16/9",
          minHeight: "500px",
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
        }}
      >
        {/* Custom Tooltip */}
        {selectedElement && (
          <GraphTooltip
            type={selectedElement.type}
            position={selectedElement.position}
            node={selectedElement.node}
            link={selectedElement.link}
            sourceNode={selectedElement.sourceNode}
            targetNode={selectedElement.targetNode}
            edgeMode={edgeMode}
            framework={framework}
            dimensionLabel={selectedElement.dimensionLabel}
            sourceValue={selectedElement.sourceValue}
            targetValue={selectedElement.targetValue}
            onClose={() => setSelectedElement(null)}
          />
        )}
      </div>

      {/* Legend */}
      <GraphLegend
        nodes={data.nodes}
        selectedNodeId={selectedNodeId}
        hoveredNodeId={hoveredNodeId ?? undefined}
        edgeMode={edgeMode}
        dimensionLegend={dimensionLegend}
      />
    </div>
  );
}
