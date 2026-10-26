import { advisor, clientById, demoDay, FEATURED_MEETING, meetings } from '../data/directory'
import type { Meeting } from '../data/types'
import { fmtLongDay, fmtTime, fmtWeekday, usdC } from '../lib/format'

const dayKey = (iso: string) => iso.slice(0, 10)

function MeetingRow({
  m,
  prepared,
  onPrepare,
  onOpen,
}: {
  m: Meeting
  prepared: boolean
  onPrepare: (m: Meeting) => void
  onOpen: (m: Meeting) => void
}) {
  const c = clientById(m.clientId)
  if (!c) return null
  const featured = m.id === FEATURED_MEETING
  return (
    <li className={'meeting' + (featured ? ' featured' : '')}>
      <div className="m-time">
        <strong>{fmtTime(m.start)}</strong>
        <span className="small muted">{m.durationMin} min</span>
      </div>
      <div className="m-avatar" aria-hidden>
        {c.initials}
      </div>
      <div className="m-main">
        <div className="m-name">
          {c.household}
          {featured && <span className="chip navy">Featured</span>}
        </div>
        <div className="small muted">
          {m.type} · {m.mode} · {c.segment}
        </div>
        {c.flags.length > 0 && (
          <div className="chips">
            {c.flags.map(f => (
              <span key={f} className={'chip ' + (featured ? 'amber' : 'grey')}>
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="m-aum">
        <div className="small muted">Assets</div>
        <strong>{usdC(c.aum)}</strong>
      </div>
      <div className="m-action">
        {prepared ? (
          <>
            <span className="chip green">Brief ready</span>
            <button className="btn" onClick={() => onOpen(m)}>
              Open brief
            </button>
          </>
        ) : (
          <button className={'btn ' + (featured ? 'primary' : 'outline')} onClick={() => onPrepare(m)}>
            Prepare Meeting
          </button>
        )}
      </div>
    </li>
  )
}

export function Dashboard({
  prepared,
  onPrepare,
  onOpen,
}: {
  prepared: Set<string>
  onPrepare: (m: Meeting) => void
  onOpen: (m: Meeting) => void
}) {
  const today = dayKey(
    (() => {
      const d = demoDay()
      const p = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    })(),
  )
  const todays = meetings.filter(m => dayKey(m.start) === today)
  const later = meetings.filter(m => dayKey(m.start) !== today)
  const laterDays = [...new Set(later.map(m => dayKey(m.start)))]
  const todayLabel = fmtLongDay(today)
  const hours = Math.round(meetings.reduce((a, m) => a + m.durationMin, 0) / 6) / 10

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{todayLabel}</div>
          <h1>Good morning, {advisor.name.split(' ')[0]}</h1>
          <p className="muted">
            You have {todays.length} meetings today and {later.length} more this week. Prepare any of them in under ten seconds.
          </p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="kpi-l">Meetings this week</div>
          <div className="kpi-v">{meetings.length}</div>
          <div className="kpi-s">{hours} hours with clients</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Briefs ready</div>
          <div className="kpi-v">{prepared.size}</div>
          <div className="kpi-s">of {meetings.length} meetings</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Assets in meetings</div>
          <div className="kpi-v">{usdC(meetings.reduce((a, m) => a + (clientById(m.clientId)?.aum ?? 0), 0))}</div>
          <div className="kpi-s">across {meetings.length} households</div>
        </div>
        <div className="kpi alert">
          <div className="kpi-l">Needs attention</div>
          <div className="kpi-v">2</div>
          <div className="kpi-s">Shah concentration · Okonkwo trust</div>
        </div>
      </div>

      <section>
        <h2>Today</h2>
        <ul className="meetings">
          {todays.map(m => (
            <MeetingRow key={m.id} m={m} prepared={prepared.has(m.id)} onPrepare={onPrepare} onOpen={onOpen} />
          ))}
        </ul>
      </section>

      {laterDays.map(day => (
        <section key={day}>
          <h2>{fmtWeekday(day)}</h2>
          <ul className="meetings">
            {later
              .filter(m => dayKey(m.start) === day)
              .map(m => (
                <MeetingRow key={m.id} m={m} prepared={prepared.has(m.id)} onPrepare={onPrepare} onOpen={onOpen} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
