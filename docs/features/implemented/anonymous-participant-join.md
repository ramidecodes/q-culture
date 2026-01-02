# Feature Requirement Document: Anonymous Participant Join

## Feature Name

Anonymous Participant Join

## Goal

Allow participants to join a workshop anonymously without authentication by entering their name and country via a join code, with a session token for subsequent identification.

## User Story

As a participant, I want to join a workshop by entering a code and providing my name and country, so that I can participate without creating an account or logging in.

## Functional Requirements

- Participants can join via join code or join link
- Join code validation (6-character alphanumeric)
- Participant must provide:
  - Display name (required, 1-100 characters)
  - Country selection (required, from predefined list)
- Inputs can only be submitted once per session
- System generates unique anonymous session token (UUID)
- Session token stored in httpOnly cookie
- Participant record created in database
- Redirect to participant status page after successful join
- Prevent duplicate joins (same session token + workshop)
- Validate workshop exists and is in "collecting" status

## Data Requirements

**Participants Table**
- `id` (uuid, primary key)
- `workshop_id` (uuid, foreign key -> workshops.id)
- `name` (text, required, 1-100 chars)
- `country_code` (text, foreign key -> countries.iso_code)
- `session_token` (text, unique, required)
- `created_at` (timestamp, default: now)

**Constraints**
- Unique constraint: (workshop_id, session_token) - one participant per session per workshop
- Foreign key: workshop_id references workshops(id)
- Foreign key: country_code references countries(iso_code)

**Workshops Table**
- Status must be "collecting" for participants to join

## User Flow

1. Participant receives join code or join link
2. Participant navigates to `/join/[code]` page
3. System validates join code exists and workshop is in "collecting" status
4. If invalid code or wrong status, show error message
5. Participant sees form with Name and Country fields
6. Participant enters their name
7. Participant selects country from dropdown/searchable list
8. Participant clicks "Join Workshop" button
9. System validates inputs
10. System checks if participant already joined (session token exists)
11. If new participant, system generates session token
12. System creates participant record
13. System sets session token in httpOnly cookie
14. Participant redirected to `/participant/[token]` status page

## Acceptance Criteria

- Join code validation works correctly
- Invalid join codes show clear error message
- Workshop must be in "collecting" status to allow joins
- Name field accepts 1-100 characters
- Country selection from valid country list
- Form validation provides immediate feedback
- Duplicate joins prevented (same session token)
- Session token stored securely in httpOnly cookie
- Participant record created with correct data
- Redirect to status page after successful join
- Cannot re-join same workshop with same session

## Edge Cases

