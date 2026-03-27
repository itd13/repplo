@AGENTS.md

# Project: Repplo

## Tech Stack
- Next.js 16.2.1 (App Router) + Tailwind CSS v4 + TypeScript + Framer Motion v12 + next-themes v0.4.6
- OpenAI GPT-4o-mini via `app/api/generate/route.ts`
- Deployed to repplo.com on Vercel
- GitHub repo: itd13/repplo

## Current Features

**Homepage** (`app/page.tsx`): minimal placeholder with centered Repplo wordmark, theme-aware.

**App at /lab** (`app/lab/page.tsx`):
- Textarea with Paste button (Clipboard API, hidden if unsupported), Generate Replies button, 3 reply cards with staggered Framer Motion reveal
- Copy button on each reply card with scale animation and "Copied!" confirmation
- Input validation: 20-char minimum, 500-char maximum
- Character counter: hidden when empty; green and showing `X/20` below minimum; hidden in valid range; red and showing `X/500` within 20 chars of limit
- Generate button disabled below 20 characters
- Prompt-side input detection: model returns `{ "error": "not_a_message" }` for gibberish/URLs/random text (HTTP 422); friendly amber warning fades in inline, disappears on edit

**Theme toggle**: light/dark/system via next-themes, persisted to localStorage, Framer Motion icon animation, fixed top-right corner.

**Dark mode**: all colors use explicit `dark:` Tailwind variants — never CSS variable utilities (they don't respond to runtime `.dark` class changes in Tailwind v4). `app/globals.css` uses `@variant dark (&:where(.dark, .dark *))`.

**API** (`app/api/generate/route.ts`): POST `{ message: string }` → `{ replies: [string, string, string] }`. Uses `response_format: { type: "json_object" }`. Key from `process.env.OPENAI_API_KEY`.

## Auth & Database (Week 3 — In Progress)
- Supabase project: xqapvjdvbsehhkhmutuv.supabase.co (US East, North Virginia)
- Database tables: `profiles`, `replies`, `usage` — all with RLS enabled
- Magic link auth via `@supabase/ssr`
- `lib/supabase/client.ts` — browser-side Supabase client
- `lib/supabase/server.ts` — server-side Supabase client
- `app/auth/callback/route.ts` — handles magic link redirect; writes session cookies directly onto the redirect `NextResponse` (fix committed, awaiting test)
- `app/login/page.tsx` — magic link login page, dark mode compatible, Framer Motion fade-in
- `proxy.ts` — protects `/lab`, redirects unauthenticated users to `/login`
- Supabase env vars added to Vercel (all environments)
- Supabase URL config: Site URL = `repplo.com`, allowed redirects = `repplo.com/auth/callback` + `localhost:3000/auth/callback`

## Supabase URL Configuration (all 3 required)
- `https://repplo.com/auth/callback`
- `https://www.repplo.com/auth/callback`
- `http://localhost:3000/auth/callback`

Root cause of prior redirect bug: www redirect was stripping the `/auth/callback` path, so Supabase fell back to the Site URL. Fixed by adding `https://www.repplo.com/auth/callback` to allowed redirect URLs. Magic link now correctly redirects to `/lab` after login. ✓

## Future Pro Features
- **Character limit upsell**: free tier capped at 500 chars, Pro tier = 1000 chars. Gate in `app/api/generate/route.ts` once Stripe auth is in place.
- **Haptics**: Vibration API on copy and generate (prep in Week 7).
- **Audio feedback**: toggleable chimes via Web Audio API (prep in Week 7).

## Deferred Decisions
- **Analytics**: PostHog vs Supabase logs — defer to Week 9.
- **Translation layer**: DeepL vs LibreTranslate — defer to Week 7.

## Pre-Launch Checklist
- **Before beta (Week 9)**: configure custom SMTP via Resend to bypass Supabase's 4 emails/hour free tier limit.

## Milestone Notes
- **Week 7–8**: Explore Figma ↔ Claude Code MCP integration for design-to-code loop. Check if production-ready by then.

## Week 7 — Skills Pipeline (install manually, not via Claude Code autonomously)

1. **kylezantos/design-motion-principles** — Framer Motion audit
   Install: `npx add-skill kylezantos/design-motion-principles`
   Usage: "Audit the motion design in this codebase"

2. **nextlevelbuilder/ui-ux-pro-max-skill** — UI/UX quality audit
   Install: manually via steps in skills.sh docs (Trust Hub: Fail — Socket/Snyk pass, safe but uncertified for autonomous use)
   Usage: "Audit the UI/UX of this codebase using the ui-ux-pro-max skill"

Run both in the same polish pass before Week 9 launch prep.

## Week 9 — Skills Pipeline

1. **anthropics/skills frontend-design** — landing page + UI polish
   Install: `npx skills add https://github.com/anthropics/skills --skill frontend-design`
   Security: all 3 audits pass (Trust Hub, Socket, Snyk) — safe to install autonomously
   Usage: use when building repplo.com landing page to avoid generic AI aesthetics
   Goal: distinctive typography, motion, spatial composition, memorable first impression
