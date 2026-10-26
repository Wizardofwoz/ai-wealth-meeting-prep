import type { ReactNode } from 'react'
import { advisor } from '../data/directory'

export type Section = 'dashboard' | 'clients' | 'meetings' | 'briefs'

const NAV: { id: Section; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { id: 'clients', label: 'Clients', icon: 'M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
  { id: 'meetings', label: 'Meetings', icon: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z' },
  { id: 'briefs', label: 'Briefs', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v2H8v-2zm0 4h8v2H8v-2z' },
]

export function Shell({
  section,
  onNav,
  children,
  briefCount,
}: {
  section: Section
  onNav: (s: Section) => void
  children: ReactNode
  briefCount: number
}) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            H
          </span>
          <div>
            <div className="brand-name">{advisor.firm}</div>
            <div className="brand-sub">AI Wealth Meeting Prep</div>
          </div>
        </div>
        <div className="tagline">Your AI walks into every client meeting with you.</div>
        <div className="who">
          <span className="demo-pill">Demo · synthetic data</span>
          <div className="avatar" title={advisor.name}>
            {advisor.initials}
          </div>
        </div>
      </header>
      <div className="body">
        <nav className="nav" aria-label="Main">
          {NAV.map(n => (
            <button
              key={n.id}
              className={'nav-item' + (section === n.id ? ' on' : '')}
              onClick={() => onNav(n.id)}
              aria-current={section === n.id ? 'page' : undefined}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path d={n.icon} fill="currentColor" />
              </svg>
              <span>{n.label}</span>
              {n.id === 'briefs' && briefCount > 0 && <span className="badge">{briefCount}</span>}
            </button>
          ))}
          <div className="nav-foot">
            <div className="small">{advisor.name}</div>
            <div className="small muted">{advisor.title}</div>
          </div>
        </nav>
        <main className="main">{children}</main>
      </div>
    </div>
  )
}
