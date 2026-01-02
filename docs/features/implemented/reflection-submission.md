# Feature Requirement Document: Reflection Submission

## Feature Name

Participant Reflection Submission

## Goal

Allow participants to submit text-based reflection feedback after group discussions, enabling facilitators to collect and review participant insights from the workshop.

## User Story

As a participant, I want to submit my reflections after discussing with my group, so that my feedback and insights are recorded for the facilitator.

## Functional Requirements

- Text-only input field (textarea)
- Character limit (optional: 500-1000 characters recommended)
- One submission per participant (enforced by database constraint)
- Submission only allowed after groups are generated (workshop status = "grouped")
- Submission only allowed before workshop is closed
- Character count indicator (optional, if limit enforced)
- Submit button to save reflection
- Success confirmation after submission
- Cannot edit reflection after submission
- Clear indication if reflection already submitted

## Data Requirements

**Reflections Table**
- `id` (uuid, primary key)
- `participant_id` (uuid, foreign key -> participants.id, unique)
- `group_id` (uuid, foreign key -> groups.id)
- `content` (text, required)
- `submitted_at` (timestamp, default: now)

**Constraints**
- Unique constraint on `participant_id` (one reflection per participant)
- Foreign key to participant ensures data integrity
- Foreign key to group links reflection to group context

## User Flow

1. Participant navigates to reflection submission page `/participant/[token]/reflect`
2. System validates session token and checks if groups are assigned
3. If groups not assigned:
   - Show message: "Groups not yet assigned"
   - Redirect or show waiting state
4. If reflection already submitted:
   - Show read-only view of submitted reflection
   - Disable editing
5. If groups assigned and no reflection submitted:
   - Display reflection form with textarea
   - Show character count (if limit enforced)
   - Participant enters reflection text
   - Participant clicks "Submit Reflection" button
   - System validates input (not empty, within character limit)
   - System creates reflection record in database
   - Success message displayed
   - View switches to read-only mode

## Acceptance Criteria

- Reflection form displays correctly when eligible
- Textarea accepts multi-line text input
- Character count updates in real-time (if limit enforced)
- Validation prevents empty submissions
- Validation enforces character limit (if set)
- Submission saves to database correctly
- One submission per participant enforced (unique constraint)
- Cannot submit if groups not assigned
- Cannot submit if workshop is closed
- Cannot edit after submission
- Success confirmation displayed
- Read-only view shows submitted reflection

## Edge Cases

- Empty reflection submission (validation error)
- Reflection exceeds character limit (validation error, trim or reject)
- Participant already submitted (show read-only view)
- Groups not yet assigned (show message, prevent submission)
- Workshop closed (prevent new submissions)
- Network error during submission (show error, allow retry)
- Participant refreshes after submission (maintain read-only state)
- Session token invalid (redirect to error page)
- Multiple submission attempts (idempotent or error)

## Non-Functional Requirements

- Submission completes in < 500ms
- Form is accessible (keyboard navigation, screen readers)
- Responsive design for mobile devices
- Character count updates smoothly (if implemented)

## Technical Implementation Details

### Key Files

- `app/participant/[token]/reflect/page.tsx` - Reflection submission page
- `lib/actions/reflection-actions.ts` - Server action for reflection submission
- `lib/db/schema/reflections.ts` - Reflection schema definition
- `components/reflection-form.tsx` - Reflection form component

### Dependencies

- ShadCN Textarea, Button, Form components
- zod for validation
- react-hook-form for form management

### Schema Definition

```typescript
// lib/db/schema/reflections.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { participants } from "./participants";
import { groups } from "./groups";

export const reflections = pgTable("reflections", {
  id: uuid("id").defaultRandom().primaryKey(),
  participantId: uuid("participant_id")
    .references(() => participants.id)
    .notNull()
    .unique(),
  groupId: uuid("group_id").references(() => groups.id).notNull(),
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});
```

### Server Action

