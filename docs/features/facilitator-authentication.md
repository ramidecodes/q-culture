# Feature Requirement Document: Facilitator Authentication

## Feature Name

Facilitator Authentication with Clerk

## Goal

Enable facilitators to securely authenticate using Clerk authentication service, protecting facilitator-only routes and associating workshops with authenticated facilitator accounts.

## User Story

As a facilitator, I want to sign in to the application securely, so that I can create and manage my workshops with proper access control.

## Functional Requirements

- Support facilitator sign-up and sign-in via Clerk
- Protect all facilitator routes (middleware-based)
- Associate workshops with facilitator's Clerk user ID
- Support session persistence across page reloads
- Redirect unauthenticated users to sign-in page
- Redirect authenticated users to dashboard after sign-in
- Support sign-out functionality
- Display facilitator information (name, email) when authenticated
- Handle expired or invalid authentication sessions gracefully

## Data Requirements

- Facilitator identity stored via Clerk (external service)
- Workshops table includes `facilitator_id` field (text, stores Clerk user ID)
- No local facilitator table required (Clerk manages user data)
- Session tokens managed by Clerk

## User Flow

1. Unauthenticated user navigates to facilitator route
2. Middleware redirects to sign-in page
3. User signs up or signs in via Clerk authentication UI
4. Clerk handles authentication and redirects back to application
5. User is redirected to facilitator dashboard
6. Subsequent requests include authenticated session
7. User can sign out, clearing session

## Acceptance Criteria

- Unauthenticated users cannot access `/dashboard/*` or `/workshop/*` routes
- Authenticated facilitators can access all facilitator routes
- Sign-in and sign-up pages render correctly with Clerk components
- After authentication, user is redirected to dashboard
- Workshop creation associates workshop with facilitator's Clerk user ID
- Session persists across browser refresh
- Sign-out clears session and redirects to home page
- Expired sessions redirect to sign-in page

## Edge Cases

- Facilitator attempts to access workshop they did not create (should be blocked)
- Expired or invalid authentication session (should redirect to sign-in)
- Network error during authentication
- Clerk service unavailable
- User cancels authentication flow
- Multiple tabs with different authentication states
- Session refresh while user is active

## Non-Functional Requirements

- Authentication latency < 2 seconds
- Session management follows industry-standard security practices
- Protected routes enforce authentication server-side and client-side
- Sensitive data not exposed to unauthenticated users
- Authentication state synchronized across tabs

## Technical Implementation Details

### Key Files

- `middleware.ts` - Route protection middleware using Clerk
- `app/sign-in/[[...sign-in]]/page.tsx` - Clerk sign-in page
- `app/sign-up/[[...sign-up]]/page.tsx` - Clerk sign-up page
- `app/dashboard/layout.tsx` - Protected layout for facilitator routes
- `lib/auth.ts` - Authentication utility functions
- `lib/actions/workshop-actions.ts` - Server actions that check authentication

### Dependencies

- @clerk/nextjs@^5.0.0 - Clerk Next.js integration

### Middleware Configuration

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/join(.*)", "/participant(.*)"],
  ignoredRoutes: ["/api/webhooks(.*)"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### Protected Route Pattern

```typescript
// app/dashboard/layout.tsx
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return <div>{children}</div>;
}
```

### Server Action Authentication Check

```typescript
// lib/actions/workshop-actions.ts
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export async function createWorkshop(data: WorkshopFormData) {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Create workshop with facilitator_id = userId
  // ...
}
```

### Database Schema

```typescript
// Workshops table includes:
facilitatorId: text("facilitator_id").notNull(), // Clerk user ID
```

## Clerk Configuration

### Environment Variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Public Clerk key
- `CLERK_SECRET_KEY` - Server-side Clerk secret
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Sign-in URL (/sign-in)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Sign-up URL (/sign-up)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` - Redirect after sign-in (/dashboard)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` - Redirect after sign-up (/dashboard)

### Clerk Dashboard Setup

1. Create Clerk application
2. Configure authentication methods (email, OAuth, etc.)
3. Set up redirect URLs
4. Configure session settings
5. Add environment variables to project

## Security Considerations

- All facilitator routes protected at middleware level
- Server actions verify authentication before database operations
- Workshop access control: facilitators can only access their own workshops
- Session tokens managed securely by Clerk
- No sensitive data in client-side code
- CSRF protection via Clerk's built-in mechanisms

## User Experience

- Sign-in page uses Clerk's pre-built UI components
- Loading states during authentication
- Clear error messages for authentication failures
- Smooth redirect flow after authentication
- User profile display when authenticated

## Future Enhancements

- Role-based access control (if multiple facilitator roles needed)
- Two-factor authentication
- Session activity monitoring
- Account management page
