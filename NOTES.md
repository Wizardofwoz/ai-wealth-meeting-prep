# AI Wealth Meeting Prep (hackathon demo)
UI-only, synthetic data, no backend. Pitch: "Your AI walks into every client meeting with you."
Replaced the earlier receptionist app (archived outside repo: /home/sandbox/workspace/receptionist-app-backup.tgz).

## Flow
Dashboard (5 meetings, Shah featured) -> Prepare Meeting (8-step agent progress, ~6.6s, Skip link) -> Brief
(changes, insights, portfolio, risks, agenda, questions, Ask AI) -> Generate Follow-up (editable, copy).
Nav: Dashboard / Clients / Meetings / Briefs. Only Shah has a full record; other clients show a placeholder.

## Code map
- src/data/shah.ts: the one full synthetic client (Daniel & Priya Shah, ticker ANVX). directory.ts: advisor, 5 clients, meetings (dates anchored to next business day).
- src/lib/analyze.ts: derives every number (weights, cash delta, home gap, trim/tax-lot scenarios). brief.ts builds brief text from it.
  ask.ts = keyword-routed canned answers built from the same facts. followup.ts = message template.
- Never hard-code a figure in text; derive it so brief, Ask AI and follow-up agree.
- Story numbers (verified): ANVX 27%->38%, cash +$125K, home $2M/9 mo needs $450K (20% down + 2.5% closing), plan odds 88%->81%.
- Tax figures use an illustrative 23.8% rate and are labeled as not advice.

## Run / check
Vite dev on 0.0.0.0:3000 (sandbox.yaml). `npx tsc --noEmit`, `npx vite build`.
No browser in sandbox: jsdom harness in /tmp/opencode/dom (may be wiped; `npm i jsdom`, bundle with the esbuild in node_modules/.pnpm).

## Hardening (crash-fix pass)
- All `!` lookups on client/meeting/holdings/goals/comms replaced with fallbacks; Brief timers cleared on unmount; ErrorBoundary in main.tsx.
- jsdom has no `document.execCommand`: copy fallback is try/caught. Harness scripts: /tmp/opencode/dom/flow.mjs, unmount.mjs (bundle b.js via esbuild, `--loader:.css=empty`).
- Check: `npx tsc --noEmit && npx vite build`; no http(s) URLs in src: `grep -rn "https\?://" src`.
