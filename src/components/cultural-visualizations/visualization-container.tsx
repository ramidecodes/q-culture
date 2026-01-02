"use client";

import { useState } from "react";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NetworkGraph } from "./network-graph";
import { DistanceMatrixHeatmap } from "./distance-matrix-heatmap";
import type { Framework } from "@/types/cultural";
import { Loader2 } from "lucide-react";

type VisualizationContainerProps = {
  workshopId: string;
  defaultFramework?: Framework;
};

type VisualizationData = {
  framework: Framework;
  graphData: {
    nodes: Array<{
      id: string;
      name: string;
      country: string;
      countryCode: string;
      groupId?: string;
      groupNumber?: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      distance: number;
    }>;
  };
  heatmapData: {
    participants: Array<{
      id: string;
      name: string;
      countryCode: string;
      countryName: string;
    }>;
    data: Array<{
      x: string;
      y: string;
      value: number;
      participantX: string;
      participantY: string;
      countryX: string;
      countryY: string;
    }>;
    minDistance: number;
    maxDistance: number;
  };
};

const fetcher = async (url: string): Promise<VisualizationData> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch distance matrix");
  }
  return res.json();
};

export function VisualizationContainer({
  workshopId,
  defaultFramework = "combined",
}: VisualizationContainerProps) {
  const [framework, setFramework] = useState<Framework>(defaultFramework);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();

  const { data, error, isLoading } = useSWR<VisualizationData>(
    `/api/workshop/${workshopId}/distance-matrix?framework=${framework}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleFrameworkChange = (value: string) => {
    setFramework(value as Framework);
    setSelectedNodeId(undefined);
  };

  const handleNodeClick = (node: { id: string }) => {
    setSelectedNodeId(node.id === selectedNodeId ? undefined : node.id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Computing cultural distances...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-sm text-destructive">
            Failed to load distance matrix:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cultural Distance Visualization</CardTitle>
              <CardDescription>
                Explore cultural distances between participants
              </CardDescription>
            </div>
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
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="network" className="w-full">
            <TabsList>
              <TabsTrigger value="network">Network Graph</TabsTrigger>
              <TabsTrigger value="heatmap">Distance Matrix</TabsTrigger>
            </TabsList>
            <TabsContent value="network" className="mt-4">
              <div className="rounded-lg border bg-background p-4">
                <NetworkGraph
                  data={data.graphData}
                  selectedNodeId={selectedNodeId}
                  onNodeClick={handleNodeClick}
                />
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Nodes represent participants. Edges show cultural distances.
                  Click a node to highlight its connections.
                </p>
                {data.graphData.nodes.some(
                  (n) => n.groupNumber !== undefined
                ) && (
                  <p className="mt-2">Nodes are colored by group assignment.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="heatmap" className="mt-4">
              <div className="rounded-lg border bg-background p-4">
                <DistanceMatrixHeatmap data={data.heatmapData} />
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Each cell shows the cultural distance between two
                  participants. Darker colors indicate greater distances.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
