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

## Visualization Requirements

The group assignment feature provides visualizations that help facilitators understand how groups were formed, verify group diversity, and demonstrate the grouping results to participants or stakeholders.

### Group Network Visualization

**Purpose**: Visualize generated groups and their internal diversity using network graphs

**Components**:
- Network graph with nodes representing participants
- Nodes colored or clustered by group assignment
- Edges represent cultural distances between participants
- Intra-group connections highlighted (edges within same group)
- Inter-group connections shown with different styling (lighter/thinner)
- Group boundaries can be visually indicated (circles, clustering, or color coding)

**Features**:
- Group highlighting: Click a group to highlight all members and connections
- Distance display: Hover over edges to see exact cultural distances
- Group statistics overlay: Display average intra-group distance for each group
- Framework switching: Update distances based on selected framework
- Layout options:
  - Clustered layout: Groups positioned as distinct clusters
  - Force-directed layout: Natural grouping based on distances
  - Circular layout: Groups arranged in circles
- Filter options:
  - Show/hide inter-group connections
  - Show/hide intra-group connections
  - Highlight specific groups
  - Filter by distance threshold

**Use Cases**:
- Facilitator reviews group assignments visually
- Verify that groups are maximally diverse (larger intra-group distances)
- Demonstrate grouping algorithm results
- Compare groups side-by-side
- Show cultural diversity within each group

### Group Diversity Metrics Display

**Purpose**: Show quantitative metrics about group quality and diversity

**Metrics Displayed**:
- **Average intra-group distance**: Mean distance between all pairs within each group
- **Minimum intra-group distance**: Smallest distance between any two members in group
- **Maximum intra-group distance**: Largest distance between any two members in group
- **Group diversity score**: Normalized score indicating overall diversity
- **Inter-group comparison**: Compare diversity metrics across groups

**Visualization Types**:
1. **Bar Chart**: One bar per group showing average intra-group distance
2. **Table View**: Detailed metrics table with sortable columns
3. **Radar Chart**: Compare multiple groups across different metrics
4. **Distribution Chart**: Histogram showing distance distribution within groups

**Interactive Features**:
- Sort groups by any metric
- Filter groups by diversity thresholds
- Highlight groups with low/high diversity
- Export metrics as CSV or report

### User Flow

1. Facilitator generates groups (via group assignment algorithm)
2. System creates groups and stores in database
3. System displays group assignment confirmation with visualization button
4. Facilitator clicks "View Group Visualization" button
5. System displays group network graph (default view)
6. Facilitator can:
   - Switch between network graph and metrics view
   - Click groups to see details
   - View diversity metrics table
   - Export visualization or metrics
   - Compare groups
7. Facilitator can use visualization to:
   - Verify group quality
   - Explain grouping to participants
   - Demonstrate cultural diversity
   - Share results with stakeholders

### Data Requirements

**Query Requirements**:
- Fetch all groups for workshop
- Fetch all participants with their group assignments
- Fetch cultural scores for participants
- Compute distance matrix for selected framework
- Calculate diversity metrics for each group

**Real-time Updates**:
- Visualization updates if groups are regenerated
- Framework switching recalculates distances and metrics
- Group changes (manual adjustments, if supported) update visualization

### Technical Implementation Details

#### Key Files

- `components/cultural-visualizations/group-network.tsx` - Group network visualization component
- `components/cultural-visualizations/group-metrics.tsx` - Diversity metrics display component
- `lib/utils/group-visualization-data.ts` - Transform groups and distances for visualization
- `lib/utils/group-metrics.ts` - Calculate diversity metrics for groups

#### Dependencies

- `react-force-graph-2d`: Network graph rendering with group clustering
- `recharts`: Bar charts and other metric visualizations
- `d3-scale-chromatic`: Color schemes for group differentiation

#### Group Metrics Calculation

