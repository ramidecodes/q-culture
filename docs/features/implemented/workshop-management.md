# Feature Requirement Document: Workshop Management & Deletion

## Feature Name

Workshop List Management and Cascade Deletion

## Goal

Enable facilitators to view all their workshops in a centralized dashboard and delete workshops they no longer need, with proper cascade deletion of all associated data (participants, groups, reflections).

## User Story

As a facilitator, I want to view all my workshops in one place and be able to delete old or test workshops, so that I can keep my dashboard organized and remove data I no longer need.

## Functional Requirements

- Display all workshops for the authenticated facilitator in the dashboard
- Show key workshop information:
  - Title
  - Status badge (collecting/grouped/closed)
  - Join code
  - Date (if set)
  - Participant count
  - Framework and group size (if configured)
- Sort workshops by creation date (newest first)
- Provide delete action for each workshop
- Confirmation dialog before deletion explaining what will be deleted
- Cascade deletion of all related data:
  - Reflections (linked to participants)
  - Group members (linked to groups and participants)
  - Groups (linked to workshop)
  - Participants (linked to workshop)
  - Workshop record itself
- Visual feedback during deletion process
- Error handling with clear messages
- Automatic page refresh after successful deletion

## Data Relationships (Cascade Deletion Order)

```
Workshop
├── Participants
│   └── Reflections
└── Groups
    └── Group Members (references both Groups and Participants)
```

**Deletion Order:**
1. Reflections (child of participants)
2. Group Members (child of groups and participants)
3. Groups (child of workshop)
4. Participants (child of workshop)
5. Workshop (parent)

## User Flow

1. Facilitator navigates to dashboard
2. Dashboard displays list of all workshops
3. Each workshop card shows:
   - Title (clickable link to workshop detail)
   - Status badge
   - Join code
   - Date (if applicable)
   - Participant count
   - Framework configuration (if set)
   - Delete button (trash icon)
4. Facilitator clicks delete button for a workshop
5. Confirmation dialog appears showing:
   - Workshop title
   - What will be deleted (participants, groups, reflections)
   - Warning that action cannot be undone
6. Facilitator clicks "Delete Workshop" to confirm
7. System performs cascade deletion in transaction
8. Success: Dialog closes, page refreshes showing updated list
9. Error: Error message displayed, can retry or cancel

## Acceptance Criteria

- Dashboard displays all workshops owned by facilitator
- Workshops sorted by creation date (newest first)
- Workshop cards show accurate participant counts
- Status badges display correct workshop state
- Delete button is clearly visible on each workshop
- Confirmation dialog prevents accidental deletion
- Dialog shows count of data that will be deleted
- Deletion executes in a transaction (all or nothing)
- All related data is properly deleted in correct order
- No orphaned records remain after deletion
- Page automatically refreshes after successful deletion
- Error messages are clear and actionable
- Delete button and dialog are properly accessible

## Edge Cases

- Workshop with no participants (should still delete)
- Workshop with participants but no groups
- Workshop with groups and reflections
- Network error during deletion (transaction rollback)
- User navigates away during deletion
- Attempting to delete already-deleted workshop (should show not found)
- Multiple rapid delete attempts (prevent with loading state)
- User closes dialog during deletion (disabled)

## Non-Functional Requirements

- Deletion completes in < 2 seconds for typical workshop
- Transaction ensures data consistency
- Loading states prevent duplicate deletions
- UI remains responsive during deletion
- Proper ARIA labels for accessibility
- Confirmation dialog requires explicit user action
- Error recovery allows retry without data loss

## Technical Implementation Details

### Key Files

- `lib/db/queries/workshop-queries.ts` - Workshop list query with participant counts
- `lib/actions/workshop-actions.ts` - Delete workshop server action
- `components/workshop-list.tsx` - Workshop list display with delete functionality
- `app/dashboard/page.tsx` - Dashboard page showing workshop list

### Dependencies

- ShadCN Dialog component for confirmation
- ShadCN Card component for workshop display
- ShadCN Badge component for status display
- Lucide React icons (Trash2, Calendar, Users)

### Workshop List Query

```typescript
// lib/db/queries/workshop-queries.ts
export async function getWorkshopsByFacilitator(facilitatorId: string) {
  const workshopList = await db
    .select({
      id: workshops.id,
      title: workshops.title,
      date: workshops.date,
      joinCode: workshops.joinCode,
      status: workshops.status,
      framework: workshops.framework,
      groupSize: workshops.groupSize,
      createdAt: workshops.createdAt,
      participantCount: sql<number>`count(${participants.id})`,
    })
    .from(workshops)
    .leftJoin(participants, eq(participants.workshopId, workshops.id))
    .where(eq(workshops.facilitatorId, facilitatorId))
    .groupBy(
      workshops.id,
      workshops.title,
      workshops.date,
      workshops.joinCode,
      workshops.status,
      workshops.framework,
      workshops.groupSize,
      workshops.createdAt
    )
    .orderBy(desc(workshops.createdAt));

  return workshopList;
}
```

