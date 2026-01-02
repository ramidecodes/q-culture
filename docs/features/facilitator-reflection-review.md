# Feature Requirement Document: Facilitator Reflection Review

## Feature Name

Facilitator Reflection Review

## Goal

Enable facilitators to view and review all participant reflections, organized by group, to understand workshop outcomes and participant insights.

## User Story

As a facilitator, I want to read all participant reflections organized by group, so that I can understand the workshop outcomes and participant experiences.

## Functional Requirements

- Display all reflections for the workshop
- Organize reflections by group number
- Show participant name with each reflection
- Display reflection content in readable format
- Available only after groups are generated (workshop status = "grouped" or "closed")
- Read-only view (no editing)
- Group navigation (tabs or accordion) for easy browsing
- Show which participants have not yet submitted reflections
- Export to CSV option (optional enhancement)

## Data Requirements

**Query Requirements**
- Join reflections → participants → groups
- Filter by workshop_id
- Group by group_number
- Order by group_number, then by submission time

**Displayed Data**
- Group number
- Participant name
- Reflection content
- Submission timestamp (optional)

## User Flow

1. Facilitator navigates to workshop detail page
2. Facilitator clicks "Reflections" tab or section
3. System verifies facilitator owns workshop
4. System checks workshop status (must be "grouped" or "closed")
5. System queries all reflections for the workshop
6. System organizes reflections by group
7. System displays groups in tabs or accordion
8. Facilitator navigates between groups
9. Facilitator reads reflections within each group
10. Facilitator can see which participants haven't submitted (optional)
11. Facilitator can export reflections (optional enhancement)

## Acceptance Criteria

- All reflections are displayed correctly
- Reflections are organized by group number
- Participant names are shown with reflections
- Reflection content is readable and formatted
- Only facilitator can view reflections
- Groups without reflections are handled gracefully
- Missing reflections are indicated (optional)
- Export functionality works correctly (if implemented)
- Loading state shown while fetching data
- Error handling for failed queries

## Edge Cases

- No reflections submitted yet (show empty state)
- Some groups have no reflections (handle gracefully)
- Some participants haven't submitted (show indicator)
- Very long reflections (handle display, maybe truncate with expand)
- Workshop with many groups (pagination or virtualization)
- Network error during fetch (show error, allow retry)
- Workshop deleted while viewing (handle gracefully)

## Non-Functional Requirements

- Reflections page loads in < 1 second
- Supports large number of reflections without performance issues
- Responsive design for mobile devices
- Accessible content (keyboard navigation, screen readers)
- Export completes in < 5 seconds for typical workshops

## Technical Implementation Details

### Key Files

- `app/dashboard/workshop/[id]/reflections/page.tsx` - Reflections review page
- `components/reflection-list.tsx` - Reflection list component
- `components/reflection-group-tab.tsx` - Group tab with reflections
- `lib/queries/reflection-queries.ts` - Query functions for reflections

### Dependencies

- ShadCN Tabs, Card, Badge components
- SWR for data fetching (optional)

### Query Implementation

```typescript
// lib/queries/reflection-queries.ts
import { db } from "@/lib/db";
import { reflections, participants, groups } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getWorkshopReflections(workshopId: string) {
  const reflectionsList = await db.query.reflections.findMany({
    where: eq(reflections.workshopId, workshopId), // Via join
    with: {
      participant: true,
      group: true,
    },
    orderBy: (reflections, { asc }) => [
      asc(reflections.group.groupNumber),
      asc(reflections.submittedAt),
    ],
  });
  
  // Group by group number
  const grouped = reflectionsList.reduce((acc, reflection) => {
    const groupNum = reflection.group.groupNumber;
    if (!acc[groupNum]) {
      acc[groupNum] = [];
    }
    acc[groupNum].push(reflection);
    return acc;
  }, {} as Record<number, typeof reflectionsList>);
  
  return grouped;
}

export async function getWorkshopReflectionsWithMissing(
  workshopId: string
) {
  // Get all groups for workshop
  const groups = await db.query.groups.findMany({
    where: eq(groups.workshopId, workshopId),
    with: {
      members: {
        with: {
          participant: true,
        },
      },
    },
  });
  
  // Get all reflections
  const reflections = await db.query.reflections.findMany({
    where: /* join to get workshop_id */,
    with: {
      participant: true,
    },
  });
  
  const reflectionMap = new Map(
    reflections.map((r) => [r.participantId, r])
  );
  
  // Organize by group and mark missing
  return groups.map((group) => ({
    groupNumber: group.groupNumber,
    reflections: group.members
      .map((member) => {
        const reflection = reflectionMap.get(member.participant.id);
        return {
          participant: member.participant,
          reflection: reflection || null,
          submitted: !!reflection,
        };
      })
      .sort((a, b) => {
        // Sort: submitted first, then by name
        if (a.submitted !== b.submitted) {
          return a.submitted ? -1 : 1;
        }
        return a.participant.name.localeCompare(b.participant.name);
      }),
  }));
}
```

