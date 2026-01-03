"use client";

import { useMemo, useState, useCallback } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { GraphData } from "@/lib/utils/visualization-data";
import type { Framework } from "@/types/cultural";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CulturalProfileRadarProps = {
  data: GraphData;
  framework: Framework;
  className?: string;
};

type RadarDataPoint = {
  dimension: string;
  label: string;
  [countryKey: string]: string | number;
};

// Recharts tooltip types
type TooltipPayload = {
  dataKey: string;
  value: number;
  color: string;
  payload: RadarDataPoint;
};

type TooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<TooltipPayload>;
};

// Dimension labels for each framework
const LEWIS_DIMENSIONS = [
  { key: "linearActive", label: "Linear Active" },
  { key: "multiActive", label: "Multi Active" },
  { key: "reactive", label: "Reactive" },
] as const;

const HALL_DIMENSIONS = [
  { key: "contextHigh", label: "Context (High)" },
  { key: "timePolychronic", label: "Time (Polychronic)" },
  { key: "spacePrivate", label: "Space (Private)" },
] as const;

const HOFSTEDE_DIMENSIONS = [
  { key: "powerDistance", label: "Power Distance" },
  { key: "individualism", label: "Individualism" },
  { key: "masculinity", label: "Masculinity" },
  { key: "uncertaintyAvoidance", label: "Uncertainty Avoidance" },
  { key: "longTermOrientation", label: "Long-term Orientation" },
  { key: "indulgence", label: "Indulgence" },
] as const;

// Group color palette (matching network-graph.tsx)
const GROUP_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
];

// Additional distinct colors for countries without groups or for variety
const COUNTRY_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#a855f7", // Violet
  "#eab308", // Yellow
  "#22c55e", // Emerald
  "#6366f1", // Indigo
  "#f43f5e", // Rose
  "#0ea5e9", // Sky
];

const getGroupColor = (groupNumber: number): string => {
  return GROUP_COLORS[(groupNumber - 1) % GROUP_COLORS.length];
};

// Convert hex to RGB for color manipulation
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

// Convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};

// Lighten a color by a percentage
const lightenColor = (hex: string, percent: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.round(r * factor));
  const newG = Math.min(255, Math.round(g * factor));
  const newB = Math.min(255, Math.round(b * factor));
  return rgbToHex(newR, newG, newB);
};

// Darken a color by a percentage
const darkenColor = (hex: string, percent: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - percent / 100;
  const newR = Math.max(0, Math.round(r * factor));
  const newG = Math.max(0, Math.round(g * factor));
  const newB = Math.max(0, Math.round(b * factor));
  return rgbToHex(newR, newG, newB);
};

