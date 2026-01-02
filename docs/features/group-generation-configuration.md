# Feature Requirement Document: Group Generation Configuration

## Feature Name

Group Generation Configuration

## Goal

Allow facilitators to configure grouping parameters (cultural framework and group size) before generating diverse groups, ensuring the grouping algorithm uses the correct settings.

## User Story

As a facilitator, I want to choose the cultural framework and group size for grouping, so that participants are grouped according to my workshop requirements and learning objectives.

## Functional Requirements

- Facilitator can select cultural framework:
  - Lewis Framework
  - Hall Framework
  - Hofstede Framework
  - Combined (all frameworks weighted equally)
- Facilitator can select group size:
  - Fixed size: 3 participants
  - Fixed size: 4 participants
  - Flexible: 3-4 participants (prefer 4, allow 3 when remainder)
- Configuration must be saved to workshop record
- Configuration can only be set before groups are generated
- Configuration cannot be changed after groups are generated
- Validation: Minimum participant count must meet group size requirement
- Configuration display shows current settings
- Confirmation step before generating groups

## Data Requirements

**Workshops Table**
- `framework` (enum: 'lewis' | 'hall' | 'hofstede' | 'combined', nullable)
- `group_size` (integer, nullable - 3, 4, or null for flexible)

**Validation Rules**
- Configuration must be set before generating groups
- If group_size = 3, need minimum 3 participants
- If group_size = 4, need minimum 4 participants
- If group_size = null (flexible), need minimum 3 participants

## User Flow

1. Facilitator navigates to workshop detail page
2. Workshop status is "collecting" or "draft"
3. Facilitator clicks "Configure Grouping" button/tab
4. Facilitator sees configuration form with:
   - Framework selection (radio group or select)
   - Group size selection (radio group or select)
5. Facilitator selects desired framework
6. Facilitator selects desired group size
7. System validates participant count meets minimum requirement
8. Facilitator clicks "Save Configuration" button
9. Configuration saved to workshop record
10. Configuration displayed for review
11. Facilitator can proceed to generate groups

## Acceptance Criteria

- Configuration form displays available options
- Framework selection works correctly (radio group or select)
- Group size selection works correctly
- Configuration saves to database
- Saved configuration is displayed correctly
- Cannot change configuration after groups are generated
- Validation prevents invalid configurations (insufficient participants)
- Error messages are clear for validation failures
- Configuration persists across page refreshes

## Edge Cases

- Too few participants for selected group size (show error, prevent saving)
- Configuration already set (allow editing before groups generated)
- Groups already generated (disable configuration changes)
- Workshop status prevents configuration (e.g., closed workshop)
- Network error during save (show error, allow retry)
- Invalid framework value (validation error)
- Invalid group size value (validation error)

## Non-Functional Requirements

- Configuration save completes in < 300ms
- Form provides immediate validation feedback
- UI is clear and intuitive
- Configuration options are clearly explained

## Technical Implementation Details

### Key Files

- `app/dashboard/workshop/[id]/configure/page.tsx` - Configuration page
- `lib/actions/grouping-actions.ts` - Server action for saving configuration
- `components/grouping-config-form.tsx` - Configuration form component
- `lib/db/schema/workshops.ts` - Workshop schema with configuration fields

### Dependencies

- ShadCN RadioGroup, Select, Button, Form components
- zod for validation
- react-hook-form for form management

### Schema Definition

```typescript
// lib/db/schema/workshops.ts
export const frameworkEnum = pgEnum("framework", [
  "lewis",
  "hall",
  "hofstede",
  "combined",
]);

export const workshops = pgTable("workshops", {
  // ... other fields
  framework: frameworkEnum("framework"),
  groupSize: integer("group_size"), // 3, 4, or null for flexible
});
```

### Server Action

```typescript
// lib/actions/grouping-actions.ts
"use server";

import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { workshops, participants } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function saveGroupingConfig(
  workshopId: string,
  config: {
    framework: "lewis" | "hall" | "hofstede" | "combined";
    groupSize: 3 | 4 | null;
  }
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
  
  // Check if groups already generated
  const groupsCount = await db
    .select({ count: count() })
    .from(groups)
    .where(eq(groups.workshopId, workshopId));
  
  if (groupsCount[0]?.count > 0) {
    return { error: "Cannot change configuration after groups are generated" };
  }
  
  // Validate minimum participant count
  const participantCount = await db
    .select({ count: count() })
    .from(participants)
    .where(eq(participants.workshopId, workshopId));
  
  const minRequired = config.groupSize ?? 3;
  
  if (participantCount[0]?.count < minRequired) {
    return {
      error: `Need at least ${minRequired} participants for this group size`,
    };
  }
  
  // Save configuration
  await db
    .update(workshops)
    .set({
      framework: config.framework,
      groupSize: config.groupSize,
      updatedAt: new Date(),
    })
    .where(eq(workshops.id, workshopId));
  
  return { success: true };
}
```

