# Instructions for ChatGPT / Codex and other agents

Project: JARVIS OS. Read `README.md` and `DESIGN.md` first. `CLAUDE.md` holds the same rules for Claude.

## Rules (shared with Claude)
1. **Secrets:** never write, print, or commit API keys, passwords, tokens, calendar links, or personal data. Use `.env.example` with empty values only. Never prefix a secret with `VITE_`.
2. **Design:** 70% Apple minimalism, 30% Iron Man. Use tokens from `src/styles/tokens.css`. No heavy neon, no clutter. Keep 44px touch targets and keyboard focus.
3. **Preserve features:** dashboard, ARC reactor, calendar, missions, language lab, focus timer, chat, and the EN/ES/FR switch. Refine, do not rebuild.
4. **Server only:** all provider calls live in `api/`. The browser calls `/api/chat` only.
5. **Before every PR:** run `npm run build`. It must pass.
6. **Strings:** add every user-facing string to `src/lib/i18n.ts` in all three languages.

## Collaboration workflow
- Branch names: `chatgpt/<topic>` for ChatGPT, `claude/<topic>` for Claude, `human/<topic>` for the owner.
- One topic per branch, small PRs, use the PR template. Put the author tag in the PR title: `[chatgpt]`, `[claude]`, or `[human]`.
- Never push to `main`. The owner (or the other agent as reviewer) approves the merge.
- When reviewing the other agent's PR, check security first (secrets, auth on `/api`), then design rules, then code.
- Pull `main` before starting. If you touch the same file as an open PR, say so in the PR description.
