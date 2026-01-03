/**
 * Data transformation utilities for converting GraphData to Cytoscape format
 */

import type { GraphData, GraphNode } from "@/lib/utils/visualization-data";
import type { Framework } from "@/types/cultural";
import {
  createCountryColorMap,
  getDimensionColor,
  computeEdgeWidth,
  computeEdgeOpacity,
  getAggregateEdgeColor,
  getDimensionalEdgeColor,
} from "./graph-colors";

export type CytoscapeNode = {
  data: {
    id: string;
    label: string;
    country: string;
    countryCode: string;
    color: string;
    groupId?: string;
    groupNumber?: number;
    culturalScores?: GraphNode["culturalScores"];
  };
};

export type CytoscapeEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    distance: number;
    width: number;
    color: string;
    opacity: number;
    // Dimensional mode fields
    dimension?: string;
    dimensionLabel?: string;
    sourceValue?: number;
    targetValue?: number;
    controlPointStep?: number;
  };
};

export type CytoscapeData = {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
};

/**
 * Transforms GraphData to Cytoscape format
 */
export function transformToCytoscape(
  graphData: GraphData,
  edgeMode: "aggregate" | "dimensional",
  framework?: Framework
): CytoscapeData {
  const countryColorMap = createCountryColorMap(
    graphData.nodes.map((n) => n.countryCode)
  );

  // Pre-compute max distance for normalization
  const maxDistance = Math.max(...graphData.links.map((l) => l.distance), 1);

  // Transform nodes
  const nodes: CytoscapeNode[] = graphData.nodes.map((node) => ({
    data: {
      id: node.id,
      label: node.name,
      country: node.country,
      countryCode: node.countryCode,
      color: countryColorMap.get(node.countryCode) ?? "#6b7280",
      groupId: node.groupId,
      groupNumber: node.groupNumber,
      culturalScores: node.culturalScores,
    },
  }));

  // Transform edges based on mode
  const edges: CytoscapeEdge[] = [];

  if (edgeMode === "aggregate" || !framework) {
    // Single edge per node pair
    for (const link of graphData.links) {
      const width = computeEdgeWidth(link.distance, maxDistance, "aggregate");
      const opacity = computeEdgeOpacity(link.distance, maxDistance);
      const color = getAggregateEdgeColor(link.distance, maxDistance, opacity);

      edges.push({
        data: {
          id: `${link.source}-${link.target}`,
          source: link.source,
          target: link.target,
          distance: link.distance,
          width,
          color,
          opacity,
        },
      });
    }
  } else {
    // Dimensional mode: multiple edges per node pair
    for (const link of graphData.links) {
      const dimDists = link.dimensionalDistances;
      if (dimDists && dimDists.length > 0) {
        const totalDims = dimDists.length;

        dimDists.forEach((dimDist, index) => {
          // Calculate control point step for curve spreading
          // Spread from -40 to +40 pixels
          const controlPointStep =
            totalDims > 1 ? -40 + (index / (totalDims - 1)) * 80 : 0;

          const width = computeEdgeWidth(
            dimDist.distance,
            maxDistance,
            "dimensional"
          );
          const opacity = computeEdgeOpacity(dimDist.distance, maxDistance);
          const color = getDimensionalEdgeColor(
            dimDist.dimension,
            framework,
            dimDist.distance,
            opacity
          );

          edges.push({
            data: {
              id: `${link.source}-${link.target}-${dimDist.dimension}`,
              source: link.source,
              target: link.target,
              distance: dimDist.distance,
              width,
              color,
              opacity,
              dimension: dimDist.dimension,
              dimensionLabel: dimDist.label,
              sourceValue: dimDist.sourceValue,
              targetValue: dimDist.targetValue,
              controlPointStep,
            },
          });
        });
      } else {
        // Fallback: if no dimensional data, create aggregate edge
        const width = computeEdgeWidth(link.distance, maxDistance, "aggregate");
        const opacity = computeEdgeOpacity(link.distance, maxDistance);
        const color = getAggregateEdgeColor(
          link.distance,
          maxDistance,
          opacity
        );

        edges.push({
          data: {
            id: `${link.source}-${link.target}`,
            source: link.source,
            target: link.target,
            distance: link.distance,
            width,
            color,
            opacity,
          },
        });
      }
    }
  }

  return { nodes, edges };
}

/**
 * Gets all unique dimensions from graph data for legend
 */
export function getDimensionLegend(
  graphData: GraphData,
  framework?: Framework
): Array<{ dimension: string; label: string; color: string }> {
  if (!framework) {
    return [];
  }

  const dimensions = new Map<string, string>();
  for (const link of graphData.links) {
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
}
