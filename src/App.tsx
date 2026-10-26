import { useState } from 'react'
import { BriefView } from './components/Brief'
import { Dashboard } from './components/Dashboard'
import { Prepare } from './components/Prepare'
import { Shell, type Section } from './components/Shell'
import { clientById, directory, meetings } from './data/directory'
import { shah } from './data/shah'
import type { Client, Meeting } from './data/types'
import { fmtMedium, fmtTime, fmtWeekday, usdC } from './lib/format'

type View =
  | { kind: 'list' }
  | { kind: 'prepare'; meetingId: string }
  | { kind: 'brief'; meetingId: string }

// Only the Shah household has a full synthetic record. Others show a profile card.
const fullRecords: Record<string, Client> = { shah }

function ClientsPage({ onPrepare }: { onPrepare: (m: Meeting) => void }) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Book of business</div>
          <h1>Clients</h1>
          <p className="muted">{directory.length} households with meetings this week.</p>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Household</th>
                <th>Segment</th>
                <th className="r">Assets</th>
                <th>Last meeting</th>
                <th>Flags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {directory.map(c => {
                const m = meetings.find(x => x.clientId === c.id)
                return (
                  <tr key={c.id} className={c.id === 'shah' ? 'hl' : ''}>
                    <td>
                      <strong>{c.household}</strong>
                      <div className="small muted">{c.blurb}</div>
                    </td>
                    <td className="small">{c.segment}</td>
                    <td className="r">{usdC(c.aum)}</td>
                    <td className="small">{fmtMedium(c.lastMeeting)}</td>
                    <td>
                      <div className="chips">
                        {c.flags.length === 0 && <span className="muted small">None</span>}
                        {c.flags.map(f => (
                          <span key={f} className={'chip ' + (c.id === 'shah' ? 'amber' : 'grey')}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="r">
                      {m && (
                        <button className="btn outline" onClick={() => onPrepare(m)}>
                          Prepare
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MeetingsPage({ prepared, onPrepare, onOpen }: { prepared: Set<string>; onPrepare: (m: Meeting) => void; onOpen: (m: Meeting) => void }) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">This week</div>
          <h1>Meetings</h1>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Client</th>
                <th>Type</th>
                <th>Mode</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {meetings.map(m => (
                <tr key={m.id} className={m.id === 'm-shah' ? 'hl' : ''}>
                  <td>
                    <strong>{fmtWeekday(m.start)}</strong>
                    <div className="small muted">
                      {fmtTime(m.start)} · {m.durationMin} min
                    </div>
                  </td>
                  <td>{clientById(m.clientId)?.household ?? 'Unknown client'}</td>
                  <td className="small">{m.type}</td>
                  <td className="small">{m.mode}</td>
                  <td className="r">
                    {prepared.has(m.id) ? (
                      <button className="btn" onClick={() => onOpen(m)}>
                        Open brief
                      </button>
                    ) : (
                      <button className="btn outline" onClick={() => onPrepare(m)}>
                        Prepare Meeting
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BriefsPage({ prepared, onOpen, goDash }: { prepared: Set<string>; onOpen: (m: Meeting) => void; goDash: () => void }) {
  const ready = meetings.filter(m => prepared.has(m.id))
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Library</div>
          <h1>Briefs</h1>
        </div>
      </div>
      {ready.length === 0 ? (
        <div className="card empty">
          <p>No briefs yet. Prepare a meeting from the dashboard and the brief will be saved here.</p>
          <button className="btn primary" onClick={goDash}>
            Go to dashboard
          </button>
        </div>
      ) : (
        <ul className="meetings">
          {ready.map(m => (
            <li key={m.id} className="meeting">
              <div className="m-time">
                <strong>{fmtWeekday(m.start)}</strong>
                <span className="small muted">{fmtTime(m.start)}</span>
              </div>
              <div className="m-avatar" aria-hidden>
                {clientById(m.clientId)?.initials ?? '?'}
              </div>
              <div className="m-main">
                <div className="m-name">{clientById(m.clientId)?.household ?? 'Unknown client'}</div>
                <div className="small muted">{m.type}</div>
              </div>
              <div className="m-action">
                <button className="btn" onClick={() => onOpen(m)}>
                  Open brief
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Unavailable({ meeting, onBack }: { meeting: Meeting; onBack: () => void }) {
  const c = clientById(meeting.clientId)
  return (
    <div className="page">
      <button className="link back" onClick={onBack}>
        {'\u2190'} Back
      </button>
      <h1>{c?.household ?? 'Client'}</h1>
      <div className="card empty">
        <p>
          This demo has a full synthetic record for one household only. {c?.household ?? 'This client'} is a profile placeholder. Open the featured Shah meeting to see the complete workflow.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [section, setSection] = useState<Section>('dashboard')
  const [view, setView] = useState<View>({ kind: 'list' })
  const [prepared, setPrepared] = useState<Set<string>>(new Set())

  const meetingOf = (id: string) => meetings.find(m => m.id === id)

  const nav = (s: Section) => {
    setSection(s)
    setView({ kind: 'list' })
    window.scrollTo(0, 0)
  }
  const prepare = (m: Meeting) => {
    if (!fullRecords[m.clientId]) {
      setView({ kind: 'brief', meetingId: m.id })
      return
    }
    setView({ kind: 'prepare', meetingId: m.id })
    window.scrollTo(0, 0)
  }
  const open = (m: Meeting) => {
    setView({ kind: 'brief', meetingId: m.id })
    window.scrollTo(0, 0)
  }
  const goBack = () => {
    setSection('dashboard')
    setView({ kind: 'list' })
    window.scrollTo(0, 0)
  }

  let content
  const sel = view.kind === 'list' ? undefined : meetingOf(view.meetingId)
  const selClient = sel ? fullRecords[sel.clientId] : undefined
  if (view.kind !== 'list' && !sel) {
    content = (
      <div className="page">
        <div className="card empty">
          <p>That meeting could not be found.</p>
          <button className="btn primary" onClick={goBack}>
            Go to dashboard
          </button>
        </div>
      </div>
    )
  } else if (view.kind === 'prepare' && sel && selClient) {
    const m = sel
    const c = selClient
    content = (
      <Prepare
        client={c}
        meetingLabel={`${m.type} · ${fmtWeekday(m.start)}, ${fmtTime(m.start)}`}
        onCancel={() => setView({ kind: 'list' })}
        onDone={() => {
          setPrepared(p => new Set(p).add(m.id))
          setView({ kind: 'brief', meetingId: m.id })
          window.scrollTo(0, 0)
        }}
      />
    )
  } else if (view.kind === 'prepare' || view.kind === 'brief') {
    const m = sel!
    const c = selClient
    content = c ? <BriefView client={c} meeting={m} onBack={goBack} /> : <Unavailable meeting={m} onBack={goBack} />
  } else if (section === 'clients') {
    content = <ClientsPage onPrepare={prepare} />
  } else if (section === 'meetings') {
    content = <MeetingsPage prepared={prepared} onPrepare={prepare} onOpen={open} />
  } else if (section === 'briefs') {
    content = <BriefsPage prepared={prepared} onOpen={open} goDash={goBack} />
  } else {
    content = <Dashboard prepared={prepared} onPrepare={prepare} onOpen={open} />
  }

  return (
    <Shell section={section} onNav={nav} briefCount={prepared.size}>
      {content}
    </Shell>
  )
}
