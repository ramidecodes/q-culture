"use client";

import { useRef, useEffect, useMemo } from "react";
import type cytoscape from "cytoscape";

type HeroNode = {
  id: string;
  name: string;
  country: string;
};

type HeroLink = {
  source: string;
  target: string;
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
  const cyRef = useRef<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<cytoscape.Layouts | null>(null);

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

  // Transform to Cytoscape format
  const cytoscapeElements = useMemo(() => {
    const nodes = graphData.nodes.map((node, index) => ({
      data: {
        id: node.id,
        label: "",
        color: nodeColors[index % nodeColors.length] ?? "#6b7280",
      },
    }));

    const edges = graphData.links.map((link) => {
      const distance = link.distance ?? 0.5;
      const inverseNormalized = 1 - distance;
      // Use quadratic curve for more pronounced similarity differences
      const similarityFactor = inverseNormalized * inverseNormalized;
      const opacity = Math.max(
        0.2,
        Math.min(0.6, 0.2 + similarityFactor * 0.4)
      );
      // Thinner edges: 0.3 to 1.0 pixels
      const width = 0.3 + similarityFactor * 0.7;

      return {
        data: {
          id: `${link.source}-${link.target}`,
          source: link.source,
          target: link.target,
          distance,
          width,
          color: `rgba(148, 163, 184, ${opacity})`,
          opacity,
        },
      };
    });

    return [...nodes, ...edges];
  }, [graphData, nodeColors]);

  // Stylesheet
  const stylesheet = useMemo((): Array<{
    selector: string;
    style: Record<string, unknown>;
  }> => {
    return [
      {
        selector: "node",
        style: {
          shape: "ellipse",
          "background-color": "data(color)",
          width: 3,
          height: 3,
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
        },
      },
      {
        selector: "edge",
        style: {
          width: "data(width)",
          "line-color": "data(color)",
          opacity: "data(opacity)",
          "curve-style": "bezier",
          "line-style": "solid",
        },
      },
    ];
  }, []);

  // Layout configuration
  const layoutOptions = useMemo((): cytoscape.LayoutOptions => {
    return {
      name: "cose",
      animate: true,
      animationDuration: 300,
      fit: false,
      padding: 80,
      nodeRepulsion: 5000,
      idealEdgeLength: (edge: cytoscape.EdgeSingular) => {
        const distance = edge.data("distance") ?? 0.5;
        return Math.max(80, distance * 200);
      },
      edgeElasticity: 100,
      gravity: 0.05,
      componentSpacing: 100,
      numIter: 600,
      randomize: true,
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

      // Initialize with empty elements - will be populated by update effect
      const cy = cytoscape({
        container,
        elements: [],
        style: stylesheet,
        userPanningEnabled: false,
        userZoomingEnabled: false,
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
  }, [stylesheet]);

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
    cy.add([...cytoscapeElements]);

    // Force style update to ensure all styles are applied
    cy.style().update();

    // Run layout and fit after completion
    const layout = cy.layout(layoutOptions);
    layoutRef.current = layout;

    const handleLayoutStop = () => {
      cy.fit(undefined, 80);
    };

    layout.one("layoutstop", handleLayoutStop);
    layout.run();

    return () => {
      layout.off("layoutstop", handleLayoutStop);
      layout.stop();
    };
  }, [cytoscapeElements, stylesheet, layoutOptions]);

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
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
      }}
    />
  );
}
