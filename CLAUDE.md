# Pico Health

## Stack
Next.js 16 (App Router), React 19, Tailwind 4, Supabase (auth + DB), Drizzle ORM, Capacitor (iOS/Android), Stripe billing, Anthropic SDK, Zod validation, Upstash Redis (rate limiting)

## Commands
- `npm run dev` — local dev server (Turbopack)
- `npm run build` — production build
- `npm test` — run vitest
- `npm run lint` — eslint
- `npm run db:push` — push schema to Supabase
- `npm run db:generate` — generate Drizzle migrations

## Deploy
- Production: picohealth.app (Vercel, auto-deploys from main)
- Database: Supabase (hosted)
- Rate limiting: Upstash Redis

## Architecture
- App Router with route groups: `(app)` for authenticated pages, `(auth)` for login/signup
- Tab structure: Chat, Log, Reflect, Insights, Settings
- All API routes use `getSessionFromCookies()` for auth
- Supabase auth with middleware-level `getUser()` verification
- RLS enabled on all 25+ tables

## Design System — "Botanical Clinical"
- Teal (hue 195) + warm neutrals (hue 80)
- Source Sans 3 (body), Fraunces (display headings)
- 14 UI components in `components/ui/`
- Forced light mode (no dark mode yet)
- Zero off-system colors, zero inline styles

## Key Conventions
- API auth: `getSessionFromCookies()` in every route handler
- Validation: Zod schemas for all request bodies
- Database: Drizzle ORM, never raw SQL in route handlers
- Mobile: Capacitor wraps picohealth.app for native builds
- Beta invite code: Filo#2026!

## TODO
- Consider updating login/landing page headline to: "Stop guessing. Start knowing."
