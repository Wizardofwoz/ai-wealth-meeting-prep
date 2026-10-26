import { useEffect, useMemo, useRef, useState } from 'react'
import type { Client, Meeting } from '../data/types'
import { answer, SUGGESTED, type Answer } from '../lib/ask'
import { buildBrief, type Brief as BriefT, type Severity } from '../lib/brief'
import { buildFollowUp } from '../lib/followup'
import { fmtLongDay, fmtMedium, fmtShort, fmtTime, num, pct, pts, signedUsdC, usd, usdC } from '../lib/format'
import { advisor } from '../data/directory'

const sevClass: Record<Severity, string> = {
  High: 'red',
  Medium: 'amber',
  Low: 'grey',
  Opportunity: 'green',
}

const RISK_QUESTION: Record<string, string> = {
  'risk-conc': 'Why was ANVX flagged?',
  'risk-home': 'How much cash does the home purchase need?',
  'risk-vol': 'What did the client say about volatility?',
  'risk-comp': 'What are the tax implications of trimming ANVX?',
  'opp-gift': 'What are the tax implications of trimming ANVX?',
  'opp-bonds': 'Why does the cash increase matter?',
}

function Spark({ points }: { points: { date: string; price: number }[] }) {
  if (points.length < 2) return null
  const w = 260
  const h = 64
  const min = Math.min(...points.map(p => p.price))
  const max = Math.max(...points.map(p => p.price))
  const x = (i: number) => (i / (points.length - 1)) * w
  const y = (v: number) => h - 6 - ((v - min) / ((max - min) || 1)) * (h - 12)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(' ')
  const drop = points.findIndex(p => p.date === '2026-10-06')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" role="img" aria-label="ANVX price since July 16">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
      {drop > 0 && <circle cx={x(drop)} cy={y(points[drop].price)} r="4" fill="#b42318" />}
    </svg>
  )
}

function Section({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="card section" id={id}>
      <div className="section-head">
        <h2>{title}</h2>
        {sub && <span className="small muted">{sub}</span>}
      </div>
      {children}
    </section>
  )
}

function Src({ children }: { children: React.ReactNode }) {
  return <span className="src">{children}</span>
}

