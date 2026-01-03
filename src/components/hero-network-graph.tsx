"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { ForceGraphMethods, NodeObject, LinkObject } from "react-force-graph-2d";

// Dynamic import with ssr: false for browser-only APIs
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  { ssr: false }
);

type HeroNode = {
  id: string;
  name: string;
  country: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
};

type HeroLink = {
  source: string | HeroNode;
  target: string | HeroNode;
  distance: number;
};

type HeroNetworkGraphProps = {
  className?: string;
};

// Generate aesthetic dummy data representing cultural connections
function generateDummyData() {
  const countries = [
    { name: "United States", code: "US" },
    { name: "Japan", code: "JP" },
    { name: "Germany", code: "DE" },
    { name: "Brazil", code: "BR" },
    { name: "India", code: "IN" },
    { name: "France", code: "FR" },
    { name: "China", code: "CN" },
    { name: "Mexico", code: "MX" },
    { name: "United Kingdom", code: "GB" },
    { name: "South Korea", code: "KR" },
    { name: "Australia", code: "AU" },
    { name: "Canada", code: "CA" },
  ];

  const nodes: HeroNode[] = countries.map((country, index) => ({
    id: `node-${index}`,
    name: country.name,
    country: country.name,
  }));

  // Create links between nodes with varying distances
  const links: HeroLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      // Create connections with some randomness
      if (Math.random() > 0.6) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          distance: 0.2 + Math.random() * 0.8, // Distance between 0.2 and 1.0
        });
      }
    }
  }

  return { nodes, links };
}

export function HeroNetworkGraph({ className }: HeroNetworkGraphProps) {
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  const graphData = useMemo(() => generateDummyData(), []);

  // Color palette for nodes
  const nodeColors = useMemo(
    () => [
      "#3b82f6", // Blue
      "#10b981", // Green
      "#f59e0b", // Amber
      "#ef4444", // Red
      "#8b5cf6", // Purple
      "#ec4899", // Pink
      "#06b6d4", // Cyan
      "#84cc16", // Lime
      "#f97316", // Orange
      "#6366f1", // Indigo
      "#14b8a6", // Teal
      "#a855f7", // Violet
    ],
    []
  );

  // Get node color based on index
  const getNodeColor = useCallback(
    (node: NodeObject): string => {
      const nodeId = String(node.id ?? "");
      const nodeIndex = graphData.nodes.findIndex((n) => n.id === nodeId);
      return nodeColors[nodeIndex % nodeColors.length] ?? "#6b7280";
    },
    [graphData.nodes, nodeColors]
  );

  // Get edge color based on distance (inverse - closer = more opaque)
  const getEdgeColor = useCallback((link: LinkObject): string => {
    const linkDistance = (link as HeroLink).distance ?? 0.5;
    const inverseNormalized = 1 - linkDistance;
    const opacity = Math.max(0.15, Math.min(0.4, 0.2 + inverseNormalized * 0.2));
    return `rgba(148, 163, 184, ${opacity})`; // Slate gray with opacity
  }, []);

  // Get edge width based on distance (inverse)
  const getEdgeWidth = useCallback((link: LinkObject): number => {
    const linkDistance = (link as HeroLink).distance ?? 0.5;
    const inverseNormalized = 1 - linkDistance;
    return Math.max(0.5, Math.min(2, 0.5 + inverseNormalized * 1.5));
  }, []);

  // Custom node rendering
  const renderNode = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const nodeSize = 4;
      const nodeColor = getNodeColor(node);

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    },
    [getNodeColor]
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

  // Initialize graph and fit to view
  useEffect(() => {
    if (graphRef.current) {
      // Set up forces for aesthetic layout
      graphRef.current.d3Force("charge")?.strength(-300);
      // Fit graph to view after initial render
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 20);
      }, 500);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeColor={getNodeColor}
        nodeVal={1}
        nodeRelSize={4}
        nodeCanvasObject={renderNode}
        nodeCanvasObjectMode={() => "replace"}
        linkColor={getEdgeColor}
        linkWidth={getEdgeWidth}
        linkDirectionalArrowLength={0}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        // @ts-expect-error - d3Force is valid but types may be outdated
        d3Force={(
          forceName: string,
          force: {
            distance: (fn: (link: LinkObject & HeroLink) => number) => void;
          }
        ) => {
          if (forceName === "link") {
            force.distance((link: LinkObject & HeroLink) => {
              const distance = link.distance ?? 0.5;
              return Math.max(50, distance * 200);
            });
          }
        }}
        cooldownTicks={100}
        onEngineStop={() => {
          graphRef.current?.zoomToFit(400, 20);
        }}
        backgroundColor="transparent"
        enableNodeDrag={false}
        enableZoomInteraction={false}
        enablePanInteraction={false}
        onNodeClick={undefined}
        onNodeHover={undefined}
        onLinkClick={undefined}
        onBackgroundClick={undefined}
      />
    </div>
  );
}
