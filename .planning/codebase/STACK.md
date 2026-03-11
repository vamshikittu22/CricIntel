# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.8.3 - All frontend code
- SQL (PostgreSQL) - Database schema via Supabase migrations

**Secondary:**
- JavaScript - Build tooling (Vite config)

## Runtime

**Environment:**
- Browser (SPA) - React 18.3.1
- Node.js - Development server, build, scripts

**Package Manager:**
- npm (via bun.lock / package-lock.json)
- Note: Project appears to use bun but has npm scripts

## Frameworks

**Core:**
- React 18.3.1 - UI framework
- Vite 5.4.19 - Build tool and dev server
- React Router DOM 6.30.1 - Client-side routing

**Styling:**
- Tailwind CSS 3.4.17 - Utility-first CSS
- tailwindcss-animate 1.0.7 - Animation utilities
- @tailwindcss/typography 0.5.16 - Prose styling

**UI Components:**
- shadcn/ui pattern with Radix UI primitives
- 40+ @radix-ui/react-* packages for accessible components

**Data Fetching:**
- @tanstack/react-query 5.83.0 - Server state management

**Charts:**
- recharts 2.15.4 - Charting library

**Animations:**
- framer-motion 12.35.1 - Motion library for React

**Forms:**
- react-hook-form 7.61.1 - Form state management
- @hookform/resolvers 3.10.0 - Zod integration
- zod 3.25.76 - Schema validation

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.98.0 - Supabase client
- react 18.3.1 - UI framework
- react-dom 18.3.1 - React DOM

**Infrastructure:**
- lucide-react 0.462.0 - Icons
- date-fns 3.6.0 - Date utilities
- clsx 2.1.1 - ClassName utility
- tailwind-merge 2.6.0 - Tailwind merge utility
- class-variance-authority 0.7.1 - CVA for component variants
- next-themes 0.3.0 - Theme provider

## Testing

**Framework:**
- vitest 3.2.4 - Test runner
- @testing-library/react 16.0.0 - React testing
- @testing-library/jest-dom 6.6.0 - Jest DOM matchers
- jsdom 20.0.3 - DOM environment

**Configuration:**
- `vitest.config.ts` - Test configuration

## Configuration

**Build:**
- `vite.config.ts` - Vite configuration with path aliases (@ -> ./src)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript config
- `tailwind.config.ts` - Tailwind with custom colors, animations
- `postcss.config.js` - PostCSS for Tailwind
- `eslint.config.js` - ESLint configuration
- `components.json` - shadcn/ui configuration

**Environment:**
- `.env` file (exists - contains Supabase credentials)
- VITE_SUPABASE_URL - Supabase project URL
- VITE_SUPABASE_PUBLISHABLE_KEY - Supabase anon key

## Platform Requirements

**Development:**
- Node.js 18+
- npm or bun
- Supabase project (cloud)

**Production:**
- Any static file host (Vite builds to dist/)
- Supabase backend (cloud)

---

*Stack analysis: 2026-03-10*
