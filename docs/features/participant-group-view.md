# Feature Requirement Document: Participant Group View

## Feature Name

Participant Group Assignment View

## Goal

Allow participants to view their assigned group number and group members after groups have been generated, enabling them to know who they'll be discussing with.

## User Story

As a participant, I want to see which group I'm in and who my group members are, so that I can prepare for discussions and connect with my group.

## Functional Requirements

- Display participant's assigned group number
- Display list of all group members (names)
- Show group member countries (optional, for visual interest)
- Read-only view (no editing)
- Conditional rendering:
  - If groups not generated: show "Waiting for groups" message
  - If groups generated: show group assignment
- Session token validation (participant must be authenticated via token)
- Auto-refresh or polling for group assignment updates
- Clear indication of participant's own name in the list

## Data Requirements

**Query Requirements**
- Join participants → group_members → groups
- Filter by participant session token
- Retrieve all group members for the same group

**Displayed Data**
- Group number
- Group member names
- Group member countries (optional)

## User Flow

1. Participant navigates to `/participant/[token]` page
2. System validates session token
3. System checks if groups have been generated for the workshop
4. If groups not generated:
   - Display "Waiting for groups to be assigned" message
   - Show polling indicator or refresh option
5. If groups generated:
   - Retrieve participant's group assignment
   - Retrieve all group members
   - Display group number prominently
   - Display list of group members
   - Highlight participant's own name in the list
6. Auto-refresh or manual refresh updates view when groups are assigned

## Acceptance Criteria

- Correct group number is displayed for the participant
- All group members are displayed with names
- Participant's own name is clearly indicated
- "Waiting" message shown before groups are generated
- Session token validation works correctly
- Only participant's own group is visible (security)
- Auto-refresh or polling updates view when groups assigned
- Error handling for invalid tokens or missing data

## Edge Cases

- Participant loads page before groups generated (show waiting state)
- Participant's token invalid or expired (show error, redirect)
- Participant not assigned to any group (show error message)
- Group member data missing (handle gracefully)
- Network error during data fetch (show error, allow retry)
- Groups regenerated after participant viewed (update display)
- Multiple tabs open (consistent state across tabs)

## Non-Functional Requirements

- Page loads in < 500ms
- Auto-refresh every 5-10 seconds when waiting for groups
- Responsive design for mobile devices
- Accessible content (screen readers, keyboard navigation)

## Technical Implementation Details

### Key Files

- `app/participant/[token]/page.tsx` - Participant status page
- `components/participant-group-card.tsx` - Group assignment display component
- `lib/queries/participant-queries.ts` - Query functions for participant data

### Dependencies

- SWR for polling/auto-refresh
- ShadCN Card, Badge components

### Query Implementation

```typescript
// lib/queries/participant-queries.ts
import { db } from "@/lib/db";
import { participants, groupMembers, groups } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getParticipantGroup(token: string) {
  // Find participant by token
  const participant = await db.query.participants.findFirst({
    where: eq(participants.sessionToken, token),
  });
  
  if (!participant) {
    return null;
  }
  
  // Find group membership
  const membership = await db.query.groupMembers.findFirst({
    where: eq(groupMembers.participantId, participant.id),
    with: {
      group: true,
    },
  });
  
  if (!membership) {
    return { participant, group: null };
  }
  
  // Get all group members
  const groupMemberRecords = await db.query.groupMembers.findMany({
    where: eq(groupMembers.groupId, membership.groupId),
    with: {
      participant: {
        with: {
          country: true,
        },
      },
    },
  });
  
  return {
    participant,
    group: membership.group,
    members: groupMemberRecords.map((gm) => ({
      id: gm.participant.id,
      name: gm.participant.name,
      countryCode: gm.participant.countryCode,
      countryName: gm.participant.country?.name,
    })),
  };
}
```

### Participant Status Page

```typescript
// app/participant/[token]/page.tsx
import { getParticipantGroup } from "@/lib/queries/participant-queries";
import { ParticipantGroupCard } from "@/components/participant-group-card";
import { notFound } from "next/navigation";

export default async function ParticipantPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await getParticipantGroup(params.token);
  
  if (!data) {
    notFound();
  }
  
  if (!data.group) {
    return (
      <div>
        <h1>Waiting for Groups</h1>
        <p>Your facilitator is setting up groups. Please check back soon.</p>
        {/* Client component with polling */}
        <GroupAssignmentPoller token={params.token} />
      </div>
    );
  }
  
  return (
    <div>
      <h1>Your Group Assignment</h1>
      <ParticipantGroupCard
        group={data.group}
        members={data.members}
        currentParticipantId={data.participant.id}
      />
    </div>
  );
}
```

### Group Card Component

```typescript
// components/participant-group-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ParticipantGroupCard({
  group,
  members,
  currentParticipantId,
}: {
  group: { groupNumber: number };
  members: Array<{
    id: string;
    name: string;
    countryCode: string;
    countryName?: string;
  }>;
  currentParticipantId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Group {group.groupNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            You'll be discussing with:
          </p>
          {members.map((member) => (
            <div
              key={member.id}
              className={`flex items-center justify-between p-2 rounded ${
                member.id === currentParticipantId
                  ? "bg-primary/10 font-medium"
                  : ""
              }`}
            >
              <span>{member.name}</span>
              {member.id === currentParticipantId && (
                <Badge variant="secondary">You</Badge>
              )}
              {member.countryName && (
                <span className="text-sm text-muted-foreground">
                  {member.countryName}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Polling Component

```typescript
// components/group-assignment-poller.tsx
"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";

export function GroupAssignmentPoller({ token }: { token: string }) {
  const router = useRouter();
  
  const { data } = useSWR(
    `/api/participant/${token}/group`,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      onSuccess: (data) => {
        if (data?.group) {
          // Groups assigned, refresh page
          router.refresh();
        }
      },
    }
  );
  
  return (
    <div className="text-sm text-muted-foreground">
      Checking for group assignment...
    </div>
  );
}
```

## UI/UX Considerations

- Clear, prominent group number display
- List of group members easy to scan
- Participant's own name highlighted or marked "You"
- Waiting state is clear and not confusing
- Polling indicator shows system is checking
- Responsive layout for mobile
- Accessible content structure
- Clean, uncluttered design

## Security Considerations

- Session token validation on every request
- Participant can only see their own group
- No access to other participants' groups
- Server-side validation prevents unauthorized access
- Token stored in httpOnly cookie

## State Management

- Server component for initial render
- Client component for polling/auto-refresh
- SWR manages cache and refresh logic
- Router refresh when groups assigned

## Future Enhancements

- Group chat or discussion forum
- Video call links for virtual workshops
- Group member profiles with optional photos
- Group history/previous groups
- Notifications when groups assigned
