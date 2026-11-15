# Instructions for Claude Code

Project: JARVIS OS. Read `README.md` and `DESIGN.md` first. `AGENTS.md` holds the same rules for ChatGPT/Codex. Follow everything in `AGENTS.md`, summarized here:

- Never write or commit secrets or personal data. `.env.example` stays empty.
- Never prefix a secret with `VITE_`. Provider calls only in `api/`.
- 70% Apple minimalism, 30% Iron Man. Use design tokens. Preserve all existing features.
- Branch `claude/<topic>`, small PRs titled `[claude] ...`, never push to `main`.
- Run `npm run build` before every PR.
- Add user-facing strings to `src/lib/i18n.ts` in English, Spanish, and French.

Commands: `npm install`, `npm run build`, `npx vercel dev`.
