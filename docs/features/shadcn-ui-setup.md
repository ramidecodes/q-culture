# Feature Requirement Document: ShadCN UI Component Library Setup

## Feature Name

ShadCN UI Component Library Setup

## Goal

Install and configure ShadCN UI component library with core components to provide a consistent, accessible, and customizable UI foundation for the workshop application.

## User Story

As a developer, I want to use ShadCN UI components, so that I can build a consistent and accessible user interface quickly without starting from scratch.

## Functional Requirements

- Install ShadCN CLI via pnpm
- Initialize ShadCN component library with proper configuration
- Install core components: Button, Card, Form, Input, Select, Textarea, Dialog, Tabs, Badge, Separator, RadioGroup
- Configure `cn()` utility function for conditional class merging
- Set up component theming to work with light/dark mode
- Ensure all components are accessible (ARIA labels, keyboard navigation)
- Configure components to use project's TailwindCSS theme
- Set up component wrapper patterns for consistent usage

## Data Requirements

- No database requirements for this feature

## User Flow

1. Developer runs `pnpm dlx shadcn@latest init` to initialize ShadCN
2. Developer answers configuration prompts (TypeScript, TailwindCSS, App Router, etc.)
3. Developer installs required components: `pnpm dlx shadcn@latest add button card form input select textarea dialog tabs badge separator radio-group`
4. Developer verifies `cn()` utility is available in `lib/utils.ts`
5. Developer tests components render correctly with theme support

## Acceptance Criteria

- ShadCN CLI is installed and functional
- All core components are available in `components/ui/` directory
- Components render correctly with TailwindCSS styling
- `cn()` utility function works for conditional classes
- Components support both light and dark themes
- All components are accessible (keyboard navigation, ARIA labels)
- Components can be imported and used in pages
- Component configuration matches project standards (TypeScript, TailwindCSS, App Router)

## Edge Cases

- Component version conflicts
- TailwindCSS class conflicts with custom styles
- Theme switching affecting component appearance
- Component accessibility issues
- Import path resolution problems
- Customization breaking component functionality

## Non-Functional Requirements

- Component library should add minimal bundle size overhead
- Components should render in under 50ms
- Accessibility should meet WCAG 2.1 AA standards
- Components should be fully customizable via TailwindCSS classes
- TypeScript types should be included for all components

## Technical Implementation Details

### Key Files

- `components/ui/button.tsx` - Button component
- `components/ui/card.tsx` - Card component
- `components/ui/form.tsx` - Form component with react-hook-form integration
- `components/ui/input.tsx` - Input component
- `components/ui/select.tsx` - Select dropdown component
- `components/ui/textarea.tsx` - Textarea component
- `components/ui/dialog.tsx` - Modal dialog component
- `components/ui/tabs.tsx` - Tabs component
- `components/ui/badge.tsx` - Badge component
- `components/ui/separator.tsx` - Separator component
- `components/ui/radio-group.tsx` - Radio group component
- `lib/utils.ts` - Contains `cn()` utility function
- `components.json` - ShadCN configuration file

### Core Components to Install

1. **Button** - Primary action buttons
2. **Card** - Container for content sections
3. **Form** - Form wrapper with validation
4. **Input** - Text input fields
5. **Select** - Dropdown selection
6. **Textarea** - Multi-line text input
7. **Dialog** - Modal dialogs and popovers
8. **Tabs** - Tabbed interface navigation
9. **Badge** - Status indicators and labels
10. **Separator** - Visual divider
11. **RadioGroup** - Radio button groups

### Dependencies

- @radix-ui/react-* (installed automatically with components)
- class-variance-authority
- clsx
- tailwind-merge
- lucide-react (for icons)

### Component Usage Pattern

```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ExampleComponent() {
  return (
    <Card>
      <Button className={cn("w-full", isActive && "bg-primary")}>
        Click me
      </Button>
    </Card>
  );
}
```

### Configuration

The `components.json` file should specify:
- TypeScript mode
- TailwindCSS integration
- App Router support
- Component path: `@/components/ui`
- Utility path: `@/lib/utils`
- Style configuration for light/dark themes

## Customization Guidelines

- Components can be customized via TailwindCSS classes
- Use `cn()` utility for conditional classes
- Follow ShadCN's composition patterns for complex components
- Maintain accessibility standards when customizing
- Test components in both light and dark themes