```typescript
// lib/utils/group-metrics.ts
export function calculateGroupMetrics(
  group: { participants: string[] },
  distanceMatrix: Map<string, Map<string, number>>
): GroupMetrics {
  const distances: number[] = [];
  
  for (let i = 0; i < group.participants.length; i++) {
    for (let j = i + 1; j < group.participants.length; j++) {
      const dist = distanceMatrix
        .get(group.participants[i])
        ?.get(group.participants[j]) ?? 0;
      distances.push(dist);
    }
  }
  
  return {
    averageDistance: distances.reduce((a, b) => a + b, 0) / distances.length,
    minDistance: Math.min(...distances),
    maxDistance: Math.max(...distances),
    diversityScore: normalizeDiversityScore(distances),
  };
}

function normalizeDiversityScore(distances: number[]): number {
  // Normalize to 0-1 scale based on framework's maximum distance
  const avg = distances.reduce((a, b) => a + b, 0) / distances.length;
  const maxPossible = Math.sqrt(6); // Maximum for Hofstede framework
  return Math.min(avg / maxPossible, 1);
}
```

#### Group Network Data Transformation

```typescript
// lib/utils/group-visualization-data.ts
export function transformGroupsToNetworkData(
  groups: Group[],
  participants: Participant[],
  distanceMatrix: Map<string, Map<string, number>>
): NetworkData {
  const nodes = participants.map((p) => {
    const group = groups.find((g) => g.participants.includes(p.id));
    return {
      id: p.id,
      name: p.name,
      country: p.countryName,
      group: group?.id,
      groupNumber: group?.groupNumber,
    };
  });

  const links: Array<{
    source: string;
    target: string;
    distance: number;
    isIntraGroup: boolean;
  }> = [];

  for (const [sourceId, distances] of distanceMatrix.entries()) {
    for (const [targetId, distance] of distances.entries()) {
      if (sourceId < targetId) {
        const sourceGroup = groups.find((g) => g.participants.includes(sourceId));
        const targetGroup = groups.find((g) => g.participants.includes(targetId));
        const isIntraGroup = sourceGroup?.id === targetGroup?.id;

        links.push({
          source: sourceId,
          target: targetId,
          distance,
          isIntraGroup,
        });
      }
    }
  }

  return { nodes, links };
}
```

### Performance Considerations

- Efficient calculation of group metrics (O(n²) per group)
- Lazy load visualization if many groups
- Memoize group network data transformation
- Progressive rendering for large groups
- Cache metrics calculations per framework

### Accessibility

- Keyboard navigation: Tab through groups, arrow keys to navigate
- Screen reader support: Descriptive text for group assignments and metrics
- High contrast mode: Group colors distinguishable
- Text alternatives: Metrics available in accessible table format
- Tooltip information also in info panels

### Visualization Acceptance Criteria

- Group network graph renders correctly with proper grouping
- Groups are clearly distinguishable (colors, clusters, or boundaries)
- Intra-group and inter-group connections are visually distinct
- Diversity metrics are accurate and displayed clearly
- Framework switching updates visualization correctly
- Export functionality works (image, CSV metrics)
- Interactive features (hover, click, filter) work smoothly
- Performance acceptable: renders in <2 seconds for typical workshops
- Mobile-responsive: Simplified view on small screens
- Metrics table is sortable and filterable

### Integration with Other Features

- **Cultural Distance Computation**: Uses distance matrix from computation feature
- **Group Generation Configuration**: Framework selection affects visualization
- **Participant Collection Overview**: Can link from participant list to group visualization
- **Participant Group View**: Participants can see simplified group visualization

## Future Enhancements

- Improved algorithm (simulated annealing, genetic algorithm)
- Additional constraints (gender balance, role diversity)
- Preview groups before confirming (with visualization)
- Manual group adjustments with live visualization update
- Group generation history with comparison visualizations
- Animation of group formation process
- 3D visualization of group clusters
- Group recommendation engine with visual explanations
