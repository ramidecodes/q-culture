"use client";

import { useMemo, useState } from "react";
import type {
  HeatmapData,
  HeatmapDataPoint,
} from "@/lib/utils/visualization-data";
import { scaleSequential } from "d3-scale";
import { interpolateViridis } from "d3-scale-chromatic";
import { cn } from "@/lib/utils";

type DistanceMatrixHeatmapProps = {
  data: HeatmapData;
  className?: string;
};

export function DistanceMatrixHeatmap({
  data,
  className,
}: DistanceMatrixHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);

  // Create color scale for distance visualization
  // Viridis scale: lighter = low distance, darker = high distance
  const colorScale = useMemo(() => {
    const range = data.maxDistance - data.minDistance;
    if (range === 0) {
      // Single value case
      return scaleSequential(interpolateViridis).domain([0, 1]);
    }
    // Use Viridis with reversed domain so darker = higher distance
    return scaleSequential(interpolateViridis).domain([
      data.maxDistance,
      data.minDistance,
    ]);
  }, [data.minDistance, data.maxDistance]);

  // Create matrix map for quick lookup
  const matrixMap = useMemo(() => {
    const map = new Map<string, HeatmapDataPoint>();
    for (const point of data.data) {
      const key = `${point.participantX}-${point.participantY}`;
      map.set(key, point);
    }
    return map;
  }, [data.data]);

  // Get color for a cell
  const getCellColor = (value: number): string => {
    return colorScale(value) as string;
  };

  // Get text color for contrast
  const getTextColor = (value: number): string => {
    // Use midpoint to determine if we should use light or dark text
    const midpoint = (data.minDistance + data.maxDistance) / 2;
    return value > midpoint ? "white" : "black";
  };

  // Get cell data
  const getCellData = (
    xIdx: number,
    yIdx: number
  ): HeatmapDataPoint | undefined => {
    const xParticipant = data.participants[xIdx];
    const yParticipant = data.participants[yIdx];
    if (!xParticipant || !yParticipant) return undefined;
    const key = `${xParticipant.id}-${yParticipant.id}`;
    return matrixMap.get(key);
  };

  const isDiagonal = (xIdx: number, yIdx: number): boolean => xIdx === yIdx;

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="overflow-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-background border border-border p-2 text-left font-semibold">
                  Participant
                </th>
                {data.participants.map((participant) => (
                  <th
                    key={participant.id}
                    className="border border-border p-2 text-center text-xs font-semibold min-w-[80px] max-w-[120px] bg-muted/50"
                    title={`${participant.name} (${participant.countryName})`}
                  >
                    <div className="truncate">{participant.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.participants.map((xParticipant, xIdx) => (
                <tr key={xParticipant.id}>
                  <td
                    className="sticky left-0 z-10 bg-background border border-border p-2 text-sm font-medium"
                    title={`${xParticipant.name} (${xParticipant.countryName})`}
                  >
                    <div className="truncate max-w-[150px]">
                      {xParticipant.name}
                    </div>
                  </td>
                  {data.participants.map((yParticipant, yIdx) => {
                    const cellData = getCellData(xIdx, yIdx);
                    if (!cellData) return null;

                    const isHovered =
                      hoveredCell?.participantX === cellData.participantX &&
                      hoveredCell?.participantY === cellData.participantY;
                    const isDiag = isDiagonal(xIdx, yIdx);

                    return (
                      <td
                        key={yParticipant.id}
                        className={cn(
                          "border border-border p-2 text-center text-xs cursor-pointer transition-all relative",
                          isHovered && "ring-2 ring-primary ring-offset-1 z-20",
                          isDiag && "bg-muted/30"
                        )}
                        style={{
                          backgroundColor: isDiag
                            ? undefined
                            : getCellColor(cellData.value),
                          color: isDiag
                            ? "inherit"
                            : getTextColor(cellData.value),
                        }}
                        onMouseEnter={() => setHoveredCell(cellData)}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${cellData.x} ↔ ${
                          cellData.y
                        }\nDistance: ${cellData.value.toFixed(3)}\n${
                          cellData.countryX
                        } ↔ ${cellData.countryY}`}
                      >
                        {isDiag ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="font-medium">
                            {cellData.value.toFixed(2)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Color Legend */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Low Distance</span>
          <span>High Distance</span>
        </div>
        <div className="h-4 w-full rounded-md overflow-hidden border border-border">
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(to right, ${colorScale(
                data.minDistance
              )}, ${colorScale(data.maxDistance)})`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{data.minDistance.toFixed(2)}</span>
          <span>{data.maxDistance.toFixed(2)}</span>
        </div>
      </div>

      {/* Hovered Cell Info */}
      {hoveredCell && (
        <div className="p-3 rounded-lg border bg-muted/50">
          <div className="text-sm font-semibold">
            {hoveredCell.x} ↔ {hoveredCell.y}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Distance:{" "}
            <span className="font-mono">{hoveredCell.value.toFixed(3)}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {hoveredCell.countryX} ↔ {hoveredCell.countryY}
          </div>
        </div>
      )}
    </div>
  );
}
