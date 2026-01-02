# Feature Requirement Document: Group Assignment

## Feature Name

Group Assignment Algorithm

## Goal

Generate maximally diverse groups of participants based on cultural distances, respecting group size constraints and ensuring all participants are assigned to exactly one group.

## User Story

As a facilitator, I want participants automatically assigned to diverse groups, so that discussions benefit from cultural contrast and different perspectives.

## Functional Requirements

- Generate groups based on cultural distance matrix
- Respect configured group size (3, 4, or flexible 3-4)
- Maximize diversity within each group (minimize average distance)
- Ensure every participant is assigned to exactly one group
- Algorithm must be deterministic (same inputs = same groups)
- Handle remainder participants when total not divisible by group size
- Persist groups to database (groups and group_members tables)
- Transaction-wrapped group creation (all or nothing)
- Clear existing groups before generating new ones (if re-generating)

## Data Requirements

**Groups Table**
- `id` (uuid, primary key)
- `workshop_id` (uuid, foreign key -> workshops.id)
- `group_number` (integer, sequential: 1, 2, 3, ...)
- `created_at` (timestamp, default: now)

**Group Members Table (Junction)**
- `group_id` (uuid, foreign key -> groups.id)
- `participant_id` (uuid, foreign key -> participants.id)
- Primary key: (group_id, participant_id)

**Constraints**
- Unique: (workshop_id, participant_id) - participant can only be in one group per workshop
- Foreign keys enforce referential integrity

## User Flow

1. Facilitator has configured grouping parameters (framework, size)
2. Facilitator clicks "Generate Groups" button
3. System validates:
   - Configuration is set
   - Minimum participant count met
   - Workshop is in valid state (collecting or draft)
4. System retrieves all participants for workshop
5. System retrieves cultural scores for each participant
6. System computes distance matrix
7. System runs grouping algorithm
8. System creates groups in database (transaction)
9. System creates group_members records (transaction)
10. Success confirmation displayed
11. Workshop status updated to "grouped" (or facilitator can do this manually)
12. Participants can now view their group assignments

## Acceptance Criteria

- All participants assigned to exactly one group
- Groups respect size constraints (3, 4, or flexible)
- Groups are maximally diverse (minimize intra-group distances)
- Algorithm is deterministic (same inputs = same groups)
- Groups persisted correctly in database
- Transaction ensures data consistency
- Error handling for edge cases
- Clear success/error feedback

## Edge Cases

- Remainder participants (when total not divisible by group size)
- Minimal participant count (3 participants = 1 group of 3)
- Large number of participants (performance consideration)
- Identical countries (all distances near 0)
- Missing cultural data (skip participant or error)
- Re-generating groups (clear old groups first)
- Network error during group creation (transaction rollback)
- Concurrent group generation attempts (prevent conflicts)

## Non-Functional Requirements

- Group generation completes in < 5 seconds for 50 participants
- Algorithm is deterministic (same inputs always produce same groups)
- Database transaction ensures atomicity
- Memory efficient (avoid storing large intermediate structures)

## Technical Implementation Details

### Key Files

- `lib/utils/group-assignment.ts` - Grouping algorithm implementation
- `lib/actions/grouping-actions.ts` - Server action for group generation
- `lib/db/schema/groups.ts` - Group schema definitions
- `lib/utils/distance-matrix.ts` - Distance matrix utilities

### Dependencies

- Pure TypeScript for algorithm
- Drizzle ORM for database operations

### Grouping Algorithm (Greedy with Optimization)