export function CulturalProfileRadar({
  data,
  framework,
  className,
}: CulturalProfileRadarProps) {
  const [selectedGroup, setSelectedGroup] = useState<number | "all">("all");

  // Get unique groups
  const groups = useMemo(() => {
    const groupSet = new Set<number>();
    for (const node of data.nodes) {
      if (node.groupNumber !== undefined) {
        groupSet.add(node.groupNumber);
      }
    }
    return Array.from(groupSet).sort((a, b) => a - b);
  }, [data.nodes]);

  // Filter nodes by selected group
  const filteredNodes = useMemo(() => {
    if (selectedGroup === "all") {
      return data.nodes;
    }
    return data.nodes.filter((node) => node.groupNumber === selectedGroup);
  }, [data.nodes, selectedGroup]);

  // Transform data to Recharts format
  const radarData = useMemo(() => {
    // Determine which dimensions to use based on framework
    let dimensions: Array<{ key: string; label: string }> = [];

    if (framework === "lewis") {
      dimensions = [...LEWIS_DIMENSIONS];
    } else if (framework === "hall") {
      dimensions = [...HALL_DIMENSIONS];
    } else if (framework === "hofstede") {
      dimensions = [...HOFSTEDE_DIMENSIONS];
    } else if (framework === "combined") {
      // Combine all available dimensions
      dimensions = [
        ...LEWIS_DIMENSIONS,
        ...HALL_DIMENSIONS,
        ...HOFSTEDE_DIMENSIONS,
      ];
    }

    // Build data points for each dimension
    const dataPoints: RadarDataPoint[] = dimensions.map((dim) => {
      const point: RadarDataPoint = {
        dimension: dim.key,
        label: dim.label,
      };

      // Add score for each node (country)
      for (const node of filteredNodes) {
        if (!node.culturalScores) continue;

        let score: number | undefined;

        if (framework === "lewis" && node.culturalScores.lewis) {
          const lewisScores = node.culturalScores.lewis;
          if (dim.key === "linearActive") score = lewisScores.linearActive;
          else if (dim.key === "multiActive") score = lewisScores.multiActive;
          else if (dim.key === "reactive") score = lewisScores.reactive;
        } else if (framework === "hall" && node.culturalScores.hall) {
          const hallScores = node.culturalScores.hall;
          if (dim.key === "contextHigh") score = hallScores.contextHigh;
          else if (dim.key === "timePolychronic")
            score = hallScores.timePolychronic;
          else if (dim.key === "spacePrivate") score = hallScores.spacePrivate;
        } else if (framework === "hofstede" && node.culturalScores.hofstede) {
          const hofstedeScores = node.culturalScores.hofstede;
          if (dim.key === "powerDistance") score = hofstedeScores.powerDistance;
          else if (dim.key === "individualism")
            score = hofstedeScores.individualism;
          else if (dim.key === "masculinity")
            score = hofstedeScores.masculinity;
          else if (dim.key === "uncertaintyAvoidance")
            score = hofstedeScores.uncertaintyAvoidance;
          else if (dim.key === "longTermOrientation")
            score = hofstedeScores.longTermOrientation;
          else if (dim.key === "indulgence") score = hofstedeScores.indulgence;
        } else if (framework === "combined") {
          // For combined, check all frameworks
          if (
            LEWIS_DIMENSIONS.some((d) => d.key === dim.key) &&
            node.culturalScores.lewis
          ) {
            const lewisScores = node.culturalScores.lewis;
            if (dim.key === "linearActive") score = lewisScores.linearActive;
            else if (dim.key === "multiActive") score = lewisScores.multiActive;
            else if (dim.key === "reactive") score = lewisScores.reactive;
          } else if (
            HALL_DIMENSIONS.some((d) => d.key === dim.key) &&
            node.culturalScores.hall
          ) {
            const hallScores = node.culturalScores.hall;
            if (dim.key === "contextHigh") score = hallScores.contextHigh;
            else if (dim.key === "timePolychronic")
              score = hallScores.timePolychronic;
            else if (dim.key === "spacePrivate")
              score = hallScores.spacePrivate;
          } else if (
            HOFSTEDE_DIMENSIONS.some((d) => d.key === dim.key) &&
            node.culturalScores.hofstede
          ) {
            const hofstedeScores = node.culturalScores.hofstede;
            if (dim.key === "powerDistance")
              score = hofstedeScores.powerDistance;
            else if (dim.key === "individualism")
              score = hofstedeScores.individualism;
            else if (dim.key === "masculinity")
              score = hofstedeScores.masculinity;
            else if (dim.key === "uncertaintyAvoidance")
              score = hofstedeScores.uncertaintyAvoidance;
            else if (dim.key === "longTermOrientation")
              score = hofstedeScores.longTermOrientation;
            else if (dim.key === "indulgence")
              score = hofstedeScores.indulgence;
          }
        }

        // Use country code as key, or country name if no code
        const countryKey = node.countryCode || node.country || node.id;
        point[countryKey] = score ?? 0;
      }

      return point;
    });

    return dataPoints;
  }, [filteredNodes, framework]);

  // Get unique countries for rendering Radar components
  const countries = useMemo(() => {
    const countryMap = new Map<
      string,
      { key: string; name: string; groupNumber?: number; color: string }
    >();

    // Track countries per group to assign variations
    const groupCountries = new Map<number, string[]>();
    const ungroupedCountries: string[] = [];

    // First pass: collect countries by group
    for (const node of filteredNodes) {
      const countryKey = node.countryCode || node.country || node.id;
      if (!countryMap.has(countryKey)) {
        const countryName = node.country || node.name || countryKey;
        countryMap.set(countryKey, {
          key: countryKey,
          name: countryName,
          groupNumber: node.groupNumber,
          color: "", // Will be set in second pass
        });

        if (node.groupNumber !== undefined) {
          const groupList = groupCountries.get(node.groupNumber) || [];
          groupList.push(countryKey);
          groupCountries.set(node.groupNumber, groupList);
        } else {
          ungroupedCountries.push(countryKey);
        }
      }
    }

    // Second pass: assign colors
    // For countries in groups: use group color with variations
    for (const [groupNum, countryKeys] of groupCountries.entries()) {
      const baseColor = getGroupColor(groupNum);
      countryKeys.forEach((countryKey, index) => {
        const country = countryMap.get(countryKey);
        if (country) {
          // Vary the color: create distinct shades for each country in the group
          // Use different variations: lighter, darker, and original
          const variations = [20, -15, 10, -5, 0]; // Different brightness levels
          const variation = variations[index % variations.length];
          country.color =
            variation > 0
              ? lightenColor(baseColor, variation)
              : variation < 0
                ? darkenColor(baseColor, Math.abs(variation))
                : baseColor;
        }
      });
    }

    // For ungrouped countries: assign distinct colors
    ungroupedCountries.forEach((countryKey, index) => {
      const country = countryMap.get(countryKey);
      if (country) {
        country.color = COUNTRY_COLORS[index % COUNTRY_COLORS.length];
      }
    });

    return Array.from(countryMap.values());
  }, [filteredNodes]);

  // Custom tooltip formatter
  const customTooltip = useCallback(
    ({ active, payload }: TooltipProps) => {
      if (!active || !payload || payload.length === 0) {
        return null;
      }

      const firstPayload = payload[0];
      if (!firstPayload?.payload) {
        return null;
      }

      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-semibold mb-2">{firstPayload.payload.label}</p>
          {payload.map((entry) => {
            const country = countries.find((c) => c.key === entry.dataKey);
            return (
              <p
                key={entry.dataKey}
                className="text-sm"
                style={{ color: entry.color }}
              >
                <span className="font-medium">
                  {country?.name || entry.dataKey}:
                </span>{" "}
                <span className="font-mono">{entry.value.toFixed(3)}</span>
              </p>
            );
          })}
        </div>
      );
    },
    [countries]
  );

  if (radarData.length === 0 || countries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No cultural data available for the selected framework.
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Group Filter */}
      {groups.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Filter by Group:
          </span>
          <Select
            value={selectedGroup === "all" ? "all" : String(selectedGroup)}
            onValueChange={(value) =>
              setSelectedGroup(value === "all" ? "all" : Number(value))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map((groupNum) => (
                <SelectItem key={groupNum} value={String(groupNum)}>
                  Group {groupNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Radar Chart */}
      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={radarData}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <PolarGrid />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "currentColor" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 1]}
              tick={{ fontSize: 10, fill: "currentColor" }}
            />
            <Tooltip content={customTooltip} />
            {countries.map((country) => (
              <Radar
                key={country.key}
                name={country.name}
                dataKey={country.key}
                stroke={country.color}
                fill={country.color}
                fillOpacity={0.5}
                strokeWidth={2.5}
              />
            ))}
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Info Text */}
      <div className="text-sm text-muted-foreground">
        <p>
          Each polygon represents a country's cultural profile across the
          selected framework dimensions. Countries in the same group are
          overlaid for comparison.
        </p>
        {selectedGroup !== "all" && (
          <p className="mt-2">Showing countries in Group {selectedGroup}.</p>
        )}
      </div>
    </div>
  );
}