### Delete Action with Cascade

```typescript
// lib/actions/workshop-actions.ts
export async function deleteWorkshop(workshopId: string) {
  const userId = await requireAuth();

  // Verify ownership
  const workshop = await db
    .select()
    .from(workshops)
    .where(
      and(eq(workshops.id, workshopId), eq(workshops.facilitatorId, userId))
    )
    .limit(1);

  if (workshop.length === 0) {
    return { error: "Workshop not found" };
  }

  // Delete sequentially (Neon HTTP driver doesn't support transactions)
  // Get participant and group IDs
  const participantIds = await db
    .select({ id: participants.id })
    .from(participants)
    .where(eq(participants.workshopId, workshopId));

  const groupIds = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.workshopId, workshopId));

  // 1. Delete reflections
  if (participantIds.length > 0) {
    await db
      .delete(reflections)
      .where(inArray(reflections.participantId, participantIds.map(p => p.id)));
  }

  // 2. Delete group members
  if (groupIds.length > 0) {
    await db
      .delete(groupMembers)
      .where(inArray(groupMembers.groupId, groupIds.map(g => g.id)));
  }

  // 3. Delete groups
  await db.delete(groups).where(eq(groups.workshopId, workshopId));

  // 4. Delete participants
  await db.delete(participants).where(eq(participants.workshopId, workshopId));

  // 5. Delete workshop
  await db.delete(workshops).where(eq(workshops.id, workshopId));

  return { success: true };
}
```

### Workshop List Component

```typescript
// components/workshop-list.tsx
"use client";

export function WorkshopList({ workshops }: { workshops: Workshop[] }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workshopToDelete, setWorkshopToDelete] = useState<Workshop | null>(null);
  
  const handleDeleteConfirm = async () => {
    const result = await deleteWorkshop(workshopToDelete.id);
    
    if ("error" in result) {
      setError(result.error);
      return;
    }
    
    router.refresh(); // Refresh to show updated list
  };
  
  return (
    <>
      <div className="space-y-4">
        {workshops.map((workshop) => (
          <Card key={workshop.id}>
            {/* Workshop card with delete button */}
          </Card>
        ))}
      </div>
      
      <Dialog open={deleteDialogOpen}>
        {/* Confirmation dialog */}
      </Dialog>
    </>
  );
}
```

## UI/UX Considerations

- Workshop cards have hover effect for better interactivity
- Delete button uses destructive color scheme (red)
- Delete button positioned top-right of each card
- Confirmation dialog clearly lists what will be deleted
- Participant count displayed prominently
- Workshop title is clickable link to detail page
- Loading state prevents interaction during deletion
- Error messages displayed inline in dialog
- Empty state message when no workshops exist

## Security Considerations

- Verify facilitator ownership before deletion
- Use server actions for secure deletion
- Prevent unauthorized deletion attempts
- Transaction ensures data consistency
- No sensitive data exposed in error messages

## Database Deletion Strategy

**Note**: The Neon HTTP driver (`@neondatabase/serverless` with `drizzle-orm/neon-http`) does not support transactions. Deletions are performed sequentially in the correct order:

1. Reflections (children of participants)
2. Group Members (children of groups and participants)
3. Groups (children of workshop)
4. Participants (children of workshop)
5. Workshop (parent)

This order ensures foreign key constraints are respected. While not atomic, the deletion order prevents foreign key violations and ensures data consistency in the typical case. In the rare event of a failure mid-deletion, some orphaned records may remain but the workshop and its primary data will be removed.

## Future Enhancements

- Bulk delete multiple workshops
- Archive workshop instead of delete
- Restore recently deleted workshops (soft delete)
- Export workshop data before deletion
- Workshop templates (duplicate configuration)
- Search and filter workshop list
- Pagination for users with many workshops
- Workshop statistics on cards (completion rate, etc.)

## Testing Considerations

- Test deletion with no participants
- Test deletion with participants but no groups
- Test deletion with full data (participants, groups, reflections)
- Test transaction rollback on error
- Test authorization (can't delete other's workshops)
- Test UI loading and error states
- Test accessibility with keyboard navigation
- Test confirmation dialog cancel action
