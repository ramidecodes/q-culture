# Feature Requirement Document: Participant Collection Overview

## Feature Name

Participant Collection Overview (Facilitator View)

## Goal

Enable facilitators to view and monitor all participants who have joined their workshop, including participant count, names, countries, and country distribution summary, during the collection phase.

## User Story

As a facilitator, I want to see who has joined my workshop and the country distribution, so that I can monitor participation and decide when to proceed with grouping.

## Functional Requirements

- Display list of all participants who have joined the workshop
- Show participant name and country for each participant
- Display total participant count
- Show country distribution summary (count by country)
- Real-time or near-real-time updates (via polling or SWR)
- Read-only view (no editing or deleting participants)
- Filter/sort capabilities (optional):
  - Sort by name (alphabetical)
  - Sort by country
  - Sort by join time
- Only accessible to workshop facilitator
- Display only when workshop status is "collecting" or later

## Data Requirements

**Query Requirements**
- Join participants table with countries table
- Join participants table with workshops table (for facilitator verification)
- Aggregate participant count
- Group by country for distribution summary

**Displayed Data**
- Participant ID (internal, not shown to user)
- Participant name
- Country name and code
- Join timestamp (optional, for sorting)
- Country flag emoji (optional, for visual display)

## User Flow

1. Facilitator navigates to workshop detail page
2. Facilitator clicks "Participants" tab or section
3. System verifies facilitator owns the workshop
4. System queries all participants for the workshop
5. System displays participant list with names and countries
6. System displays participant count badge
7. System displays country distribution summary
8. System refreshes data periodically or on manual refresh
9. Facilitator reviews participant list
10. Facilitator decides when to proceed with grouping

## Acceptance Criteria

- All participants for the workshop are displayed
- Participant count matches actual database records
- Country distribution summary is accurate
- Data updates reflect new participants joining
- Only workshop facilitator can view participants
- Read-only view (no edit/delete controls visible)
- Loading state shown while fetching data
- Error handling for failed queries
- Empty state when no participants have joined

## Edge Cases

- No participants have joined yet (show empty state)
- Duplicate participant names (handle gracefully, show all)
- Participants with same country (group in distribution)
- Very large participant list (pagination or virtualization)
- Network error during data fetch (show error, allow retry)
- Workshop deleted while viewing (handle gracefully)
- Participant data changed while viewing (refresh updates)

## Non-Functional Requirements

- Participant list loads in < 500ms
- Real-time updates refresh every 5-10 seconds (configurable)
- Supports at least 100 participants without performance issues
- Responsive design for mobile devices
- Accessible table/list (keyboard navigation, screen readers)

## Technical Implementation Details

### Key Files

- `app/dashboard/workshop/[id]/participants/page.tsx` - Participant overview page
- `components/participant-list.tsx` - Participant list component
- `components/participant-card.tsx` - Individual participant card component
- `components/country-distribution.tsx` - Country distribution summary component
- `lib/queries/workshop-queries.ts` - Query functions for workshop participants

### Dependencies

- SWR or React Query for real-time updates
- ShadCN Table, Card, Badge components

### Query Implementation

```typescript
// lib/queries/workshop-queries.ts
import { db } from "@/lib/db";
import { participants, countries, workshops } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getWorkshopParticipants(workshopId: string) {
  return await db
    .select({
      id: participants.id,
      name: participants.name,
      countryCode: participants.countryCode,
      countryName: countries.name,
      joinedAt: participants.createdAt,
    })
    .from(participants)
    .innerJoin(countries, eq(participants.countryCode, countries.isoCode))
    .where(eq(participants.workshopId, workshopId))
    .orderBy(participants.createdAt);
}

export async function getParticipantCount(workshopId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(participants)
    .where(eq(participants.workshopId, workshopId));
  
  return result[0]?.count ?? 0;
}

export async function getCountryDistribution(workshopId: string) {
  return await db
    .select({
      countryCode: participants.countryCode,
      countryName: countries.name,
      count: sql<number>`count(*)`,
    })
    .from(participants)
    .innerJoin(countries, eq(participants.countryCode, countries.isoCode))
    .where(eq(participants.workshopId, workshopId))
    .groupBy(participants.countryCode, countries.name)
    .orderBy(sql`count(*) desc`);
}
```

### Participant List Component

```typescript
// components/participant-list.tsx
"use client";

import useSWR from "swr";
import { ParticipantCard } from "@/components/participant-card";
import { Badge } from "@/components/ui/badge";

export function ParticipantList({ workshopId }: { workshopId: string }) {
  const { data, isLoading, error } = useSWR(
    `/api/workshop/${workshopId}/participants`,
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  );
  
  if (isLoading) {
    return <div>Loading participants...</div>;
  }
  
  if (error) {
    return <div>Error loading participants</div>;
  }
  
  if (!data || data.length === 0) {
    return <div>No participants have joined yet.</div>;
  }
  
  return (
    <div>
      <div className="mb-4">
        <Badge>Total: {data.length} participants</Badge>
      </div>
      <div className="grid gap-4">
        {data.map((participant) => (
          <ParticipantCard key={participant.id} participant={participant} />
        ))}
      </div>
    </div>
  );
}
```

### Participant Card Component

```typescript
// components/participant-card.tsx
import { Card, CardContent } from "@/components/ui/card";

export function ParticipantCard({
  participant,
}: {
  participant: {
    id: string;
    name: string;
    countryName: string;
    countryCode: string;
  };
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium">{participant.name}</p>
          <p className="text-sm text-muted-foreground">
            {participant.countryName}
          </p>
        </div>
        <div className="text-2xl">
          {getCountryFlag(participant.countryCode)}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Country Distribution Component

```typescript
// components/country-distribution.tsx
"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CountryDistribution({ workshopId }: { workshopId: string }) {
  const { data } = useSWR(
    `/api/workshop/${workshopId}/country-distribution`,
    fetcher
  );
  
  if (!data) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Country Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item: { countryName: string; count: number }) => (
            <div key={item.countryName} className="flex justify-between">
              <span>{item.countryName}</span>
              <Badge>{item.count}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

## UI/UX Considerations

- Clean, scannable participant list
- Participant cards with clear name and country display
- Country flags for visual identification (optional)
- Participant count badge prominently displayed
- Country distribution summary in sidebar or separate section
- Loading skeleton while fetching data
- Empty state message when no participants
- Responsive grid layout for participant cards
- Accessible table/list structure

## Data Refresh Strategy

- **Option 1**: SWR with polling (refresh every 5-10 seconds)
- **Option 2**: Manual refresh button
- **Option 3**: Server-Sent Events (SSE) for real-time updates
- **Recommended**: SWR polling for simplicity and reliability

## Security Considerations

- Verify facilitator owns workshop before displaying participants
- Server-side validation of workshop ownership
- No sensitive participant data exposed (only name and country)
- Session tokens not displayed or accessible

## Future Enhancements

- Export participant list to CSV
- Search/filter participants by name or country
- Participant removal (with confirmation)
- Participant notes/annotations
- Timeline view of join times
- Visualization charts for country distribution
