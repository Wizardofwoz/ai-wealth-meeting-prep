import type { AssetClass, Client, Goal, Holding } from '../data/types'
import { ASSET_CLASSES } from '../data/types'

// Every number the brief shows is derived here from the client record, so
// the brief, the Ask AI answers and the follow-up message always agree.

const ILLUSTRATIVE_TAX_RATE = 0.238 // federal long-term gains + NIIT, illustration only

export interface HoldingRow extends Holding {
  wPrior: number
  wNow: number
  delta: number
}

export interface LotSale {
  lotId: string
  label: string
  shares: number
  proceeds: number
  gain: number
  longTerm: boolean
}

export interface TrimScenario {
  name: string
  targetWeight: number
  sell: number
  shares: number
  lots: LotSale[]
  gain: number
  tax: number
  weightAfter: number
}

export interface Facts {
  asOf: string
  lastMeeting: string
  totalPrior: number
  totalNow: number
  rows: HoldingRow[]
  anvx: HoldingRow
  cash: HoldingRow
  cashDelta: number
  cashFromBonus: number
  cashFromBond: number
  cashSpent: number
  cashFromIncome: number
  priceMovePct: number
  worstDayPct: number
  worstDayDate: string
  worstDayLoss: number
  sharesAdded: number
  excessOverLimit: number
  excessOverTrigger: number
  stress30: number
  stress30Pct: number
  home: {
    price: number
    priorPrice: number
    months: number
    date: string
    priorDate: string
    down: number
    closing: number
    cashNeeded: number
    cashHeld: number
    gap: number
    liquidSafe: number
  }
  byClass: { cls: AssetClass; prior: number; now: number; wPrior: number; wNow: number }[]
  scenarios: TrimScenario[]
  forfeit: number
  unvested: number
  planDrop: number
  daysSinceMeeting: number
}

const EMPTY_HOLDING = (symbol: string, assetClass: AssetClass): Holding => ({
  symbol,
  name: symbol,
  assetClass,
  prior: 0,
  value: 0,
  shares: 0,
  priorShares: 0,
  price: 0,
  priorPrice: 0,
  lots: [],
})

const safeDiv = (a: number, b: number) => (b ? a / b : 0)

export const monthsBetween = (fromIso: string, toIso: string) => {
  const a = new Date(fromIso + 'T12:00:00')
  const b = new Date(toIso + 'T12:00:00')
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
}

export function planTrim(client: Client, targetWeight: number, name: string): TrimScenario {
  const total = client.holdings.reduce((a, h) => a + h.value, 0)
  const a = client.holdings.find(h => h.symbol === 'ANVX') ?? EMPTY_HOLDING('ANVX', 'Single stock')
  const price = a.price || 1
  // Selling proceeds stay in the portfolio (as cash), so total is unchanged.
  const sell = Math.max(0, a.value - targetWeight * total)
  let remaining = Math.ceil(sell / price)
  const lots: LotSale[] = []
  // Highest cost basis first minimizes the realized gain.
  const ordered = [...(a.lots ?? [])].sort((x, y) => y.basis - x.basis)
  for (const lot of ordered) {
    if (remaining <= 0) break
    const take = Math.min(lot.shares, remaining)
    const proceeds = take * price
    const gain = take * (price - lot.basis)
    const held = (new Date(client.asOf).getTime() - new Date(lot.acquired).getTime()) / 86_400_000
    lots.push({ lotId: lot.id, label: lot.label, shares: take, proceeds, gain, longTerm: held > 365 })
    remaining -= take
  }
  const shares = lots.reduce((s, l) => s + l.shares, 0)
  const gain = lots.reduce((s, l) => s + l.gain, 0)
  return {
    name,
    targetWeight,
    sell: shares * price,
    shares,
    lots,
    gain,
    tax: Math.max(0, gain) * ILLUSTRATIVE_TAX_RATE,
    weightAfter: safeDiv(a.value - shares * price, total),
  }
}

