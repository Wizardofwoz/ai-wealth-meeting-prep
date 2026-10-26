# AI Wealth Meeting Prep

Built by **Sunny** at Walk & Hack, the AI Tinkerers NYC × Twilio build-while-you-walk event in Central Park on October 24, 2026. The app was built by texting a coding agent from the park; this repo is the code that came out, packaged so it runs on your own machine.

"Your AI walks into every client meeting with you." A wealth-advisor demo: a dashboard of upcoming meetings, a Prepare step that plays out an eight-step agent run, a brief (what changed, insights, portfolio, risks, agenda, questions, Ask AI), and an editable follow-up message. UI only, synthetic data, no backend and no keys. One client (the Shahs) has a full record; every number in the brief is derived from that record so the brief, Ask AI and follow-up always agree.

## Run it

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. `pnpm build` writes `dist/`.

## Layout

- `src/components/` Shell, Dashboard, Prepare, Brief, ErrorBoundary.
- `src/data/` the synthetic advisor, clients and meetings (`shah.ts` is the full one).
- `src/lib/analyze.ts` derives every figure; `brief.ts`, `ask.ts`, `followup.ts` build text from it.
- `NOTES.md` the builder's working notes from the event, kept as-is.
