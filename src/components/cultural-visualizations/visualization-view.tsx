"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NetworkGraph } from "./network-graph";
import { DistanceMatrixHeatmap } from "./distance-matrix-heatmap";
import { CulturalProfileRadar } from "./cultural-profile-radar";
import { CountryParameterBarChart } from "./country-parameter-bar-chart";
import type { Framework } from "@/types/cultural";
import type { VisualizationData } from "@/lib/db/queries/visualization-queries";
import type { GraphData } from "@/lib/utils/visualization-data";
import useSWR from "swr";

type VisualizationViewProps = {
  initialData: VisualizationData;
  workshopId: string;
};

const fetcher = async (url: string): Promise<VisualizationData> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch distance matrix");
  }
  return res.json();
};

const frameworkLabels: Record<Framework, string> = {
  lewis: "Lewis Framework",
  hall: "Hall Framework",
  hofstede: "Hofstede Framework",
  combined: "Combined Framework",
};

export function VisualizationView({
  initialData,
  workshopId,
}: VisualizationViewProps) {
  const [framework, setFramework] = useState<Framework>(initialData.framework);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();

  // Use SWR for framework switching (client-side updates)
  const { data, error } = useSWR<VisualizationData>(
    framework !== initialData.framework
      ? `/api/workshop/${workshopId}/distance-matrix?framework=${framework}`
      : null,
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const visualizationData = data || initialData;

  const handleFrameworkChange = (value: string) => {
    setFramework(value as Framework);
    setSelectedNodeId(undefined);
  };

  const handleNodeClick = (node: { id: string }) => {
    setSelectedNodeId(node.id === selectedNodeId ? undefined : node.id);
  };

  if (error) {
    return (
      <div className="py-12">
        <div className="text-center text-sm text-destructive">
          Failed to load distance matrix:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }

  const availableFrameworks =
    visualizationData.availableFrameworks || initialData.availableFrameworks;

  return (
    <div className="space-y-3">
      <Tabs defaultValue="network" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="network">Network Graph</TabsTrigger>
            <TabsTrigger value="heatmap">Distance Matrix</TabsTrigger>
            <TabsTrigger value="radar">Cultural Profile</TabsTrigger>
            <TabsTrigger value="bar">Parameter Comparison</TabsTrigger>
          </TabsList>
          <Select value={framework} onValueChange={handleFrameworkChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["lewis", "hall", "hofstede", "combined"] as Framework[]).map(
                (fw) => {
                  const isAvailable = availableFrameworks.includes(fw);
                  return (
                    <SelectItem
                      key={fw}
                      value={fw}
                      disabled={!isAvailable}
                      className={!isAvailable ? "opacity-50" : ""}
                    >
                      {frameworkLabels[fw]}
                      {!isAvailable && " (unavailable)"}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </div>
        <TabsContent value="network" className="mt-4">
          <div className="rounded-lg border bg-background p-4">
            <NetworkGraph
              data={visualizationData.graphData}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
              framework={visualizationData.framework}
            />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              Nodes represent participants. Edges show cultural distances. Click
              a node to highlight its connections.
            </p>
            {visualizationData.graphData.nodes.some(
              (n) => n.groupNumber !== undefined
            ) && <p className="mt-2">Nodes are colored by group assignment.</p>}
          </div>
        </TabsContent>
        <TabsContent value="heatmap" className="mt-4">
          <div className="rounded-lg border bg-background p-4">
            <DistanceMatrixHeatmap data={visualizationData.heatmapData} />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              Each cell shows the cultural distance between two participants.
              Darker colors indicate greater distances.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="radar" className="mt-4">
          <div className="rounded-lg border bg-background p-4">
            <CulturalProfileRadar
              data={visualizationData.graphData as GraphData}
              framework={framework}
            />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              Each polygon represents a country's cultural profile across the
              selected framework dimensions. Countries in the same group are
              overlaid for comparison.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="bar" className="mt-4">
          <div className="rounded-lg border bg-background p-4">
            <CountryParameterBarChart
              data={visualizationData.graphData as GraphData}
              framework={framework}
            />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              Compare countries by a specific cultural parameter. Use the
              dropdown to select which dimension to visualize. Countries are
              sorted by score value.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
