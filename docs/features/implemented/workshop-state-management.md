# Feature Requirement Document: Workshop State Management

## Feature Name

Workshop Lifecycle State Management

## Goal

Enable facilitators to control workshop progression through defined phases (draft → collecting → grouped → closed) with proper state transitions, validation, and UI feedback.

## User Story

As a facilitator, I want to advance my workshop through different phases, so that participants and activities are managed in the correct order with appropriate permissions.

## Functional Requirements

- Support four workshop states:
  - **draft**: Initial state, workshop created but not accepting participants
  - **collecting**: Workshop accepting participant registrations
  - **grouped**: Participants have been assigned to groups
  - **closed**: Workshop is complete, no further actions
- Facilitator can advance state forward only (no regression)
- State transitions must be validated:
  - draft → collecting: Always allowed
  - collecting → grouped: Only if groups are generated
  - grouped → closed: Always allowed
- Participants' permissions depend on workshop state:
  - draft: Participants cannot join
  - collecting: Participants can join
  - grouped: Participants can view groups and submit reflections
  - closed: Read-only access for all
- UI displays current state with visual indicator (badge)
- State transition buttons/controls visible only when valid
- Real-time state updates across tabs (if applicable)

## Data Requirements

**Workshops Table**

- `status` (enum: 'draft' | 'collecting' | 'grouped' | 'closed', default: 'draft', not null)
- `updated_at` (timestamp, auto-updated on status change)

**State Transition Rules**

- draft → collecting: No prerequisites
- collecting → grouped: Requires groups to be generated (groups table has records)
- grouped → closed: No prerequisites
- All other transitions: Blocked

## User Flow

1. Facilitator views workshop detail page
2. Current state displayed as badge (draft/collecting/grouped/closed)
3. Available state transition buttons displayed based on current state
4. Facilitator clicks "Start Collecting" button (if in draft)
5. System validates transition is allowed
6. System updates workshop status to "collecting"
7. UI updates to reflect new state
8. Participants can now join workshop
9. Facilitator later clicks "Mark as Grouped" (after generating groups)
10. System validates groups exist, updates status to "grouped"
11. Facilitator later clicks "Close Workshop"
12. System updates status to "closed", workshop is read-only

## Acceptance Criteria

- Current workshop state is clearly displayed
- State transition buttons only appear when transition is valid
- Invalid transitions are blocked with clear error message
- State updates persist to database
- UI updates immediately after state change
- Participants' permissions change based on workshop state
- Status badge displays correct color for each state
- Cannot regress to previous state
- State transitions are atomic (transaction-wrapped)

## Edge Cases

- Facilitator refreshes page during state transition
- Multiple tabs open with conflicting state changes
- Attempt to advance to grouped state without generating groups
- Network error during state update (show error, allow retry)
- Concurrent state updates from different tabs
- Workshop already in target state (no-op)
- Invalid state transition attempted (block and show error)

## Non-Functional Requirements

- State transition completes in < 300ms
- Status updates are atomic (transaction-wrapped)
- Real-time state synchronization (if using SWR/polling)
- UI provides clear feedback for state changes
- Status badge renders correctly in light/dark themes

## Technical Implementation Details

### Key Files

- `lib/db/schema/workshops.ts` - Workshop schema with status enum
- `lib/actions/workshop-actions.ts` - Server action for state updates
- `components/workshop-status-badge.tsx` - Status display component
- `components/workshop-state-controls.tsx` - State transition buttons
- `app/dashboard/workshop/[id]/page.tsx` - Workshop detail page

### Dependencies

- ShadCN Badge, Button components
- SWR (optional) for real-time updates

### Schema Definition

```typescript
// lib/db/schema/workshops.ts
export const workshopStatusEnum = pgEnum("workshop_status", [
  "draft",
  "collecting",
  "grouped",
  "closed",
]);

export const workshops = pgTable("workshops", {
  // ... other fields
  status: workshopStatusEnum("status").default("draft").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### State Transition Server Action

```typescript
// lib/actions/workshop-actions.ts
"use server";

import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { workshops, groups } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type WorkshopStatus = "draft" | "collecting" | "grouped" | "closed";