export function BriefView({
  client,
  meeting,
  onBack,
}: {
  client: Client
  meeting: Meeting
  onBack: () => void
}) {
  const brief: BriefT = useMemo(() => buildBrief(client, meeting.durationMin), [client, meeting.durationMin])
  const f = brief.facts
  const [q, setQ] = useState('')
  const [ans, setAns] = useState<Answer | null>(null)
  const [thinking, setThinking] = useState(false)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({ 'risk-conc': true })

  // Track pending timers so nothing updates state after unmount.
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }
  const askTimer = useRef<number | null>(null)
  useEffect(() => {
    const list = timers.current
    return () => {
      list.forEach(id => window.clearTimeout(id))
      if (askTimer.current != null) window.clearTimeout(askTimer.current)
    }
  }, [])

  const ask = (text: string) => {
    setQ(text)
    setThinking(true)
    setAns(null)
    if (askTimer.current != null) window.clearTimeout(askTimer.current)
    askTimer.current = window.setTimeout(() => {
      askTimer.current = null
      try {
        setAns(answer(text, client, brief))
      } catch {
        setAns({ topic: 'Something went wrong', paragraphs: ['I could not build an answer from the record. Try another question.'], sources: [], fallback: true })
      }
      setThinking(false)
    }, 600)
  }

  const gen = () => {
    setFollowUp(buildFollowUp(client, brief, meeting.start, advisor.name))
    setCopied(false)
    later(() => document.getElementById('sec-followup')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const copy = async () => {
    if (followUp == null) return
    try {
      await navigator.clipboard.writeText(followUp)
    } catch {
      try {
        const t = document.getElementById('followup-text') as HTMLTextAreaElement | null
        t?.select()
        document.execCommand?.('copy')
      } catch {
        /* clipboard unavailable; the text stays selectable in the box */
      }
    }
    setCopied(true)
    later(() => setCopied(false), 2000)
  }

  const scrollTo = (id?: string) => id && document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const anvxHolding = f.anvx
  const firstComm = client.comms[0]
  const pricePoints = client.priceSeries?.points ?? []

  return (
    <div className="page brief">
      <div className="page-head">
        <div>
          <button className="link back" onClick={onBack}>
            {'\u2190'} Back to dashboard
          </button>
          <div className="eyebrow">
            Meeting brief · {fmtLongDay(meeting.start)}, {fmtTime(meeting.start)}
          </div>
          <h1>{client.household}</h1>
          <p className="muted">
            {meeting.type} · {meeting.durationMin} min · {meeting.mode} · Client since {client.since} · Data as of {fmtMedium(f.asOf)}
          </p>
        </div>
        <div className="head-actions">
          <button className="btn primary" onClick={gen}>
            Generate Follow-up
          </button>
        </div>
      </div>

      <div className="summary card">
        <div className="agent-tag">
          <span className="pulse off" aria-hidden /> Prepared by Meeting Prep Agent · 7 sources
        </div>
        <h2 className="summary-h">{brief.headline}</h2>
        <p>{brief.summary}</p>
        {client.compliance && (
          <p className="callout">
            <strong>Compliance:</strong> {client.compliance}
          </p>
        )}
      </div>

      <div className="kpis">
        {brief.kpis.map(k => (
          <div key={k.label} className={'kpi ' + (k.tone ?? '')}>
            <div className="kpi-l">{k.label}</div>
            <div className="kpi-v">{k.value}</div>
            <div className="kpi-s">{k.sub}</div>
          </div>
        ))}
      </div>

      <Section id="sec-changed" title="What changed since last meeting" sub={`${fmtMedium(f.lastMeeting)} \u2192 ${fmtMedium(f.asOf)} · ${f.daysSinceMeeting} days`}>
        <div className="changes">
          {brief.changes.map(c => (
            <article key={c.id} className={'change ' + c.tone}>
              <div className="change-l">{c.label}</div>
              <div className="change-v">
                <span className="from">{c.from}</span>
                <span className="arrow" aria-hidden>
                  {'\u2192'}
                </span>
                <span className="to">{c.to}</span>
              </div>
              <p>{c.why}</p>
              <button className="src linkish" onClick={() => scrollTo(c.source.anchor)}>
                Source: {c.source.label}
              </button>
            </article>
          ))}
        </div>
      </Section>

      <Section id="sec-insights" title="Key client insights">
        <ul className="insights">
          {brief.insights.map(i => (
            <li key={i.title}>
              <div>
                <strong>{i.title}</strong>
                <p>{i.body}</p>
              </div>
              <Src>{i.source.label}</Src>
            </li>
          ))}
        </ul>
        {firstComm && (
          <div className="quote">
            <div className="small muted">
              Call note, {fmtMedium(firstComm.date)} · {firstComm.from}
            </div>
            <p>{firstComm.excerpt}</p>
          </div>
        )}
      </Section>

      <Section id="sec-portfolio" title="Portfolio changes" sub={`Investable assets ${usd(f.totalNow)}`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Holding</th>
                <th>Class</th>
                <th className="r">Value</th>
                <th className="r">Prior</th>
                <th className="r">Change</th>
                <th className="r">Weight</th>
                <th className="r">Prior</th>
                <th className="r">Shift</th>
              </tr>
            </thead>
            <tbody>
              {f.rows.map(r => {
                const shift = r.wNow - r.wPrior
                return (
                  <tr key={r.symbol} className={r.symbol === 'ANVX' ? 'hl' : ''}>
                    <td>
                      <strong>{r.symbol}</strong>
                      <div className="small muted">{r.name}</div>
                    </td>
                    <td className="small">{r.assetClass}</td>
                    <td className="r">{usd(r.value)}</td>
                    <td className="r muted">{usd(r.prior)}</td>
                    <td className={'r ' + (r.delta >= 0 ? 'pos' : 'neg')}>{signedUsdC(r.delta)}</td>
                    <td className="r">{pct(r.wNow)}</td>
                    <td className="r muted">{pct(r.wPrior)}</td>
                    <td className={'r ' + (Math.abs(shift) < 0.005 ? '' : shift > 0 ? 'pos' : 'neg')}>
                      {Math.abs(shift) < 0.0005 ? '\u2013' : pts(shift)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>Total</strong>
                </td>
                <td className="r">
                  <strong>{usd(f.totalNow)}</strong>
                </td>
                <td className="r muted">{usd(f.totalPrior)}</td>
                <td className="r pos">{signedUsdC(f.totalNow - f.totalPrior)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="two">
          <div>
            <h3>ANVX price since July 16</h3>
            <div className="spark-wrap">
              <Spark points={pricePoints} />
              <div className="small muted">
                ${anvxHolding.priorPrice} {'\u2192'} ${anvxHolding.price} ({pct(f.priceMovePct, 0)}) · low-day {pct(f.worstDayPct, 1)} on {fmtShort(f.worstDayDate)}
              </div>
            </div>
            <h3>Transactions since last meeting</h3>
            <ul className="txns">
              {[...client.transactions].reverse().map(t => (
                <li key={t.id}>
                  <span className="small muted">{fmtShort(t.date)}</span>
                  <span>{t.description}</span>
                  <span className={t.cashImpact < 0 ? 'neg' : t.cashImpact > 0 ? 'pos' : 'muted'}>
                    {t.cashImpact === 0 ? `${(t.sharesDelta ?? 0) > 0 ? '+' : ''}${num(t.sharesDelta ?? 0)} sh` : signedUsdC(t.cashImpact)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>ANVX tax lots</h3>
            <div className="table-wrap">
              <table className="compact">
                <thead>
                  <tr>
                    <th>Lot</th>
                    <th className="r">Shares</th>
                    <th className="r">Basis</th>
                    <th className="r">Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {(anvxHolding.lots ?? []).map(l => (
                    <tr key={l.id}>
                      <td>
                        {l.label}
                        <div className="small muted">{fmtMedium(l.acquired)}</div>
                      </td>
                      <td className="r">{num(l.shares)}</td>
                      <td className="r">${l.basis.toFixed(2)}</td>
                      <td className="r pos">{usdC(l.shares * ((anvxHolding.price ?? 0) - l.basis))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Trim scenarios</h3>
            <div className="table-wrap">
              <table className="compact">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th className="r">Sell</th>
                    <th className="r">Est. gain</th>
                    <th className="r">Est. tax</th>
                  </tr>
                </thead>
                <tbody>
                  {f.scenarios.map(s => (
                    <tr key={s.name}>
                      <td>
                        {s.name}
                        <div className="small muted">{num(s.shares)} shares</div>
                      </td>
                      <td className="r">{usdC(s.sell)}</td>
                      <td className="r">{usdC(s.gain)}</td>
                      <td className="r">{usdC(s.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">Highest-cost lots first. Illustrative 23.8% federal rate; not tax advice.</p>
          </div>
        </div>
      </Section>

      <Section id="sec-risks" title="Risks and opportunities" sub="Ranked by severity">
        <ul className="risks">
          {brief.risks.map(r => (
            <li key={r.id} className="risk">
              <button
                className="risk-head"
                aria-expanded={!!open[r.id]}
                onClick={() => setOpen(o => ({ ...o, [r.id]: !o[r.id] }))}
              >
                <span className={'chip ' + sevClass[r.severity]}>{r.severity}</span>
                <span className="risk-title">{r.title}</span>
                <span className="caret" aria-hidden>
                  {open[r.id] ? '\u2212' : '+'}
                </span>
              </button>
              {open[r.id] && (
                <div className="risk-body">
                  <p>{r.detail}</p>
                  <p>
                    <strong>Suggested action:</strong> {r.action}
                  </p>
                  <div className="srcs">
                    {r.sources.map(s => (
                      <Src key={s.label}>{s.label}</Src>
                    ))}
                    <button className="link small" onClick={() => ask(RISK_QUESTION[r.id] ?? 'Why was ANVX flagged?')}>
                      Ask AI about this
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <div className="two-col">
        <Section id="sec-agenda" title="Suggested agenda" sub={`${brief.agenda.reduce((a, i) => a + i.minutes, 0)} min`}>
          <ol className="agenda">
            {brief.agenda.map((a, i) => (
              <li key={a.title}>
                <span className="mins">{a.minutes}m</span>
                <div>
                  <strong>
                    {i + 1}. {a.title}
                  </strong>
                  <p className="small">{a.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="sec-questions" title="Personalized questions" sub={`${brief.questions.length} questions`}>
          <ol className="questions">
            {brief.questions.map(qn => (
              <li key={qn.text}>
                <p>{qn.text}</p>
                <div className="small muted">
                  {qn.why} <Src>{qn.source.label}</Src>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section id="sec-ask" title="Ask AI" sub="Answers cite the client record">
        <form
          className="ask"
          onSubmit={e => {
            e.preventDefault()
            ask(q)
          }}
        >
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="e.g. Why was ANVX flagged?"
            aria-label="Ask a question about this client"
          />
          <button className="btn primary" type="submit" disabled={thinking}>
            Ask
          </button>
        </form>
        <div className="suggest">
          {SUGGESTED.map(s => (
            <button key={s} className="pill" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
        {thinking && <div className="answer muted">Checking the client record{'\u2026'}</div>}
        {ans && (
          <div className={'answer' + (ans.fallback ? ' fb' : '')} aria-live="polite">
            <div className="answer-h">{ans.topic}</div>
            {ans.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {ans.bullets && (
              <ul>
                {ans.bullets.map(b => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {ans.sources.length > 0 && (
              <div className="srcs">
                <span className="small muted">Sources:</span>
                {ans.sources.map(s => (
                  <Src key={s}>{s}</Src>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {followUp != null && (
        <Section id="sec-followup" title="Post-meeting follow-up" sub="Draft for your review. Editable.">
          <textarea
            id="followup-text"
            className="followup"
            value={followUp}
            onChange={e => {
              setFollowUp(e.target.value)
              setCopied(false)
            }}
            rows={22}
            aria-label="Follow-up message"
          />
          <div className="followup-actions">
            <button className="btn primary" onClick={copy}>
              {copied ? 'Copied \u2713' : 'Copy to clipboard'}
            </button>
            <button className="btn outline" onClick={() => setFollowUp(buildFollowUp(client, brief, meeting.start, advisor.name))}>
              Reset draft
            </button>
            <span className="small muted">Review before sending. Not sent anywhere.</span>
          </div>
        </Section>
      )}

      <footer className="foot small muted">
        All clients, holdings, tickers and notes are fictional. This demo does not provide investment, tax or legal advice.
      </footer>
    </div>
  )
}
