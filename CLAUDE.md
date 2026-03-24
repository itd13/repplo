@AGENTS.md

# Project: Repplo

Deployed at repplo.com on Vercel.

## Routes
- `/` — minimal placeholder, dark screen with "Repplo" wordmark (`app/page.tsx`)
- `/lab` — core UI: textarea → Generate Replies → 3 reply cards (`app/lab/page.tsx`)

## Stack
- Next.js 16.2.1 (App Router), React 19, TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"`, `@tailwindcss/postcss`)
- Framer Motion v12 for animations
- next-themes v0.4.6 for dark/light/system toggle

## Theme system
- `ThemeProvider` wraps the app in `app/providers.tsx` (client component)
- Toggle lives in `app/layout.tsx`, fixed top-right via `components/ThemeToggle.tsx`
- `app/globals.css` uses `@variant dark (&:where(.dark, .dark *))` for class-based dark mode
- All color classes use explicit `dark:` Tailwind variants — never CSS variable-based color utilities (they don't respond to runtime class changes in Tailwind v4)

## API
- `app/api/generate/route.ts` — POST `{ message: string }` → `{ replies: [string, string, string] }`
- Calls OpenAI `gpt-4o-mini` with `response_format: { type: "json_object" }`
- Key read from `process.env.OPENAI_API_KEY`

## /lab UI details
- Paste button inside textarea (top-right): reads clipboard, hidden if API unsupported
- 20-character minimum before Generate Replies enables; counter shown while below threshold
- 500-character maximum enforced in onChange and Paste handler; counter turns red within 20 chars of limit
- Model rejects non-messages with `{ error: "not_a_message" }` (HTTP 422); UI shows amber inline warning
- Staggered card entrance animation (Framer Motion `AnimatePresence`)
- Copy button per card with scale animation and "Copied!" feedback

## Future Pro Features
- **Character limit upsell** — free tier is capped at 500 characters per input. Pro tier should allow up to 1000 characters. Gate this in `app/api/generate/route.ts` once Stripe auth is in place.
