# 60-Second Estimate (working name)

Dead-simple estimates for 2–5 person contractor crews. **Value before setup**: a new user sends a
professional estimate within 60 seconds of signing up.

Next.js 15 + TypeScript · Supabase (auth, Postgres, storage) · Claude (voice/text → line items) ·
Twilio + Resend (optional delivery) · PWA, no app store.

## The flow

1. `/login` — business name + cell/email → straight into `/new`. No code, no password (Supabase anonymous sign-in; the device is the account). The contact is only where owner alerts go.
2. `/new` — one screen. Tap the mic and talk the job (or type it) → editable line items → customer + total → **Send it**.
3. `/estimate/[id]` — "Text it / Email it" buttons (opens the owner's own messaging app, pre-filled), copy link, status, signature.
4. `/e/[token]` — what the customer sees. Accept (type or draw signature) or decline. Owner is notified.
5. `/` — list with Sent / Viewed / Accepted / Declined filters (auto-refreshes).
6. `/settings` — logo, address, license #, default terms. All optional, never blocking; the estimate page nudges once after the first send.

## Setup

1. **Supabase**: create a project, run `supabase/schema.sql` in the SQL editor. Turn on **Authentication → Sign In / Providers → Allow anonymous sign-ins**.
2. `cp .env.example .env.local` and fill in the Supabase keys + `ANTHROPIC_API_KEY`.
3. `npm install && npm run dev` — open on your phone via your LAN IP or deploy to Vercel (set the same env vars; set `NEXT_PUBLIC_APP_URL` to the deployed URL).

**Sending without Twilio/Resend**: leave those keys empty and "Send it" marks the estimate sent and opens the
owner's own text/email app with the message ready. Good enough for the first five testers (and the text comes
from the contractor's own number, which customers trust more). Add the keys later for automatic sending and owner notifications.

## Design notes / decisions

- Customers' link is a 32-hex secret token. Customers never read the DB directly; `/e/[token]` and `/api/public/*` use the service role and expose only what the page needs.
- "Viewed" is recorded by a browser `POST` on page load, not on `GET`, so SMS link-preview bots don't flip it.
- Respond is atomic and one-shot (`UPDATE … WHERE status IN ('sent','viewed')`).
- Voice uses the browser's built-in speech recognition (Chrome/Safari) → text → `/api/parse` → Claude with a forced tool call. Unsupported browsers just get the text box (phone keyboard dictation works there too).
- Lump-sum rule in the parse prompt: one dollar amount for a described job = qty 1. It never invents prices (missing = $0, visible to edit).

## Not built yet (on purpose)

Stripe subscriptions/trial, invoices + payment links, license/insurance/permit watchdog, crew schedule,
invoice reminders, rate limiting on `/api/parse`, editing an estimate after it's sent, PDF export.