- Invalid join code entered (show error, allow retry)
- Workshop not found (show error message)
- Workshop in wrong status (show message explaining why can't join)
- Participant already joined (redirect to status page or show message)
- Participant refreshes page after submission (maintain session)
- Participant opens link in multiple tabs (consistent behavior)
- Empty name submission (validation error)
- Network error during submission (show error, allow retry)
- Session token generation collision (retry with new UUID)
- Country code not in database (validation error)

## Non-Functional Requirements

- Join submission completes in < 1 second
- Session token generation is cryptographically secure (crypto.randomUUID)
- Cookie is httpOnly for security
- Form is accessible (keyboard navigation, screen readers)
- Responsive design for mobile devices
- Error messages are clear and actionable

## Technical Implementation Details

### Key Files

- `app/join/[code]/page.tsx` - Join page with form
- `lib/actions/participant-actions.ts` - Server action for participant join
- `lib/db/schema/participants.ts` - Participant schema definition
- `components/country-select.tsx` - Country selection component
- `components/participant-join-form.tsx` - Join form component
- `lib/utils/session-token.ts` - Session token utilities

### Dependencies

- zod - Form validation
- react-hook-form - Form state management
- ShadCN Form, Input, Select components
- cookies-next or next/headers for cookie management

### Server Action Implementation

```typescript
// lib/actions/participant-actions.ts
"use server";

import { db } from "@/lib/db";
import { participants, workshops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function joinWorkshop(
  joinCode: string,
  data: { name: string; countryCode: string }
) {
  // Validate join code and workshop status
  const workshop = await db.query.workshops.findFirst({
    where: eq(workshops.joinCode, joinCode),
  });
  
  if (!workshop) {
    return { error: "Invalid join code" };
  }
  
  if (workshop.status !== "collecting") {
    return { error: "Workshop is not accepting participants" };
  }
  
  // Validate inputs
  if (!data.name || data.name.length < 1 || data.name.length > 100) {
    return { error: "Name must be 1-100 characters" };
  }
  
  if (!data.countryCode) {
    return { error: "Country is required" };
  }
  
  // Get or create session token
  const cookieStore = await cookies();
  let sessionToken = cookieStore.get("session_token")?.value;
  
  if (!sessionToken) {
    sessionToken = randomUUID();
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  
  // Check if already joined
  const existing = await db.query.participants.findFirst({
    where: and(
      eq(participants.workshopId, workshop.id),
      eq(participants.sessionToken, sessionToken)
    ),
  });
  
  if (existing) {
    return { 
      error: "You have already joined this workshop",
      participant: existing,
    };
  }
  
  // Create participant record
  const [participant] = await db
    .insert(participants)
    .values({
      workshopId: workshop.id,
      name: data.name,
      countryCode: data.countryCode,
      sessionToken,
    })
    .returning();
  
  return { success: true, participant, token: sessionToken };
}
```

### Join Page Component

```typescript
// app/join/[code]/page.tsx
import { db } from "@/lib/db";
import { workshops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { JoinForm } from "@/components/participant-join-form";
import { notFound, redirect } from "next/navigation";

export default async function JoinPage({ params }: { params: { code: string } }) {
  const workshop = await db.query.workshops.findFirst({
    where: eq(workshops.joinCode, params.code),
  });
  
  if (!workshop) {
    notFound();
  }
  
  if (workshop.status !== "collecting") {
    return (
      <div>
        <h1>Workshop Not Accepting Participants</h1>
        <p>The workshop is currently in {workshop.status} status.</p>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Join Workshop: {workshop.title}</h1>
      <JoinForm joinCode={params.code} />
    </div>
  );
}
```

### Join Form Component

```typescript
// components/participant-join-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { joinWorkshop } from "@/lib/actions/participant-actions";
import { useRouter } from "next/navigation";
import { CountrySelect } from "@/components/country-select";

const joinSchema = z.object({
  name: z.string().min(1).max(100),
  countryCode: z.string().min(2).max(2),
});

export function JoinForm({ joinCode }: { joinCode: string }) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      name: "",
      countryCode: "",
    },
  });
  
  async function onSubmit(data: z.infer<typeof joinSchema>) {
    const result = await joinWorkshop(joinCode, data);
    
    if (result?.error) {
      // Show error toast
      return;
    }
    
    router.push(`/participant/${result.token}`);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your name" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Country</FormLabel>
              <FormControl>
                <CountrySelect {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Join Workshop</Button>
      </form>
    </Form>
  );
}
```

## Validation Rules

- **Name**: Required, 1-100 characters, alphanumeric + spaces
- **Country Code**: Required, valid ISO 3166-1 alpha-2 code from countries table
- **Join Code**: 6-character alphanumeric, must exist in workshops table
- **Workshop Status**: Must be "collecting"

## Security Considerations

- Session tokens generated using crypto.randomUUID (cryptographically secure)
- Cookies set as httpOnly (not accessible via JavaScript)
- Secure flag in production (HTTPS only)
- SameSite=lax for CSRF protection
- Validation on both client and server side
- SQL injection prevention via Drizzle ORM parameterized queries

## UI/UX Considerations

- Clear instructions on join page
- Workshop title displayed for confirmation
- Form fields with proper labels and placeholders
- Real-time validation feedback
- Loading state during submission
- Success/error toast notifications
- Accessible form (keyboard navigation, ARIA labels)
- Mobile-responsive design
- Country select component with search/filter capability

## Database Constraints

- Unique constraint on (workshop_id, session_token)
- Foreign key constraints enforce referential integrity
- Not null constraints on required fields

## Future Enhancements

- Join via QR code
- Pre-registration with email notification
- Participant limit per workshop
- Custom participant fields/questions
- Bulk participant import
