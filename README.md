# Quantifying Culture

Facilitator-led workshop web application that enables anonymous participants to input their country of origin, computes cultural distances using established frameworks (Lewis, Hall, Hofstede), and generates maximally diverse small groups (3–4 people) for discussion and reflection.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Component Library**: ShadCN UI
- **Package Manager**: pnpm
- **Formatter/Linter**: Biome
- **Database**: Postgres (Neon)
- **ORM**: Drizzle
- **Authentication**: Clerk

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 9+

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration values.

4. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm format` - Format code with Biome
- `pnpm check` - Format and lint code with Biome

## Project Structure

```
/
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/        # React components
│   │   └── ui/           # ShadCN UI components
│   ├── lib/              # Utility functions and helpers
│   │   └── utils.ts
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── docs/                 # Project documentation
```

## Coding Standards

- Always use semicolons
- Always use double quotes for strings
- Use trailing commas (ES5 style)
- Prefer `type` over `interface`
- Never use `any` - use proper types or `unknown`
- Default to Server Components (add `"use client"` only when needed)
- Use `@/` alias for internal imports

Run `pnpm check` before committing to ensure code follows these standards.