### Reflections Page Component

```typescript
// app/dashboard/workshop/[id]/reflections/page.tsx
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workshops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ReflectionList } from "@/components/reflection-list";
import { getWorkshopReflectionsWithMissing } from "@/lib/queries/reflection-queries";

export default async function ReflectionsPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Verify facilitator owns workshop
  const workshop = await db.query.workshops.findFirst({
    where: and(
      eq(workshops.id, params.id),
      eq(workshops.facilitatorId, userId)
    ),
  });
  
  if (!workshop) {
    return <div>Workshop not found</div>;
  }
  
  if (workshop.status === "draft" || workshop.status === "collecting") {
    return (
      <div>
        <p>Reflections are available after groups are generated.</p>
      </div>
    );
  }
  
  const groupedReflections = await getWorkshopReflectionsWithMissing(params.id);
  
  return (
    <div>
      <h1>Participant Reflections</h1>
      <ReflectionList reflections={groupedReflections} />
    </div>
  );
}
```

### Reflection List Component

```typescript
// components/reflection-list.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ReflectionData = {
  groupNumber: number;
  reflections: Array<{
    participant: { name: string };
    reflection: { content: string; submittedAt: Date } | null;
    submitted: boolean;
  }>;
};

export function ReflectionList({ reflections }: { reflections: ReflectionData[] }) {
  if (reflections.length === 0) {
    return <div>No groups found.</div>;
  }
  
  return (
    <Tabs defaultValue={`group-${reflections[0].groupNumber}`}>
      <TabsList>
        {reflections.map((group) => (
          <TabsTrigger key={group.groupNumber} value={`group-${group.groupNumber}`}>
            Group {group.groupNumber}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {reflections.map((group) => (
        <TabsContent
          key={group.groupNumber}
          value={`group-${group.groupNumber}`}
        >
          <div className="space-y-4">
            {group.reflections.map((item, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{item.participant.name}</CardTitle>
                    {item.submitted ? (
                      <Badge variant="default">Submitted</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {item.reflection ? (
                    <p className="whitespace-pre-wrap">
                      {item.reflection.content}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No reflection submitted yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

## UI/UX Considerations

- Tabs or accordion for group navigation
- Clear group labels
- Reflection cards with participant names
- Readable text formatting (preserve line breaks)
- Submitted/pending indicators
- Empty states handled gracefully
- Export button prominently placed (if implemented)
- Responsive design for mobile
- Accessible tab navigation

## Export Functionality (Optional)

If implementing CSV export:
- Include group number, participant name, reflection content, submission date
- Download as CSV file
- Properly escape commas and quotes in content
- Include timestamp in filename

## Security Considerations

- Verify facilitator owns workshop before displaying reflections
- Server-side validation of workshop ownership
- No participant session tokens or sensitive data exposed
- Reflections only visible to workshop facilitator

## Data Privacy

- Reflections contain participant input (handle with care)
- Only facilitator has access
- Consider data retention policies
- No sharing outside of workshop context

## Future Enhancements

- Search/filter reflections
- Reflection analytics (common themes, word clouds)
- Reflection comparison between groups
- Export to PDF
- Reflection templates for next workshop
- Reflection feedback/comments from facilitator
- Reflection anonymization option
