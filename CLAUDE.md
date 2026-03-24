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

## Future Pro Features
- **Character limit upsell**: free tier capped at 500 chars, Pro tier = 1000 chars. Gate in `app/api/generate/route.ts` once Stripe auth is in place.
- **Haptics**: Vibration API on copy and generate (prep in Week 7).
- **Audio feedback**: toggleable chimes via Web Audio API (prep in Week 7).

## Deferred Decisions
- **Analytics**: PostHog vs Supabase logs — defer to Week 9.
- **Translation layer**: DeepL vs LibreTranslate — defer to Week 7.

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
