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

  // Create color scale
  const colorScale = useMemo(() => {
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

  return (
    <div className={cn("w-full overflow-auto", className)}>
      <div className="inline-block min-w-full">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background border border-border p-2 text-left font-semibold">
                Participant
              </th>
              {data.participants.map((participant) => (
                <th
                  key={participant.id}
                  className="border border-border p-2 text-center text-xs font-semibold min-w-[80px] max-w-[120px]"
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

                  return (
                    <td
                      key={yParticipant.id}
                      className={cn(
                        "border border-border p-1 text-center text-xs cursor-pointer transition-all",
                        isHovered && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{
                        backgroundColor: getCellColor(cellData.value),
                        color:
                          cellData.value >
                          (data.maxDistance + data.minDistance) / 2
                            ? "white"
                            : "black",
                      }}
                      onMouseEnter={() => setHoveredCell(cellData)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${cellData.x} ↔ ${
                        cellData.y
                      }\nDistance: ${cellData.value.toFixed(3)}\n${
                        cellData.countryX
                      } ↔ ${cellData.countryY}`}
                    >
                      {cellData.value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hoveredCell && (
        <div className="mt-4 p-3 rounded-lg border bg-muted">
          <div className="text-sm font-semibold">
            {hoveredCell.x} ↔ {hoveredCell.y}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Distance: {hoveredCell.value.toFixed(3)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {hoveredCell.countryX} ↔ {hoveredCell.countryY}
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <div>
          <span className="font-semibold">Color scale:</span> Darker = Greater
          distance, Lighter = Smaller distance
        </div>
        <div>
          <span className="font-semibold">Range:</span>{" "}
          {data.minDistance.toFixed(2)} - {data.maxDistance.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
