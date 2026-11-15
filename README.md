# JARVIS OS

A personal AI operating system: Apple minimalism (70%) with Iron Man atmosphere (30%).
Dashboard, ARC reactor, calendar, missions, language lab, focus timer, and an AI chat that can use Claude, OpenAI, and Gemini.
Read `DESIGN.md` before changing anything visual.

## Run it
```bash
npm ci                          # Node.js 24
cp .env.example .env.local      # then fill in the values (never commit this file)
npm run build                   # type-check and production build
npx vercel dev                  # runs the frontend AND the /api routes locally
```
`npm run dev` starts only the frontend. The AI chat needs the `/api` routes, so use `vercel dev` or a Vercel preview deployment.

## Set up Supabase
1. For a fresh database, run `schema.sql` in SQL Editor. If the original tables already exist, skip that file.
2. Run `supabase/migrations/202611140001_chat_security.sql` once before deploying this API. For a Preview deployment, apply it to the Preview database first.
3. In Authentication, enable Email, invite the intended users, and disable public sign-ups and anonymous sign-ins for this personal workspace. Set Site URL and add the exact local and Vercel Preview URLs you use for magic-link redirects.
4. Set `VITE_SUPABASE_URL` to the project URL and `VITE_SUPABASE_ANON_KEY` to the project's publishable or legacy anon key.

