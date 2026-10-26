import type { Advisor, ClientLite, Meeting } from './types'
import { shah } from './shah'

export const advisor: Advisor = {
  name: 'Elena Marsh',
  title: 'Senior Wealth Advisor, CFP\u00ae',
  initials: 'EM',
  firm: 'Halcyon Private Wealth',
}

const shahAum = shah.holdings.reduce((a, h) => a + h.value, 0)

export const directory: ClientLite[] = [
  {
    id: 'whitfield',
    household: 'Robert & Elaine Whitfield',
    initials: 'RW',
    segment: 'Private Wealth',
    aum: 4_210_000,
    lastMeeting: '2026-07-28',
    blurb: 'Retired. Income and required distributions.',
    flags: ['RMD due Dec 31'],
  },
  {
    id: 'shah',
    household: shah.household,
    initials: shah.initials,
    segment: shah.segment,
    aum: shahAum,
    lastMeeting: shah.lastMeeting,
    blurb: 'Relocating. Buying a $2M home. Concentrated stock.',
    flags: ['ANVX 38%', 'Home purchase in 9 mo'],
  },
  {
    id: 'ortega',
    household: 'Marisol Ortega',
    initials: 'MO',
    segment: 'Business Owner',
    aum: 3_140_000,
    lastMeeting: '2026-06-30',
    blurb: 'Preparing to sell her design studio.',
    flags: ['Letter of intent received'],
  },
  {
    id: 'okonkwo',
    household: 'Okonkwo Family Trust',
    initials: 'OF',
    segment: 'Family Office',
    aum: 11_820_000,
    lastMeeting: '2026-08-12',
    blurb: 'Multi-generation trust and gifting.',
    flags: ['Trust review due'],
  },
  {
    id: 'lindqvist',
    household: 'Greg & Hannah Lindqvist',
    initials: 'GL',
    segment: 'Emerging Wealth',
    aum: 2_380_000,
    lastMeeting: '2026-09-04',
    blurb: 'Annual review. Saving for a second home.',
    flags: [],
  },
]

export const clientById = (id: string) => directory.find(c => c.id === id)

// Demo schedule: anchored to the next business day so it always looks current.
export function demoDay(now = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dow = d.getDay()
  if (dow === 6) d.setDate(d.getDate() + 2)
  if (dow === 0) d.setDate(d.getDate() + 1)
  return d
}

function at(offsetDays: number, h: number, m: number): string {
  const d = demoDay()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(h, m, 0, 0)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(h)}:${p(m)}:00`
}

export const meetings: Meeting[] = [
  { id: 'm-whitfield', clientId: 'whitfield', start: at(0, 9, 30), durationMin: 45, type: 'Retirement income review', mode: 'In person' },
  { id: 'm-shah', clientId: 'shah', start: at(0, 14, 0), durationMin: 60, type: 'Quarterly planning review', mode: 'Video' },
  { id: 'm-ortega', clientId: 'ortega', start: at(1, 10, 30), durationMin: 60, type: 'Business sale planning', mode: 'Video' },
  { id: 'm-okonkwo', clientId: 'okonkwo', start: at(2, 13, 0), durationMin: 90, type: 'Trust and gifting review', mode: 'In person' },
  { id: 'm-lindqvist', clientId: 'lindqvist', start: at(3, 11, 0), durationMin: 45, type: 'Annual portfolio review', mode: 'Video' },
]

export const FEATURED_MEETING = 'm-shah'