### Configuration Form Component

```typescript
// components/grouping-config-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { saveGroupingConfig } from "@/lib/actions/grouping-actions";

const configSchema = z.object({
  framework: z.enum(["lewis", "hall", "hofstede", "combined"]),
  groupSize: z.union([z.literal(3), z.literal(4), z.null()]),
});

export function GroupingConfigForm({
  workshopId,
  currentConfig,
}: {
  workshopId: string;
  currentConfig?: { framework?: string; groupSize?: number | null };
}) {
  const form = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
      framework: (currentConfig?.framework as any) || "combined",
      groupSize: currentConfig?.groupSize ?? null,
    },
  });
  
  async function onSubmit(data: z.infer<typeof configSchema>) {
    const result = await saveGroupingConfig(workshopId, data);
    
    if (result?.error) {
      // Show error toast
      return;
    }
    
    // Show success message
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="framework"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cultural Framework</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lewis" id="lewis" />
                    <label htmlFor="lewis">Lewis Framework</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hall" id="hall" />
                    <label htmlFor="hall">Hall Framework</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hofstede" id="hofstede" />
                    <label htmlFor="hofstede">Hofstede Framework</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="combined" id="combined" />
                    <label htmlFor="combined">Combined (All Frameworks)</label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="groupSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Size</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) =>
                    field.onChange(value === "flexible" ? null : parseInt(value))
                  }
                  value={field.value?.toString() ?? "flexible"}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="size3" />
                    <label htmlFor="size3">3 participants</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4" id="size4" />
                    <label htmlFor="size4">4 participants</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="flexible" />
                    <label htmlFor="flexible">Flexible (3-4 participants)</label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Save Configuration</Button>
      </form>
    </Form>
  );
}
```

## Configuration Options Explanation

### Cultural Frameworks

- **Lewis**: Focuses on communication styles (Linear-active, Multi-active, Reactive)
- **Hall**: Emphasizes context, time, and space dimensions
- **Hofstede**: Six dimensions including power distance, individualism, etc.
- **Combined**: Uses all frameworks with equal weighting for maximum diversity

### Group Sizes

- **3 participants**: Smaller groups, more intimate discussions
- **4 participants**: Balanced groups, good for diverse perspectives
- **Flexible (3-4)**: Prefers 4, uses 3 for remainder participants

## UI/UX Considerations

- Clear labels and descriptions for each option
- Help text explaining each framework option
- Visual indicators for selected options
- Validation feedback before submission
- Success confirmation after saving
- Display current configuration if already set
- Disable editing if groups already generated
- Responsive design for mobile

## Validation Logic

- Minimum participant count validation
- Framework must be one of the allowed values
- Group size must be 3, 4, or null
- Cannot change after groups generated
- Workshop must be in valid state (not closed)

## Visualization Requirements

The group generation configuration feature provides a framework preview visualization that helps facilitators understand the implications of their framework choice before generating groups.

### Framework Preview Visualization

**Purpose**: Help facilitators understand how different frameworks will affect grouping by showing cultural dimension patterns of their participants

**Visualization Components**:

1. **Framework Dimension Overview**
   - Shows which dimensions are included in each framework
   - Lewis: 3 dimensions (Linear-Active, Multi-Active, Reactive)
   - Hall: 3 dimensions (Context, Time, Space)
   - Hofstede: 6 dimensions (Power Distance, Individualism, Masculinity, Uncertainty Avoidance, Long-term Orientation, Indulgence)
   - Combined: All dimensions from all frameworks
   - Visual indicator of dimension count and types

2. **Participant Cultural Profile Preview**
   - Radar chart or parallel coordinates showing participant cultural scores
   - Framework-specific view (updates when framework selection changes)
   - All participants or sample displayed
   - Color coding by country
   - Use case: Understand cultural diversity visible in selected framework

3. **Distance Distribution Preview**
   - Histogram showing distribution of pairwise distances between participants
   - Calculated for selected framework
   - Shows potential for diverse grouping
   - Can compare distributions across frameworks (side-by-side or overlay)
   - Use case: Understand how framework choice affects distance patterns

4. **Simulated Grouping Preview** (Optional)
   - Preview of potential group assignments using selected framework
   - Shows how groups might look with current participant set
   - Not saved until facilitator confirms
   - Can regenerate preview to see variations
   - Use case: Preview grouping results before committing