[Supabase email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless) · [Supabase Auth settings](https://supabase.com/docs/guides/auth/general-configuration)

## Publish changes to GitHub
Commit the source, `package-lock.json`, `.env.example`, and the migration on a feature branch in the private repository. Open a pull request against `main` and verify that CI passes. Local environment files are ignored.

[GitHub pull requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request)

## Sign in without requesting an email each time

While signed in, choose **Set password** and save a password with at least 12 characters. Sign in with your email and password on other devices. If you have never set a password, use an existing valid magic link to sign in once. If you forget your password, use **Forgot password?**. Sign-in links and recovery emails still use the project's email provider.

[Supabase password sign-in](https://supabase.com/docs/guides/auth/passwords)

## Deploy on Vercel
1. Connect the private GitHub repository to Vercel. Use the Vite preset and Node.js 24. Deploy the feature branch to Preview first.
2. Add the variables from `.env.example` under Settings > Environment Variables for Preview. Enter each provider's key as a sensitive variable and select compatible text models for the three model variables. Use a separate Supabase project and provider credentials for Preview when available.
3. In Preview, verify magic-link login, missions and events, language quizzes, and chat in manual, automatic and compare modes. Confirm that an unauthenticated JSON chat request returns 401 and that a conversation from a second test account is unavailable to the first.
4. Apply the migration in production, set the production environment variables and redirect URL, and merge after review to trigger the production deployment.

[Vercel with Vite](https://vercel.com/docs/frameworks/frontend/vite) · [Vercel environment variables](https://vercel.com/docs/environment-variables) · [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

## Keys and security
- Provider keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`) are **server only**.
- **Never** give a secret a `VITE_` prefix: Vite ships those to the browser.
- The browser calls `/api/chat`, which verifies the Supabase login before using any provider key. Database operations use the signed-in user's session and Supabase row-level security.
- If a key leaks, delete it in the provider console and create a new one.
- Each account can reserve 60 provider calls per UTC day. Compare uses one call per configured provider. A failed upstream call still counts toward the allowance.
- Set `CLAUDE_MODEL`, `OPENAI_MODEL`, and `GEMINI_MODEL` explicitly. Gemini expects the model ID without the `models/` prefix.
- The chat sends recent messages and JARVIS calendar context to the selected provider. Compare sends the same context to the configured providers. The language lab prefers Claude and uses another configured provider if Claude has no key or model.

[Claude Messages](https://platform.claude.com/docs/en/api/messages) · [OpenAI Chat Completions](https://developers.openai.com/api/reference/go/resources/chat/subresources/completions/methods/create) · [Gemini GenerateContent](https://ai.google.dev/api/generate-content)

## Connect Google Calendar

1. Enable **Google Calendar API** in Google Cloud. In **Google Auth Platform**, configure **Branding**, **Audience**, and **Data Access**. For a personal app in testing, add your Google account as a test user. Add the scope `https://www.googleapis.com/auth/calendar.events.owned`.
2. In **Google Auth Platform → Clients**, create a **Web application** OAuth client. Under **Authorized JavaScript origins**, add the exact JARVIS site origin, for example `https://jarvis-os-ten-self.vercel.app`. For local development, add the exact localhost origin and port you use. The browser flow uses the public client ID.
3. Set `VITE_GOOGLE_CALENDAR_CLIENT_ID` to that client ID in Vercel and redeploy.
4. Sign in to JARVIS and choose **Connect Google Calendar**. JARVIS shows events from the selected account's primary calendar. Use **Add to Google Calendar** when creating a new event. For events you organize, **Edit** updates the title, date or start time and **Remove** prompts before deletion.

Reconnect after a reload or when the Google authorization expires. Times are shown in the browser's time zone. Google events stay in Google Calendar. The chat context uses your JARVIS events from Supabase.

[Google browser authorization](https://developers.google.com/identity/oauth2/web/guides/use-token-model) · [Calendar API scopes](https://developers.google.com/workspace/calendar/api/auth)

## WhatsApp drafts

Use the **WhatsApp** button in the chat or enter a command such as “Mándale un mensaje a Francisco: Te veo a las 3:30 en Puerta Chica.” The first time, enter the international phone number and choose **Save contact in this browser**. Later, repeat the saved name in a command or choose it in the draft. Review the draft, select **Open in WhatsApp**, then send from the contact's conversation. Without a number, choose the contact in WhatsApp. Saved names and phone numbers are scoped to your JARVIS account in this browser. Drafts stay in the current page until you open them in WhatsApp.

[WhatsApp click to chat](https://faq.whatsapp.com/5913398998672934)

## Device batteries

Run `supabase/migrations/202611140002_device_batteries.sql` once in Supabase SQL Editor before deploying. Open **Device batteries** after signing in.

- **Windows.** Open JARVIS in a browser that exposes battery status. Enter a device name and select **Share this device**. JARVIS reports while the page is open. The timestamp is the last report and may be older when the tab is closed or suspended.
- **iPhone.** Sign in to JARVIS on the iPhone, enter a name, select **Connect with a shortcut**, and copy the pairing code before closing the form. In Shortcuts, add a battery level action. Add **Get Contents of URL**, enter the JARVIS site URL ending in `/api/battery`, select **POST** and set the request body to **JSON**. Add `token` as Text and paste the pairing code, then add `level` and insert the battery-level variable. Run it once and check JARVIS for the reading. To update automatically, run the shortcut from a Battery Level or Charger automation.

Keep the pairing code in Shortcuts. Removing a device in JARVIS invalidates its code and stops its browser reporting. JARVIS stores the last reading and when it was reported.

[Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getBattery) · [Shortcuts automation triggers](https://support.apple.com/guide/shortcuts/apde31e9638b/ios)

## Structure
```
api/chat.ts            auth check, routing (auto, manual, compare 3), history
api/_lib/providers.ts  OpenAI, Claude, Gemini adapters
src/components/        ReactorCore, GlassCard, StatusPill, Dock, ChatPanel, CompareView,
                       MissionList, CalendarCard, LanguageLab, FocusCard
src/lib/               i18n (EN/ES/FR), api client, Supabase client, hooks
src/styles/            tokens.css (design tokens), app.css
schema.sql             Supabase tables with row-level security
legacy/jarvis-hud.html the original single-file Artifact, kept as a reference
```

## What changed from the original Artifact
The original ran inside Claude and used built-in Claude chat, account database, and voice. Here, chat goes through `/api/chat` (any of three providers), data lives in Supabase, and voice uses the browser's speech recognition where available (Chromium browsers). Your existing calendar events stay in the old Artifact. Re-add or import them in the new calendar.

## Working with ChatGPT and Claude together
See `AGENTS.md` (for ChatGPT/Codex) and `CLAUDE.md` (for Claude Code). Same rules for both.
