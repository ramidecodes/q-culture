"use client";

import useSWR from "swr";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCountryFlag } from "@/lib/utils/country-flag";

type CountryDistributionItem = {
  countryCode: string;
  countryName: string;
  count: number;
};

const fetcher = async (url: string): Promise<CountryDistributionItem[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch country distribution");
  }
  return response.json();
};

type CountryDistributionProps = {
  workshopId: string;
};

export function CountryDistribution({
  workshopId,
}: CountryDistributionProps) {
  const { data, isLoading, error } = useSWR<CountryDistributionItem[]>(
    `/api/workshop/${workshopId}/country-distribution`,
    fetcher,
    { refreshInterval: 5000 }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Country Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 bg-muted animate-pulse rounded"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Country Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item) => (
            <div
              key={item.countryCode}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {getCountryFlag(item.countryCode)}
                </span>
                <span>{item.countryName}</span>
              </div>
              <Badge variant="secondary">{item.count}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