**Interactive Features**:
- Framework selection: Radio buttons or visual framework cards
- Real-time preview: Visualization updates immediately when framework changes
- Participant filtering: Option to preview with subset of participants
- Comparison mode: Side-by-side comparison of frameworks (optional)
- Reset preview: Clear preview and return to default view

### User Flow

1. Facilitator navigates to group generation configuration page
2. System displays configuration form with framework selection
3. As facilitator hovers or selects each framework:
   - Framework preview panel shows:
     - Dimension overview for that framework
     - Participant cultural profile visualization
     - Distance distribution histogram
4. Facilitator selects framework (preview updates)
5. Facilitator selects group size
6. System validates configuration
7. Optional: Facilitator can click "Preview Groups" to see simulated grouping
8. Facilitator saves configuration
9. Preview remains available for review before generating actual groups

### Data Requirements

**Query Requirements**:
- Fetch all participants for workshop
- Fetch cultural scores for each participant's country
- Calculate distance matrix for each framework (for comparison)
- Optional: Run simulated grouping algorithm for preview

**Real-time Updates**:
- Framework selection changes trigger immediate preview update
- Participant additions (if workshop still collecting) update preview
- Preview is recalculated when needed

**Caching Considerations**:
- Distance matrices can be pre-computed for all frameworks
- Preview grouping results can be cached per framework
- Recalculate when participants change

### Technical Implementation Details

#### Key Files

- `components/grouping-config/framework-preview.tsx` - Framework preview visualization component
- `components/grouping-config/framework-selector.tsx` - Framework selection with preview
- `components/grouping-config/preview-visualization.tsx` - Preview visualization container
- `lib/utils/framework-preview-data.ts` - Prepare data for framework previews

#### Dependencies

- `recharts`: Radar charts, histograms for previews
- `react-force-graph-2d`: Optional preview grouping network graph
- `d3-scale-chromatic`: Color schemes

#### Preview Data Preparation

```typescript
// lib/utils/framework-preview-data.ts
export async function prepareFrameworkPreview(
  workshopId: string,
  framework: Framework
): Promise<FrameworkPreview> {
  const participants = await getWorkshopParticipants(workshopId);
  const participantsWithScores = await Promise.all(
    participants.map(async (p) => ({
      ...p,
      culturalScores: await getCountryCulturalData(p.countryCode),
    }))
  );

  const distanceMatrix = generateDistanceMatrix(
    participantsWithScores,
    framework
  );

  const distances = extractAllDistances(distanceMatrix);

  return {
    framework,
    dimensionCount: getDimensionCount(framework),
    participantProfiles: transformToProfileData(participantsWithScores, framework),
    distanceDistribution: calculateDistanceDistribution(distances),
    previewGroups: framework === "combined" ? null : simulateGrouping(participantsWithScores, framework),
  };
}

function extractAllDistances(
  matrix: Map<string, Map<string, number>>
): number[] {
  const distances: number[] = [];
  for (const [, row] of matrix) {
    for (const [, distance] of row) {
      if (distance > 0) {
        distances.push(distance);
      }
    }
  }
  return distances;
}
```

### Performance Considerations

- Pre-compute distance matrices for all frameworks on page load
- Lazy load preview grouping simulation (only when requested)
- Memoize preview calculations
- Debounce framework switching if needed
- Cache preview data until participants change

### Accessibility

- Screen reader support: Descriptive text for framework options and previews
- Keyboard navigation: Tab through framework options, arrow keys for previews
- High contrast mode: Framework selection clearly distinguishable
- Text alternatives: Framework information available as text descriptions
- Tooltip information: Framework descriptions on hover/focus

### Visualization Acceptance Criteria

- Framework preview updates immediately when framework selection changes
- Participant cultural profile visualization is accurate for selected framework
- Distance distribution histogram correctly shows distance patterns
- Preview grouping (if implemented) generates valid group assignments
- Framework comparison (if implemented) shows meaningful differences
- Performance acceptable: Preview renders in <1 second
- Preview is accessible (keyboard, screen reader)
- Framework descriptions are clear and helpful
- Preview helps facilitators make informed framework choices

### Integration with Other Features

- **Cultural Reference Data**: Uses cultural scores for previews
- **Cultural Distance Computation**: Uses distance calculation logic
- **Group Assignment**: Preview uses same grouping algorithm
- **Participant Collection Overview**: Links from participant list to configuration

## Future Enhancements

- Custom framework weighting (for combined option) with preview
- Advanced preview options (simulated grouping with different algorithms)
- Historical configuration tracking with visualization comparisons
- Recommended configurations based on participant count and distribution
- Advanced options (gender balance, etc.) with preview
- Side-by-side framework comparison mode
- Animated transition showing how framework choice affects grouping
- Framework recommendation engine with visual explanations
