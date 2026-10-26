import { useEffect, useRef, useState } from 'react'
import type { Client } from '../data/types'
import { analyze } from '../lib/analyze'
import { num, pct, usdC } from '../lib/format'

interface Step {
  key: string
  label: string
  detail: (c: Client) => string
  found: (c: Client) => string
  ms: number
}

const STEPS: Step[] = [
  {
    key: 'profile',
    label: 'Client profile',
    detail: () => 'Household, risk profile, investment policy',
    found: c => `${c.members.length} household members · ${c.riskProfile} · 25% single-position limit`,
    ms: 700,
  },
  {
    key: 'holdings',
    label: 'Portfolio holdings',
    detail: () => 'Comparing positions with the July 16 snapshot',
    found: c => {
      const f = analyze(c)
      return `${c.holdings.length} positions · ${usdC(f.totalNow)} · ANVX ${pct(f.anvx.wPrior, 0)} \u2192 ${pct(f.anvx.wNow, 0)}`
    },
    ms: 950,
  },
  {
    key: 'txns',
    label: 'Recent transactions',
    detail: () => 'Tracing cash movement and share activity',
    found: c => {
      const f = analyze(c)
      return `${c.transactions.length} transactions · cash up ${usdC(f.cashDelta)}`
    },
    ms: 850,
  },
  {
    key: 'notes',
    label: 'Prior meeting notes',
    detail: () => 'Decisions, action items, open follow-ups',
    found: c => `${c.notes.length} notes · ${c.notes.flatMap(n => n.actionItems).filter(a => a.status === 'open').length} open action items`,
    ms: 850,
  },
  {
    key: 'comms',
    label: 'Calls and emails',
    detail: () => 'Scanning for concerns and requests',
    found: c => `${c.comms.length} messages · 1 volatility concern (Oct 8 call)`,
    ms: 800,
  },
  {
    key: 'goals',
    label: 'Financial goals',
    detail: () => 'Checking each goal against current funding',
    found: c => {
      const f = analyze(c)
      return `${c.goals.length} goals · home needs ${usdC(f.home.cashNeeded)} in ${f.home.months} months`
    },
    ms: 850,
  },
  {
    key: 'events',
    label: 'Life events',
    detail: () => 'Employment, family, relocation',
    found: c => `${c.events.length} events · job change, Dec 18 separation, ${num(1200)} unvested RSUs`,
    ms: 800,
  },
  {
    key: 'synth',
    label: 'Synthesizing the brief',
    detail: () => 'Ranking changes, risks and agenda items',
    found: () => 'Brief ready',
    ms: 800,
  },
]

export const PREP_TOTAL_MS = STEPS.reduce((a, s) => a + s.ms, 0)

export function Prepare({
  client,
  meetingLabel,
  onDone,
  onCancel,
}: {
  client: Client
  meetingLabel: string
  onDone: () => void
  onCancel: () => void
}) {
  const [done, setDone] = useState(0) // number of completed steps
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (done >= STEPS.length) {
      const t = setTimeout(() => doneRef.current(), 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setDone(d => d + 1), STEPS[done].ms)
    return () => clearTimeout(t)
  }, [done])

  const pctDone = Math.round((done / STEPS.length) * 100)

  return (
    <div className="page prep" role="status" aria-live="polite">
      <div className="page-head">
        <div>
          <div className="eyebrow">Preparing meeting</div>
          <h1>{client.household}</h1>
          <p className="muted">{meetingLabel}</p>
        </div>
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="card prep-card">
        <div className="prep-top">
          <div className="agent">
            <span className={'pulse' + (done >= STEPS.length ? ' off' : '')} aria-hidden />
            <div>
              <strong>Meeting Prep Agent</strong>
              <div className="muted small">
                {done >= STEPS.length ? 'Brief complete' : `Analyzing ${STEPS[done].label.toLowerCase()}\u2026`}
              </div>
            </div>
          </div>
          <div className="prep-pct">{pctDone}%</div>
        </div>
        <div className="bar" aria-hidden>
          <div className="bar-fill" style={{ width: `${pctDone}%` }} />
        </div>

        <ol className="steps">
          {STEPS.map((s, i) => {
            const state = i < done ? 'done' : i === done ? 'active' : 'wait'
            return (
              <li key={s.key} className={'step ' + state}>
                <span className="tick" aria-hidden>
                  {state === 'done' ? '\u2713' : state === 'active' ? <span className="spin" /> : ''}
                </span>
                <div>
                  <div className="step-title">{s.label}</div>
                  <div className="muted small">{state === 'done' ? s.found(client) : s.detail(client)}</div>
                </div>
                <span className="step-state small">
                  {state === 'done' ? 'Complete' : state === 'active' ? 'In progress' : 'Queued'}
                </span>
              </li>
            )
          })}
        </ol>
        <div className="prep-foot small muted">
          Reading synthetic client records only. Nothing leaves this browser.
          <button className="link" onClick={() => setDone(STEPS.length)}>
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