```typescript
// lib/actions/reflection-actions.ts
"use server";

import { db } from "@/lib/db";
import { reflections, participants, groups, workshops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const MAX_REFLECTION_LENGTH = 1000; // characters

export async function submitReflection(
  token: string,
  content: string
) {
  // Validate input
  if (!content || content.trim().length === 0) {
    return { error: "Reflection cannot be empty" };
  }
  
  if (content.length > MAX_REFLECTION_LENGTH) {
    return {
      error: `Reflection must be ${MAX_REFLECTION_LENGTH} characters or less`,
    };
  }
  
  // Find participant by token
  const participant = await db.query.participants.findFirst({
    where: eq(participants.sessionToken, token),
    with: {
      workshop: true,
    },
  });
  
  if (!participant) {
    return { error: "Participant not found" };
  }
  
  // Check workshop status
  if (participant.workshop.status !== "grouped") {
    return {
      error: "Reflections can only be submitted after groups are assigned",
    };
  }
  
  if (participant.workshop.status === "closed") {
    return { error: "Workshop is closed, no new submissions accepted" };
  }
  
  // Check if already submitted
  const existing = await db.query.reflections.findFirst({
    where: eq(reflections.participantId, participant.id),
  });
  
  if (existing) {
    return { error: "Reflection already submitted" };
  }
  
  // Find participant's group
  const groupMember = await db.query.groupMembers.findFirst({
    where: eq(groupMembers.participantId, participant.id),
  });
  
  if (!groupMember) {
    return { error: "Participant not assigned to a group" };
  }
  
  // Create reflection
  const [reflection] = await db
    .insert(reflections)
    .values({
      participantId: participant.id,
      groupId: groupMember.groupId,
      content: content.trim(),
    })
    .returning();
  
  return { success: true, reflection };
}

export async function getParticipantReflection(token: string) {
  const participant = await db.query.participants.findFirst({
    where: eq(participants.sessionToken, token),
  });
  
  if (!participant) {
    return null;
  }
  
  return await db.query.reflections.findFirst({
    where: eq(reflections.participantId, participant.id),
  });
}
```

### Reflection Form Component

```typescript
// components/reflection-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitReflection } from "@/lib/actions/reflection-actions";
import { useState, useEffect } from "react";

const MAX_LENGTH = 1000;

const reflectionSchema = z.object({
  content: z
    .string()
    .min(1, "Reflection cannot be empty")
    .max(MAX_LENGTH, `Reflection must be ${MAX_LENGTH} characters or less`),
});

export function ReflectionForm({ token }: { token: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [existingReflection, setExistingReflection] = useState<string | null>(null);
  
  const form = useForm({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      content: "",
    },
  });
  
  const content = form.watch("content");
  const charCount = content?.length ?? 0;
  const remaining = MAX_LENGTH - charCount;
  
  useEffect(() => {
    // Check if already submitted
    checkExistingReflection();
  }, [token]);
  
  async function checkExistingReflection() {
    const reflection = await getParticipantReflection(token);
    if (reflection) {
      setExistingReflection(reflection.content);
      setSubmitted(true);
    }
  }
  
  async function onSubmit(data: z.infer<typeof reflectionSchema>) {
    const result = await submitReflection(token, data.content);
    
    if (result?.error) {
      // Show error toast
      return;
    }
    
    setSubmitted(true);
    setExistingReflection(data.content);
    // Show success toast
  }
  
  if (submitted && existingReflection) {
    return (
      <div>
        <h2>Your Reflection</h2>
        <div className="p-4 border rounded">
          <p className="whitespace-pre-wrap">{existingReflection}</p>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Your reflection has been submitted and cannot be edited.
        </p>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Reflection</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Share your thoughts and insights from the group discussion..."
                  rows={10}
                  maxLength={MAX_LENGTH}
                />
              </FormControl>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {form.formState.errors.content?.message}
                </span>
                <span>
                  {charCount} / {MAX_LENGTH} characters
                  {remaining < 50 && (
                    <span className="text-warning">{remaining} remaining</span>
                  )}
                </span>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={submitted}>
          Submit Reflection
        </Button>
      </form>
    </Form>
  );
}
```

## Validation Rules

- **Content**: Required, 1-1000 characters (configurable)
- **Timing**: Only after groups assigned, before workshop closed
- **Frequency**: One submission per participant (database constraint)

## UI/UX Considerations

- Large textarea for comfortable writing
- Clear instructions and prompt
- Character count visible and helpful
- Visual feedback when approaching limit
- Success state clearly different from form state
- Read-only view shows submitted reflection nicely formatted
- Loading state during submission
- Error messages clear and actionable
- Accessible form (labels, ARIA attributes)
- Mobile-friendly layout

## Security Considerations

- Session token validation on every request
- Server-side validation prevents bypass
- Unique constraint prevents duplicate submissions
- Content sanitization (if needed, but text is safe)
- No XSS vulnerabilities (React handles escaping)

## Future Enhancements

- Rich text editor (with formatting)
- File attachments (optional)
- Reflection templates or prompts
- Word count instead of character count
- Auto-save drafts
- Reflection editing window (before final submission)
- Reflection sharing between group members