```typescript
// lib/utils/group-assignment.ts
import { generateDistanceMatrix } from "./distance-matrix";
import type { Framework } from "./cultural-distance";

type Participant = {
  id: string;
  culturalScores: CulturalScores;
};

type Group = {
  participants: string[];
};

export function generateGroups(
  participants: Participant[],
  framework: Framework,
  groupSize: number | null // 3, 4, or null for flexible
): Group[] {
  if (participants.length === 0) {
    return [];
  }
  
  if (participants.length < 3) {
    // Not enough participants
    throw new Error("Need at least 3 participants to form groups");
  }
  
  // Generate distance matrix
  const distanceMatrix = generateDistanceMatrix(participants, framework);
  
  // Determine target group size
  const targetSize = groupSize ?? 4; // Default to 4 for flexible
  const flexible = groupSize === null;
  
  // Greedy algorithm: iteratively form groups
  const groups: Group[] = [];
  const assigned = new Set<string>();
  const participantIds = participants.map((p) => p.id);
  
  while (assigned.size < participantIds.length) {
    const remaining = participantIds.filter((id) => !assigned.has(id));
    
    if (remaining.length === 0) break;
    
    // Start new group with most distant unassigned participants
    const group = formMaxDiverseGroup(
      remaining,
      distanceMatrix,
      targetSize,
      flexible,
      assigned.size,
      participantIds.length
    );
    
    groups.push({ participants: group });
    group.forEach((id) => assigned.add(id));
  }
  
  return groups;
}

function formMaxDiverseGroup(
  candidates: string[],
  distanceMatrix: Map<string, Map<string, number>>,
  targetSize: number,
  flexible: boolean,
  assignedCount: number,
  totalCount: number
): string[] {
  const group: string[] = [];
  
  // First participant: pick randomly from candidates (for determinism, use first)
  // Or: pick participant with highest average distance to all others
  const first = selectInitialParticipant(candidates, distanceMatrix);
  group.push(first);
  
  // Add participants that maximize diversity
  const remaining = candidates.filter((id) => id !== first);
  
  while (group.length < targetSize && remaining.length > 0) {
    // For flexible groups, check if we should stop at 3
    if (flexible && group.length === 3) {
      const remainingAfterThis = totalCount - assignedCount - group.length - 1;
      // If remainder would create groups that are too unbalanced, prefer 4
      // Otherwise, 3 is acceptable
      if (remainingAfterThis >= 3) {
        // Can afford another participant
      } else {
        // Better to stop at 3
        break;
      }
    }
    
    // Find participant that maximizes minimum distance to current group
    const next = findMostDistantParticipant(group, remaining, distanceMatrix);
    group.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }
  
  return group;
}

function selectInitialParticipant(
  candidates: string[],
  distanceMatrix: Map<string, Map<string, number>>
): string {
  // Simple: use first candidate (deterministic)
  // Advanced: pick participant with highest average distance
  if (candidates.length === 1) return candidates[0];
  
  let maxAvgDistance = -1;
  let bestCandidate = candidates[0];
  
  for (const candidate of candidates) {
    const distances = distanceMatrix.get(candidate);
    if (!distances) continue;
    
    let sum = 0;
    let count = 0;
    
    for (const other of candidates) {
      if (other === candidate) continue;
      const dist = distances.get(other) ?? 0;
      sum += dist;
      count++;
    }
    
    const avgDistance = count > 0 ? sum / count : 0;
    
    if (avgDistance > maxAvgDistance) {
      maxAvgDistance = avgDistance;
      bestCandidate = candidate;
    }
  }
  
  return bestCandidate;
}

function findMostDistantParticipant(
  group: string[],
  candidates: string[],
  distanceMatrix: Map<string, Map<string, number>>
): string {
  let maxMinDistance = -1;
  let bestCandidate = candidates[0];
  
  for (const candidate of candidates) {
    const distances = distanceMatrix.get(candidate);
    if (!distances) continue;
    
    // Find minimum distance to any participant in current group
    let minDistance = Infinity;
    
    for (const groupMember of group) {
      const dist = distances.get(groupMember) ?? 0;
      minDistance = Math.min(minDistance, dist);
    }
    
    // Maximize the minimum distance (most diverse)
    if (minDistance > maxMinDistance) {
      maxMinDistance = minDistance;
      bestCandidate = candidate;
    }
  }
  
  return bestCandidate;
}
```

### Server Action for Group Generation

```typescript
// lib/actions/grouping-actions.ts
"use server";

import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { workshops, participants, groups, groupMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateGroups } from "@/lib/utils/group-assignment";
import { getCountryCulturalData } from "@/lib/queries/country-queries";

export async function generateWorkshopGroups(workshopId: string) {
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
  
  if (!workshop.framework || workshop.groupSize === null) {
    return { error: "Grouping configuration not set" };
  }
  
  // Get all participants
  const workshopParticipants = await db.query.participants.findMany({
    where: eq(participants.workshopId, workshopId),
  });
  
  if (workshopParticipants.length < 3) {
    return { error: "Need at least 3 participants to form groups" };
  }
  
  // Get cultural scores for each participant
  const participantsWithScores = await Promise.all(
    workshopParticipants.map(async (p) => {
      const culturalData = await getCountryCulturalData(p.countryCode);
      return {
        id: p.id,
        culturalScores: culturalData,
      };
    })
  );
  
  // Generate groups
  const generatedGroups = generateGroups(
    participantsWithScores,
    workshop.framework,
    workshop.groupSize
  );
  
  // Clear existing groups (if re-generating)
  await db
    .delete(groupMembers)
    .where(eq(groupMembers.groupId, /* subquery to get group IDs */));
  
  await db
    .delete(groups)
    .where(eq(groups.workshopId, workshopId));
  
  // Create groups in transaction
  const createdGroups = await db.transaction(async (tx) => {
    const groupRecords = [];
    
    for (let i = 0; i < generatedGroups.length; i++) {
      const [group] = await tx
        .insert(groups)
        .values({
          workshopId,
          groupNumber: i + 1,
        })
        .returning();
      
      groupRecords.push(group);
      
      // Create group member records
      for (const participantId of generatedGroups[i].participants) {
        await tx.insert(groupMembers).values({
          groupId: group.id,
          participantId,
        });
      }
    }
    
    return groupRecords;
  });
  
  return { success: true, groups: createdGroups };
}
```

## Algorithm Explanation

### Greedy Approach

1. Start with unassigned participants
2. Form groups iteratively:
   - Select initial participant (highest average distance to others)
   - Add participants that maximize minimum distance to current group
   - Stop when target size reached
3. Repeat until all participants assigned

### Flexibility Handling

- Flexible groups (3-4): Prefer 4, use 3 for remainder
- Ensure remainder doesn't create unbalanced groups
- Last group may be smaller if total not divisible

### Determinism

- Use deterministic selection (highest distance, not random)
- Same participant order produces same groups
- Sort participants by ID before processing for consistency

## Database Transactions

- All group creation wrapped in transaction
- If any part fails, entire operation rolls back
- Ensures data consistency

## Future Enhancements

- Improved algorithm (simulated annealing, genetic algorithm)
- Additional constraints (gender balance, role diversity)
- Group quality metrics (average distance, min distance)
- Preview groups before confirming
- Manual group adjustments
- Group generation history
