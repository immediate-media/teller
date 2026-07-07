## What we're building

A prototype of "the knowledge routing layer" — a single web app where any employee can ask a question and either get a documented answer or be routed to the right person, with a live signal that asking is safe. Second flagship journey: an Employee Profile where the user corrects the AI's assumptions about their expertise, willingness, gaps, and preferences.

Data is mocked (sample org: employees, Confluence pages, Jira tickets, Slack statuses). The chat itself is a real Lovable AI call so the demo feels live — the model is prompted with the mocked corpus and mocked directory and asked to (a) answer from docs when possible, (b) otherwise propose 1–3 people from the directory with reasoning.

## Screens & user journeys

**1. Ask (home)** — `/`
- Big natural-language input, Raycast-style, with a few example prompts and a "Recent questions" strip.
- Submitting routes to `/answer/:id` with the streamed response.

**2. Answer** — `/answer/:id`
- **Top:** the streamed synthesized answer (markdown) with inline source chips.
- **Sources panel:** Confluence pages and Jira tickets that were "consulted" (mocked cards with title, space/project, last-updated).
- **People who might know:** 1–3 person cards. Each shows avatar, name, role/team, matched expertise tags, a one-line "why suggested" rationale, and a live availability chip (green "open to pings", amber "focused", red "OOO"). Buttons: **Ask [Name]** and **View profile**.
- **Capture stub:** "Save this answer back to Confluence" button → toast confirmation + a subtle "Captured as [Page title]" state. Purely visual.

**3. Person detail** — `/people/:id`
- Same person card expanded: why-suggested breakdown (recent Jira tickets they closed, Confluence pages they authored, topic overlap), current Slack status, working hours, "typical response time." Ask button.

**4. My Profile** — `/profile`
- **Inferred expertise:** cards for each topic the AI thinks the user knows, each with a confidence meter, source evidence ("From 12 Jira tickets in Q3"), and controls: keep / edit / remove.
- **Willingness per topic:** for each kept topic, a 3-state control — Happy to help / Ask sparingly / Not my area.
- **Knowledge gaps:** user-declared list of topics they want to learn (add/remove chips).
- **Preferences:** async vs sync toggle, best hours, "open to onboarding chats" switch.
- Changes persist in localStorage for the demo.

**5. Directory (light)** — `/people`
- Simple browsable grid to make the app feel real; links to profile cards.

Global: left sidebar nav (Ask, Answers, People, My Profile), top bar with the signed-in mocked user.

## Technical approach

**Stack:** existing TanStack Start + Tailwind v4 + shadcn. Lovable Cloud is **not** needed for the MVP prototype — everything is mocked or client-side except the AI call.

**AI:** Lovable AI Gateway via `createServerFn` in `src/lib/ask.functions.ts`.
- Uses `streamText` with `openai/gpt-5.5`.
- System prompt embeds the mocked Confluence/Jira corpus (small JSON) and the mocked employee directory (name, role, expertise, current status).
- Instructed to answer from docs when a match exists, cite source ids, and otherwise return a JSON block naming 1–3 employee ids with reasoning. Client parses that block to render person cards alongside the streamed answer.
- Server route: `src/routes/api/chat.ts` handling `useChat` transport.

**Mock data:** `src/lib/mock/{employees,confluence,jira,questions}.ts`. Realistic engineering-org sample: ~10 people across teams, ~15 Confluence pages, ~10 Jira tickets, ~6 sample questions (some answerable by docs, some only by people).

**Profile state:** `src/lib/profile-store.ts` — a small Zustand or plain-context store, seeded from mock inferred data, persisted to localStorage.

**Routes (file-based):**
- `src/routes/index.tsx` — Ask
- `src/routes/answer.$id.tsx` — Answer + people
- `src/routes/people.tsx` and `src/routes/people.$id.tsx`
- `src/routes/profile.tsx` — My Profile
- `src/routes/api/chat.ts` — AI streaming
- `src/routes/__root.tsx` — updated shell with sidebar layout + real head metadata

## Design direction

Because directions can't be pre-rendered on a fresh app, I'll commit to one strong direction and build it:

- **Palette:** off-white paper background (`oklch(0.985 0.005 90)`), deep ink foreground, a single considered accent — muted teal `oklch(0.62 0.09 195)` — plus semantic status colors for availability (green/amber/red at tuned saturations). No purple. No gradients on white.
- **Type:** Fraunces (display) for headings and hero input, Inter Tight for UI, JJannon-esque numerals via `font-variant-numeric: tabular-nums` for status/times. Loaded via `@fontsource`.
- **Feel:** Linear-crisp structure, Notion-warm density, Raycast-forward input. Cards have subtle 1px borders + soft shadows; availability chip is the loudest color on the page.
- **Motion:** Framer Motion for the answer stream reveal, person-card entry stagger, and profile-topic edit transitions. Restrained, not decorative.

## Cut / roadmap

Explicitly not built: real MCP to Confluence/Jira, real Slack presence, auth, full onboarding flow, "brain tinder" consent swiping, role-based content reformatting. All represented as visible-but-mocked affordances so the story lands.

## Files to add or change

Add: 6 route files, `src/lib/ask.functions.ts`, `src/lib/ai-gateway.server.ts`, `src/lib/mock/*.ts`, `src/lib/profile-store.ts`, `src/components/{Sidebar,AskInput,AnswerView,PersonCard,AvailabilityChip,SourceCard,ProfileTopicCard,WillingnessControl}.tsx`.
Change: `src/routes/__root.tsx` (real metadata + shell layout), `src/styles.css` (tokens + fonts).
Install: `ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`, `zod`, `framer-motion`, `@fontsource/fraunces`, `@fontsource/inter-tight`.

## Success check before finishing

- Ask → streamed answer with source chips renders.
- When the question doesn't match docs, 1–3 person cards appear with availability chips and rationale.
- Profile edits persist across reload.
- No purple, no `Sparkles` icon as brand mark, real head metadata set.
