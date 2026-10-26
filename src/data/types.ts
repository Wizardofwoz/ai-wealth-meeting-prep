export type AssetClass =
  | 'Single stock'
  | 'US equity'
  | 'International equity'
  | 'Fixed income'
  | 'Real assets'
  | 'Cash'

export const ASSET_CLASSES: AssetClass[] = [
  'Single stock',
  'US equity',
  'International equity',
  'Fixed income',
  'Real assets',
  'Cash',
]

export type Tag =
  | 'volatility-concern'
  | 'liquidity-need'
  | 'tax-question'
  | 'goal-change'
  | 'family'
  | 'spending'
  | 'deployment'
  | 'career'
  | 'positive'

export interface Lot {
  id: string
  label: string
  shares: number
  basis: number // per share
  acquired: string // ISO date
}

export interface Holding {
  symbol: string
  name: string
  assetClass: AssetClass
  prior: number // market value at last meeting
  value: number // market value now
  shares?: number
  priorShares?: number
  price?: number
  priorPrice?: number
  lots?: Lot[]
}

export interface Txn {
  id: string
  date: string
  kind: 'Sell' | 'Buy' | 'Vest' | 'Payment' | 'Withdrawal' | 'Deposit'
  description: string
  symbol?: string
  cashImpact: number // + adds to cash, - removes from cash
  sharesDelta?: number
  account: string
}

export interface ActionItem {
  text: string
  owner: string
  status: 'done' | 'open'
}

export interface MeetingNote {
  id: string
  date: string
  title: string
  summary: string
  decisions: string[]
  actionItems: ActionItem[]
}

export interface Comm {
  id: string
  date: string
  channel: 'Email' | 'Call' | 'Client portal'
  from: string
  subject: string
  excerpt: string
  tags: Tag[]
}

export interface Goal {
  id: string
  name: string
  kind: 'purchase' | 'retirement' | 'education' | 'other'
  target: number
  priorTarget?: number
  targetDate: string
  funded?: number
  priorTargetDate?: string
  status: 'on-track' | 'watch' | 'at-risk'
  note: string
  purchase?: { downPct: number; closingPct: number }
  annualIncomeNeed?: number
}

export interface LifeEvent {
  id: string
  date: string
  title: string
  detail: string
  tags: Tag[]
}

export interface Client {
  id: string
  household: string
  members: string[]
  initials: string
  occupation: string
  segment: string
  since: number
  riskProfile: string
  interests: string[]
  riskAssessed: string
  ips: { singlePositionLimit: number; reviewTrigger: number; summary: string }
  equityComp?: { symbol: string; unvestedShares: number; separationDate: string; employer: string }
  compliance?: string
  lastMeeting: string
  asOf: string
  holdings: Holding[]
  transactions: Txn[]
  notes: MeetingNote[]
  comms: Comm[]
  goals: Goal[]
  events: LifeEvent[]
  plan: { prior: number; now: number; threshold: number; method: string }
  priceSeries?: { symbol: string; points: { date: string; price: number }[] }
}

export interface Meeting {
  id: string
  clientId: string
  start: string // ISO datetime
  durationMin: number
  type: string
  mode: 'Video' | 'In person'
}

export interface ClientLite {
  id: string
  household: string
  initials: string
  segment: string
  aum: number
  lastMeeting: string
  blurb: string
  flags: string[]
}

export interface Advisor {
  name: string
  title: string
  initials: string
  firm: string
}
