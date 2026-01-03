/**
 * Legend component for network graph visualization
 */

import type { GraphNode } from "@/lib/utils/visualization-data";
import { getGroupColor } from "./utils/graph-colors";
import { createCountryColorMap } from "./utils/graph-colors";

type CountryLegendItem = {
  code: string;
  name: string;
};

type DimensionLegendItem = {
  dimension: string;
  label: string;
  color: string;
};

type GraphLegendProps = {
  nodes: GraphNode[];
  selectedNodeId?: string;
  hoveredNodeId?: string;
  edgeMode: "aggregate" | "dimensional";
  dimensionLegend?: DimensionLegendItem[];
};

export function GraphLegend({
  nodes,
  selectedNodeId,
  hoveredNodeId,
  edgeMode,
  dimensionLegend = [],
}: GraphLegendProps) {
  // Get country info for legend
  const countryLegend: CountryLegendItem[] = [];
  const countryMap = new Map<string, { code: string; name: string }>();
  for (const node of nodes) {
    if (!countryMap.has(node.countryCode)) {
      countryMap.set(node.countryCode, {
        code: node.countryCode,
        name: node.country,
      });
    }
  }
  countryLegend.push(...Array.from(countryMap.values()));
  countryLegend.sort((a, b) => a.name.localeCompare(b.name));

  // Get unique group numbers
  const groupNumbers = Array.from(
    new Set(
      nodes
        .map((n) => n.groupNumber)
        .filter((g): g is number => g !== undefined)
    )
  ).sort((a, b) => a - b);

  const countryColorMap = createCountryColorMap(
    nodes.map((n) => n.countryCode)
  );

  const hasContent =
    countryLegend.length > 0 ||
    groupNumbers.length > 0 ||
    selectedNodeId ||
    hoveredNodeId ||
    (edgeMode === "dimensional" && dimensionLegend.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
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
          <span className="font-semibold text-muted-foreground">Groups:</span>
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
  );
}
