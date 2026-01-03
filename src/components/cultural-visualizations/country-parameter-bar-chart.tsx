"use client";

import { useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { GraphData } from "@/lib/utils/visualization-data";
import type { Framework, CulturalScores } from "@/types/cultural";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CountryParameterBarChartProps = {
  data: GraphData;
  framework: Framework;
  className?: string;
};

// Dimension labels for each framework (reused from cultural-profile-radar.tsx)
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

// Group color palette (matching cultural-profile-radar.tsx)
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

// Country colors for countries without groups
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

type BarDataPoint = {
  country: string;
  countryCode: string;
  value: number;
  groupNumber?: number;
};

type ParameterOption = {
  key: string;
  label: string;
  framework?: Framework;
};

// Recharts tooltip types
type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    payload: BarDataPoint;
  }>;
  label?: string;
};

export function CountryParameterBarChart({
  data,
  framework,
  className,
}: CountryParameterBarChartProps) {
  // Build parameter options based on framework
  const parameterOptions = useMemo<ParameterOption[]>(() => {
    if (framework === "lewis") {
      return LEWIS_DIMENSIONS.map((d) => ({
        key: d.key,
        label: d.label,
        framework: "lewis",
      }));
    } else if (framework === "hall") {
      return HALL_DIMENSIONS.map((d) => ({
        key: d.key,
        label: d.label,
        framework: "hall",
      }));
    } else if (framework === "hofstede") {
      return HOFSTEDE_DIMENSIONS.map((d) => ({
        key: d.key,
        label: d.label,
        framework: "hofstede",
      }));
    } else {
      // Combined framework: show all parameters with framework prefix
      return [
        ...LEWIS_DIMENSIONS.map((d) => ({
          key: `lewis.${d.key}`,
          label: `Lewis: ${d.label}`,
          framework: "lewis" as Framework,
        })),
        ...HALL_DIMENSIONS.map((d) => ({
          key: `hall.${d.key}`,
          label: `Hall: ${d.label}`,
          framework: "hall" as Framework,
        })),
        ...HOFSTEDE_DIMENSIONS.map((d) => ({
          key: `hofstede.${d.key}`,
          label: `Hofstede: ${d.label}`,
          framework: "hofstede" as Framework,
        })),
      ];
    }
  }, [framework]);

  const [selectedParameter, setSelectedParameter] = useState<string>(
    parameterOptions[0]?.key || ""
  );

  // Extract unique countries from nodes (group by countryCode)
  const uniqueCountries = useMemo(() => {
    const countryMap = new Map<
      string,
      {
        country: string;
        countryCode: string;
        groupNumber?: number;
        culturalScores?: CulturalScores;
      }
    >();

    for (const node of data.nodes) {
      const key = node.countryCode || node.country;
      if (!countryMap.has(key)) {
        countryMap.set(key, {
          country: node.country || node.name || key,
          countryCode: node.countryCode || key,
          groupNumber: node.groupNumber,
          culturalScores: node.culturalScores,
        });
      }
    }

    return Array.from(countryMap.values());
  }, [data.nodes]);

  // Parse selected parameter (handle combined framework format)
  const parsedParameter = useMemo(() => {
    if (framework === "combined" && selectedParameter.includes(".")) {
      const [fw, param] = selectedParameter.split(".");
      return { framework: fw as Framework, parameter: param };
    }
    return { framework, parameter: selectedParameter };
  }, [framework, selectedParameter]);

  // Transform data for Recharts
  const chartData = useMemo<BarDataPoint[]>(() => {
    const result: BarDataPoint[] = [];

    for (const country of uniqueCountries) {
      if (!country.culturalScores) continue;

      let score: number | undefined;

      const scores = country.culturalScores[parsedParameter.framework];
      if (scores) {
        score = scores[parsedParameter.parameter as keyof typeof scores] as
          | number
          | undefined;
      }

      if (score !== undefined) {
        result.push({
          country: country.country,
          countryCode: country.countryCode,
          value: score,
          groupNumber: country.groupNumber,
        });
      }
    }

    // Sort by value (descending) for better visualization
    return result.sort((a, b) => b.value - a.value);
  }, [uniqueCountries, parsedParameter]);

  // Get bar color
  const getBarColor = useCallback(
    (entry: BarDataPoint, index: number): string => {
      if (entry.groupNumber !== undefined) {
        return getGroupColor(entry.groupNumber);
      }
      return COUNTRY_COLORS[index % COUNTRY_COLORS.length];
    },
    []
  );

  // Calculate average value
  const averageValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, item) => acc + item.value, 0);
    return sum / chartData.length;
  }, [chartData]);

  // Get selected parameter label
  const selectedParameterLabel = useMemo(() => {
    return (
      parameterOptions.find((opt) => opt.key === selectedParameter)?.label ||
      selectedParameter
    );
  }, [parameterOptions, selectedParameter]);

  // Custom tooltip
  const customTooltip = useCallback(
    ({ active, payload }: TooltipProps) => {
      if (!active || !payload || payload.length === 0) {
        return null;
      }

      const data = payload[0].payload as BarDataPoint;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-semibold mb-2">{data.country}</p>
          <p className="text-sm text-muted-foreground mb-1">
            {selectedParameterLabel}
          </p>
          <p className="text-sm font-mono">{data.value.toFixed(3)}</p>
          {data.groupNumber !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Group {data.groupNumber}
            </p>
          )}
        </div>
      );
    },
    [selectedParameterLabel]
  );

  // Handle no data case
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No data available for the selected parameter. The selected countries may
        not have cultural scores for this dimension.
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Parameter Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Parameter:
        </span>
        <Select value={selectedParameter} onValueChange={setSelectedParameter}>
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {parameterOptions.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bar Chart */}
      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <XAxis
              dataKey="country"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(value) => value.toFixed(2)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={customTooltip} cursor={false} />
            <Legend
              formatter={() => selectedParameterLabel}
              wrapperStyle={{ paddingTop: "20px" }}
            />
            <ReferenceLine
              y={averageValue}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${averageValue.toFixed(3)}`,
                position: "right",
                fill: "#ef4444",
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.countryCode}`}
                  fill={getBarColor(entry, index)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Info Text */}
      <div className="text-sm text-muted-foreground">
        <p>
          Bars represent countries' scores for the selected parameter. Countries
          are sorted by value (highest first). The red dashed line shows the
          average score.
        </p>
        {chartData.some((d) => d.groupNumber !== undefined) && (
          <p className="mt-2">
            Countries are colored by group assignment when available.
          </p>
        )}
      </div>
    </div>
  );
}
