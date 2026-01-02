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
import type { Framework } from "@/types/cultural";
import type { VisualizationData } from "@/lib/db/queries/visualization-queries";
import useSWR from "swr";

type VisualizationViewProps = {
  initialData: VisualizationData;
  workshopId: string;
};

const fetcher = async (url: string): Promise<VisualizationData> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch distance matrix");
  }
  return res.json();
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Select value={framework} onValueChange={handleFrameworkChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lewis">Lewis Framework</SelectItem>
            <SelectItem value="hall">Hall Framework</SelectItem>
            <SelectItem value="hofstede">Hofstede Framework</SelectItem>
            <SelectItem value="combined">Combined Framework</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Tabs defaultValue="network" className="w-full">
        <TabsList>
          <TabsTrigger value="network">Network Graph</TabsTrigger>
          <TabsTrigger value="heatmap">Distance Matrix</TabsTrigger>
        </TabsList>
        <TabsContent value="network" className="mt-4">
          <div className="rounded-lg border bg-background p-4">
            <NetworkGraph
              data={visualizationData.graphData}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
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
      </Tabs>
    </div>
  );
}
