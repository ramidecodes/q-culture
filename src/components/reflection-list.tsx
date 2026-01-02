"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReflectionGroupData } from "@/lib/db/queries/reflection-queries";

type ReflectionListProps = {
  reflections: ReflectionGroupData[];
};

export function ReflectionList({ reflections }: ReflectionListProps) {
  if (reflections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No groups found.</p>
      </div>
    );
  }

  return (
    <Tabs
      defaultValue={`group-${reflections[0].groupNumber}`}
      className="w-full"
    >
      <TabsList className="flex flex-wrap gap-2">
        {reflections.map((group) => (
          <TabsTrigger
            key={group.groupNumber}
            value={`group-${group.groupNumber}`}
          >
            Group {group.groupNumber}
          </TabsTrigger>
        ))}
      </TabsList>

      {reflections.map((group) => (
        <TabsContent
          key={group.groupNumber}
          value={`group-${group.groupNumber}`}
          className="mt-6"
        >
          <div className="space-y-4">
            {group.reflections.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No participants in this group.</p>
                </CardContent>
              </Card>
            ) : (
              group.reflections.map((item) => (
                <Card key={item.participant.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {item.participant.name}
                      </CardTitle>
                      {item.submitted ? (
                        <Badge variant="default">Submitted</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.reflection ? (
                      <div className="space-y-2">
                        <p className="whitespace-pre-wrap text-sm">
                          {item.reflection.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted:{" "}
                          {new Date(item.reflection.submittedAt).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No reflection submitted yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