export function analyze(client: Client): Facts {
  const totalPrior = client.holdings.reduce((a, h) => a + h.prior, 0)
  const totalNow = client.holdings.reduce((a, h) => a + h.value, 0)
  const rows: HoldingRow[] = client.holdings.map(h => ({
    ...h,
    wPrior: safeDiv(h.prior, totalPrior),
    wNow: safeDiv(h.value, totalNow),
    delta: h.value - h.prior,
  }))
  const toRow = (h: Holding): HoldingRow => ({ ...h, wPrior: 0, wNow: 0, delta: 0 })
  const anvx = rows.find(r => r.symbol === 'ANVX') ?? toRow(EMPTY_HOLDING('ANVX', 'Single stock'))
  const cash = rows.find(r => r.symbol === 'CASH') ?? toRow(EMPTY_HOLDING('CASH', 'Cash'))

  const txn = (id: string) => client.transactions.find(t => t.id === id)?.cashImpact ?? 0
  const cashFromBonus = txn('tx-bonus')
  const cashFromBond = txn('tx-bond')
  const cashFromIncome = txn('tx-div')
  const cashSpent = txn('tx-trip')

  const pts = client.priceSeries?.points ?? []
  let worst = { pct: 0, date: '' }
  for (let i = 1; i < pts.length; i++) {
    if (!pts[i - 1].price) continue
    const p = pts[i].price / pts[i - 1].price - 1
    if (p < worst.pct) worst = { pct: p, date: pts[i].date }
  }
  const prevOfWorst = pts[pts.findIndex(p => p.date === worst.date) - 1]
  const worstLoss = prevOfWorst ? (prevOfWorst.price - (pts.find(p => p.date === worst.date)?.price ?? 0)) * (anvx.shares ?? 0) : 0

  const home: Goal = client.goals.find(g => g.kind === 'purchase') ?? {
    id: 'none',
    name: 'Home purchase',
    kind: 'purchase',
    target: 0,
    targetDate: client.asOf,
    status: 'watch',
    note: '',
  }
  const down = home.target * (home.purchase?.downPct ?? 0.2)
  const closing = home.target * (home.purchase?.closingPct ?? 0.025)
  const cashNeeded = down + closing

  const byClass = ASSET_CLASSES.map(cls => {
    const hs = rows.filter(r => r.assetClass === cls)
    const prior = hs.reduce((a, h) => a + h.prior, 0)
    const now = hs.reduce((a, h) => a + h.value, 0)
    return { cls, prior, now, wPrior: safeDiv(prior, totalPrior), wNow: safeDiv(now, totalNow) }
  })

  const unvested = client.equityComp?.unvestedShares ?? 0

  return {
    asOf: client.asOf,
    lastMeeting: client.lastMeeting,
    totalPrior,
    totalNow,
    rows,
    anvx,
    cash,
    cashDelta: cash.value - cash.prior,
    cashFromBonus,
    cashFromBond,
    cashSpent,
    cashFromIncome,
    priceMovePct: anvx.priorPrice ? (anvx.price ?? 0) / anvx.priorPrice - 1 : 0,
    worstDayPct: worst.pct,
    worstDayDate: worst.date,
    worstDayLoss: worstLoss,
    sharesAdded: (anvx.shares ?? 0) - (anvx.priorShares ?? 0),
    excessOverLimit: anvx.value - client.ips.singlePositionLimit * totalNow,
    excessOverTrigger: anvx.value - client.ips.reviewTrigger * totalNow,
    stress30: anvx.value * 0.3,
    stress30Pct: safeDiv(anvx.value * 0.3, totalNow),
    home: {
      price: home.target,
      priorPrice: home.priorTarget ?? home.target,
      months: Math.round(monthsBetween(client.asOf, home.targetDate)),
      date: home.targetDate,
      priorDate: home.priorTargetDate ?? home.targetDate,
      down,
      closing,
      cashNeeded,
      cashHeld: cash.value,
      gap: cashNeeded - cash.value,
      liquidSafe: cash.value + (rows.find(r => r.symbol === 'WSTX')?.value ?? 0),
    },
    byClass,
    scenarios: [
      planTrim(client, client.ips.reviewTrigger, 'Back to the 30% trigger'),
      planTrim(client, client.ips.singlePositionLimit, 'Back to the 25% policy limit'),
    ],
    forfeit: unvested * (anvx.price ?? 0),
    unvested,
    planDrop: client.plan.prior - client.plan.now,
    daysSinceMeeting: Math.round(
      (new Date(client.asOf).getTime() - new Date(client.lastMeeting).getTime()) / 86_400_000,
    ),
  }
}
