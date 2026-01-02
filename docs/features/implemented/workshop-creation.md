# Feature Requirement Document: Workshop Creation

## Feature Name

Workshop Creation

## Goal

Enable authenticated facilitators to create new workshop sessions with a title, optional date, and automatically generated unique join code that participants can use to join the workshop.

## User Story

As a facilitator, I want to create a new workshop with a title and optional date, so that I can generate a unique join code to share with participants.

## Functional Requirements

- Facilitator can create a workshop with:
  - Title (required, max 200 characters)
  - Optional date (future date allowed)
- System automatically generates unique 6-character alphanumeric join code
- Workshop is created in "collecting" status (active and ready for participants)
- Workshop is associated with authenticated facilitator's Clerk user ID
- Success confirmation with join link/code displayed
- Error handling for validation failures
- Redirect to workshop detail page after creation
- Join code must be unique (collision handling)

## Data Requirements

**Workshops Table**
- `id` (uuid, primary key, auto-generated)
- `title` (text, required, max 200 chars)
- `date` (date, nullable)
- `join_code` (text, required, unique, 6 alphanumeric chars)
- `facilitator_id` (text, required - Clerk user ID)
- `status` (enum, default: 'collecting')
- `created_at` (timestamp, default: now)
- `updated_at` (timestamp, default: now)

## User Flow

1. Facilitator navigates to "Create Workshop" page from dashboard
2. Facilitator sees form with Title and Date fields
3. Facilitator enters workshop title
4. Facilitator optionally selects date
5. Facilitator clicks "Create Workshop" button
6. System validates input (title required, date format valid)
7. System generates unique join code
8. System creates workshop record in database
9. Success message displayed with join code/link
10. Facilitator redirected to workshop detail page

## Acceptance Criteria

- Form validates required fields before submission
- Title field accepts maximum 200 characters
- Date field accepts valid date format (optional)
- Unique join code is generated for each workshop
- Workshop record created with correct facilitator_id
- Workshop status defaults to "collecting" (active state)
- Join code/link is displayed after creation
- Success toast notification appears
- Redirect to workshop detail page works correctly
- Error messages display for validation failures
- Duplicate join code collision handled (retry generation)

## Edge Cases

- Duplicate join code collision (regenerate until unique)
- Facilitator refreshes page during creation (prevent duplicate submission)
- Network error during submission (show error, allow retry)
- Invalid date format entered
- Title exceeds character limit
- Empty title submission
- Date in the past (should allow or warn?)
- Multiple rapid submissions (debounce or disable button)

## Non-Functional Requirements

- Workshop creation completes in < 500ms
- Join code generation is cryptographically secure (use crypto.randomUUID or similar)
- Form validation provides immediate feedback
- Error messages are clear and actionable
- UI is responsive and accessible

## Technical Implementation Details

### Key Files

- `app/dashboard/new-workshop/page.tsx` - Workshop creation form page
- `lib/actions/workshop-actions.ts` - Server action for workshop creation
- `lib/db/schema/workshops.ts` - Workshop schema definition
- `components/workshop-form.tsx` - Reusable workshop form component (optional)
- `lib/utils/join-code.ts` - Join code generation utility

### Dependencies

- @hookform/resolvers - Form validation
- zod - Schema validation
- react-hook-form - Form state management
- ShadCN Form, Input, Button components

### Server Action Implementation

```typescript
// lib/actions/workshop-actions.ts
"use server";

import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workshops } from "@/lib/db/schema";
import { generateJoinCode } from "@/lib/utils/join-code";

export async function createWorkshop(data: {
  title: string;
  date?: string;
}) {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Validate input
  if (!data.title || data.title.length > 200) {
    return { error: "Invalid title" };
  }
  
  // Generate unique join code
  let joinCode = generateJoinCode();
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const existing = await db.query.workshops.findFirst({
      where: eq(workshops.joinCode, joinCode),
    });
    
    if (!existing) {
      break;
    }
    
    joinCode = generateJoinCode();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    return { error: "Failed to generate unique join code" };
  }
  
  // Create workshop
  const [workshop] = await db
    .insert(workshops)
    .values({
      title: data.title,
      date: data.date || null,
      joinCode,
      facilitatorId: userId,
      status: "collecting",
    })
    .returning();
  
  return { success: true, workshop, joinCode };
}
```

### Join Code Generation

```typescript
// lib/utils/join-code.ts
export function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
```

### Form Component

```typescript
// app/dashboard/new-workshop/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { createWorkshop } from "@/lib/actions/workshop-actions";
import { useRouter } from "next/navigation";

const workshopSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().optional(),
});

export default function NewWorkshopPage() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(workshopSchema),
    defaultValues: {
      title: "",
      date: "",
    },
  });
  
  async function onSubmit(data: z.infer<typeof workshopSchema>) {
    const result = await createWorkshop(data);
    
    if (result?.error) {
      // Handle error
      return;
    }
    
    router.push(`/dashboard/workshop/${result.workshop.id}`);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## Validation Rules

- **Title**: Required, 1-200 characters
- **Date**: Optional, valid ISO date format, can be in past (facilitator decision)
- **Join Code**: Auto-generated, 6 alphanumeric characters, uppercase

## UI/UX Considerations

- Form uses ShadCN Form components for consistency
- Clear labels and placeholders
- Real-time validation feedback
- Loading state during submission
- Success toast notification
- Join code displayed prominently after creation
- Copy-to-clipboard functionality for join code/link
- Responsive design for mobile devices

## Database Constraints

- Unique constraint on `join_code` column
- Foreign key relationship to facilitator (via Clerk user ID)
- Default value for `status` = 'collecting'
- Timestamps auto-managed

## Future Enhancements

- Workshop description field
- Workshop settings (max participants, etc.)
- Duplicate workshop template
- Bulk workshop creation
- Workshop preview before creation