export async function updateWorkshopStatus(
  workshopId: string,
  newStatus: WorkshopStatus
) {
  const { userId } = auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // Verify facilitator owns workshop
  const workshop = await db.query.workshops.findFirst({
    where: and(
      eq(workshops.id, workshopId),
      eq(workshops.facilitatorId, userId)
    ),
  });

  if (!workshop) {
    return { error: "Workshop not found" };
  }

  // Validate state transition
  const currentStatus = workshop.status;

  if (!isValidTransition(currentStatus, newStatus)) {
    return { error: "Invalid state transition" };
  }

  // Special validation for grouped state
  if (newStatus === "grouped") {
    const workshopGroups = await db.query.groups.findMany({
      where: eq(groups.workshopId, workshopId),
    });

    if (workshopGroups.length === 0) {
      return { error: "Cannot advance to grouped: no groups generated" };
    }
  }

  // Update status in transaction
  await db
    .update(workshops)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(workshops.id, workshopId));

  return { success: true };
}

function isValidTransition(
  current: WorkshopStatus,
  next: WorkshopStatus
): boolean {
  const validTransitions: Record<WorkshopStatus, WorkshopStatus[]> = {
    draft: ["collecting"],
    collecting: ["grouped"],
    grouped: ["closed"],
    closed: [], // Terminal state
  };

  return validTransitions[current]?.includes(next) ?? false;
}
```

### Status Badge Component

```typescript
// components/workshop-status-badge.tsx
import { Badge } from "@/components/ui/badge";
import type { WorkshopStatus } from "@/lib/db/schema";

const statusConfig: Record<
  WorkshopStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "outline" },
  collecting: { label: "Collecting", variant: "default" },
  grouped: { label: "Grouped", variant: "secondary" },
  closed: { label: "Closed", variant: "outline" },
};

export function WorkshopStatusBadge({ status }: { status: WorkshopStatus }) {
  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
```

### State Controls Component

```typescript
// components/workshop-state-controls.tsx
"use client";

import { Button } from "@/components/ui/button";
import { updateWorkshopStatus } from "@/lib/actions/workshop-actions";
import { useRouter } from "next/navigation";

export function WorkshopStateControls({
  workshopId,
  currentStatus,
}: {
  workshopId: string;
  currentStatus: WorkshopStatus;
}) {
  const router = useRouter();

  const handleStatusUpdate = async (newStatus: WorkshopStatus) => {
    const result = await updateWorkshopStatus(workshopId, newStatus);

    if (result?.error) {
      // Show error toast
      return;
    }

    router.refresh(); // Refresh page to show new state
  };

  return (
    <div className="flex gap-2">
      {currentStatus === "draft" && (
        <Button onClick={() => handleStatusUpdate("collecting")}>
          Start Collecting
        </Button>
      )}
      {currentStatus === "collecting" && (
        <Button onClick={() => handleStatusUpdate("grouped")}>
          Mark as Grouped
        </Button>
      )}
      {currentStatus === "grouped" && (
        <Button onClick={() => handleStatusUpdate("closed")}>
          Close Workshop
        </Button>
      )}
    </div>
  );
}
```

## State Permissions Matrix

| State      | Participants Can Join | Participants Can View Groups | Participants Can Submit Reflections | Facilitator Can Edit |
| ---------- | --------------------- | ---------------------------- | ----------------------------------- | -------------------- |
| draft      | ❌                    | ❌                           | ❌                                  | ✅                   |
| collecting | ✅                    | ❌                           | ❌                                  | ✅                   |
| grouped    | ❌                    | ✅                           | ✅                                  | ✅                   |
| closed     | ❌                    | ✅                           | ❌                                  | ❌                   |

## UI/UX Considerations

- Status badge prominently displayed at top of workshop page
- State transition buttons clearly labeled
- Confirmation dialog for state changes (optional)
- Loading state during transition
- Success/error toast notifications
- Disabled state for invalid transitions
- Responsive design for mobile

## Database Transactions

- State updates wrapped in transactions
- Atomic updates prevent partial state changes
- Rollback on error

## Future Enhancements

- State transition history/audit log
- Undo functionality for recent state changes
- Bulk state updates for multiple workshops
- Automatic state transitions (e.g., auto-close after date)
- State transition notifications to participants
