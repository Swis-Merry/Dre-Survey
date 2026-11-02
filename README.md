# DRE Homes — Portals Feedback Survey

Anonymous feedback survey for DRE Homes agents and managers about the Portals team. Answers are appended to a Google Sheet.
Styled with the Qurat Ul Ain site theme (ivory / sand / champagne / gold / charcoal, Cormorant Garamond + Manrope).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Motion · Zod · Google Apps Script

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                   # http://localhost:3000
```

Verify: `npm run lint && npm run typecheck && npm run build`.

## How answers reach Google Sheets

Browser → `POST /api/submit` (Zod validation, honeypot, min fill time, per-IP rate limit) → Apps Script web app → new row on the
**Responses** tab. The Apps Script URL and shared secret stay server-side.

| Variable | Description |
| --- | --- |
| `GOOGLE_SCRIPT_URL` | Apps Script web app URL (ends with `/exec`). |
| `SURVEY_SHARED_SECRET` | Long random string; must match the secret in the Apps Script. |

If either is missing the API returns `503` with a friendly message.

### One-time Google Sheet setup

1. Create a Google Sheet → **Extensions › Apps Script**.
2. Replace `Code.gs` with [`apps-script/Code.gs`](apps-script/Code.gs) and set the shared secret (constant or Script Property `SHARED_SECRET`).
3. **Deploy › New deployment › Web app** — *Execute as: Me*, *Who has access: Anyone*. Authorise and copy the `/exec` URL.
4. Set `GOOGLE_SCRIPT_URL` and `SURVEY_SHARED_SECRET` on Vercel and redeploy.

The header row is written automatically on the first submission. Free-text answers starting with `= + - @` are prefixed with `'`
to prevent formula injection.

## Editing questions

All questions live in `src/content/survey.ts` (text, options, Sheet column names, manager-only flag). Adding/removing a question
adds/removes a column for new rows; existing rows are not migrated, so prefer a fresh Sheet tab after structural changes.
