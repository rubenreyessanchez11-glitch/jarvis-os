# JARVIS OS: Design Direction

A premium personal AI operating system. Not a sci-fi dashboard.

**Balance: 70% Apple minimalism, 30% Iron Man.** When in doubt, remove something.

## Principles
1. **Calm first.** Clean layouts, generous space, one focal point per screen.
2. **Dark is primary.** Midnight Navy background, glass cards, white text.
3. **Futuristic, but restrained.** Cyan accents, one animated reactor, small status pills. No heavy neon, no decorative clutter.
4. **Motion is subtle and optional.** Slow, smooth, and disabled under `prefers-reduced-motion`.
5. **Fast and accessible.** Contrast AA or better, 44px touch targets, keyboard focus rings, labels on every control.
6. **Works on iPhone, iPad, desktop.** Mobile-first. Safe areas respected.

## Color (see `tokens.css`)
| Token | Hex | Use |
|---|---|---|
| Midnight Navy | #07101F | App background |
| Surface Blue | #182844 | Cards (as translucent glass) |
| Arc Cyan | #45D5FF | Primary accent, reactor, focus |
| Reactor Gold | #FFB347 | Highlights, today, warnings |
| White | #FFFFFF | Text |

Cyan for interaction, gold sparingly for emphasis. Never both loud at once.

## Type and shape
- System font stack: SF on Apple devices, Inter elsewhere.
- Large light numerals for time, semibold headings, 16px body.
- Radius 20px for cards, 12px for controls, pills for status.
- 4px spacing scale: 4, 8, 16, 24, 40, 64.

## Signature elements
- **Reactor:** one central ARC reactor, slow rotation (40 to 60s), soft cyan glow.
- **Status pills:** small, quiet (AI provider, sync state).
- **Dock:** floating glass tab bar for navigation.

## AI architecture (security rules)
- Providers: OpenAI, Claude, Gemini. Modes: manual, auto-route, three-model compare.
- Conversation history is shared across providers.
- **API keys live only on the server** (Vercel environment variables). Never in frontend code, never in git, never in chat.
- Frontend calls `/api/*` routes; routes verify the Supabase session first.

## Stack
React + Vite + TypeScript, Supabase (auth, Postgres with row-level security), Vercel (hosting and serverless API), GitHub.

## Component inventory
ReactorCore, GlassCard, StatusPill, Dock, ChatPanel, ModelPicker, CompareView, CalendarCard, LanguageLab, FocusCard, MissionList, LanguageSwitch.

## Preserve
Dashboard, calendar (with sync), language lab, focus mode, missions, three-language UI (EN, ES, FR), voice input.
