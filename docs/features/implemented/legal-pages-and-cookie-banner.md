# Feature Requirement Document: Legal Pages and Cookie Banner

## Feature Name

Legal Pages and Cookie Banner

## Goal

Implement legal compliance features including Terms of Service and Privacy Policy pages, a reusable footer component with legal links, and a cookie consent banner to ensure compliance with privacy regulations (GDPR, CCPA).

## User Story

As a user, I want to access Terms of Service and Privacy Policy pages, and provide consent for cookie usage, so that I understand how my data is used and can make informed decisions about using the service.

## Functional Requirements

- Reusable Footer component with links to Terms and Privacy pages
- Terms of Service page with comprehensive legal content
- Privacy Policy page with detailed privacy information
- Cookie consent banner that appears on first visit
- Cookie consent stored in localStorage
- Footer accessible from all pages
- Legal pages properly indexed for SEO
- Cookie banner dismissible with Accept/Decline options

## Data Requirements

- No database requirements
- localStorage for cookie consent:
  - Key: `qc-cookie-consent`
  - Value: `"accepted"` or `"declined"` or `null`
- Environment variable:
  - `NEXT_PUBLIC_APP_URL` (for metadata base URL)

## User Flow

1. User visits the website for the first time
2. Cookie banner appears at bottom of page
3. User clicks "Accept" or "Decline"
4. Consent is stored in localStorage
5. Banner does not appear on subsequent visits
6. User can access Terms and Privacy pages via footer links
7. User can navigate to legal pages from any page via footer

## Acceptance Criteria

- Footer component renders correctly on all pages
- Footer contains links to Terms (`/terms`) and Privacy (`/privacy`)
- Terms page displays comprehensive legal content
- Privacy page displays detailed privacy information
- Cookie banner appears on first visit only
- Cookie banner stores consent in localStorage
- Cookie banner does not reappear after consent is given
- All pages are responsive (mobile and desktop)
- Legal pages have proper SEO metadata
- All components follow project coding standards

## Edge Cases

- User clears localStorage (banner should reappear)
- User visits in incognito/private mode (banner should appear)
- localStorage is disabled (banner should still function, but consent won't persist)
- User navigates directly to Terms/Privacy pages (footer should still be present)
- Cookie banner on pages with different layouts (should work consistently)

## Non-Functional Requirements

- Cookie banner should be non-intrusive
- Footer should load quickly and not impact page performance
- Legal pages should be easily readable and well-structured
- Cookie banner should be accessible (keyboard navigation, ARIA labels)
- All text should be clear and legally compliant

## Technical Implementation Details

### Key Files

- `src/components/footer.tsx` - Reusable footer component
- `src/components/cookie-banner.tsx` - Cookie consent banner
- `src/app/terms/page.tsx` - Terms of Service page
- `src/app/privacy/page.tsx` - Privacy Policy page
- `src/app/layout.tsx` - Updated to include CookieBanner
- `src/app/page.tsx` - Updated to use Footer component

### Component Structure

```
Footer Component:
- Copyright notice (dynamic year)
- Navigation links (Terms, Privacy, Features)
- Responsive layout

Cookie Banner Component:
- Client component (uses useState, useEffect)
- Fixed bottom position
- Accept/Decline buttons
- localStorage integration
- Smooth animations

Terms Page:
- Server component
- Metadata for SEO
- Card-based section layout
- Comprehensive legal content

Privacy Page:
- Server component
- Metadata for SEO
- Card-based section layout
- Detailed privacy information
```

### Third-Party Services Mentioned

- Clerk (authentication)
- Neon (database hosting)
- Supabase (if used for storage)

### Content Adaptations

- Replace "RPGen" with "Quantifying Culture"
- Replace "Rami Labs" with "Quantifying Culture"
- Update service description to workshop facilitation platform
- Remove sections not applicable (payments, AI services, image generation if not used)
- Adapt Google OAuth section based on Clerk configuration

## Testing Considerations

- Verify footer links navigate correctly
- Test cookie banner on first visit
- Test cookie banner persistence after consent
- Test cookie banner after clearing localStorage
- Verify responsive design on mobile and desktop
- Check SEO metadata in page source
- Test keyboard navigation for accessibility
- Verify all pages render without errors
