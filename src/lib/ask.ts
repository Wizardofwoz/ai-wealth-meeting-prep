import type { Client } from '../data/types'
import type { Brief } from './brief'
import { fmtMedium, fmtShort, num, pct, pts, usd, usdC } from './format'

export interface Answer {
  topic: string
  paragraphs: string[]
  bullets?: string[]
  sources: string[]
  fallback?: boolean
}

interface Topic {
  id: string
  keys: RegExp
  build: (c: Client, b: Brief) => Answer
}

export const SUGGESTED = [
  'Why was ANVX flagged?',
  'Why does the cash increase matter?',
  'How much cash does the home purchase need?',
  'What did the client say about volatility?',
  'What are the tax implications of trimming ANVX?',
  'Why did retirement odds fall?',
]

const topics: Topic[] = [
  {
    id: 'anvx',
    keys: /anvx|concentrat|single.?stock|employer|position|flag/i,
    build: (c, b) => {
      const f = b.facts
      const a = f.anvx
      return {
        topic: 'Why ANVX was flagged',
        paragraphs: [
          `ANVX is ${pct(a.wNow, 0)} of investable assets (${usd(a.value)} of ${usd(f.totalNow)}), up from ${pct(a.wPrior, 0)} at the ${fmtShort(f.lastMeeting)} meeting. That is ${pts(a.wNow - c.ips.singlePositionLimit, 0).replace('+', '')} above the ${pct(c.ips.singlePositionLimit, 0)} limit in the policy statement, and over the ${pct(c.ips.reviewTrigger, 0)} trigger you set on Jul 16 for a staged-trim discussion.`,
          `Two things drove it: the price rose from $${a.priorPrice} to $${a.price} (${pct(f.priceMovePct, 0)}), and the Sep 15 RSU vest added ${num(f.sharesAdded)} shares (${num(a.priorShares ?? 0)} to ${num(a.shares ?? 0)}).`,
          `It matters more than the percentage alone because Daniel also works for ANVX: salary, bonus and ${num(f.unvested)} unvested RSUs depend on the same company. A 30% decline would cost about ${usdC(f.stress30)}, or ${pct(f.stress30Pct, 1)} of the portfolio.`,
        ],
        sources: ['Holdings table (ANVX row)', 'Investment policy (25% limit)', 'Jul 16 meeting note (30% trigger)', 'Transactions, Sep 15 vest'],
      }
    },
  },
  {
    id: 'home',
    keys: /home|house|purchase|down.?payment|\$?2m|austin|mortgage|buy/i,
    build: (c, b) => {
      const f = b.facts
      return {
        topic: 'The home purchase',
        paragraphs: [
          `The goal moved from ${usdC(f.home.priorPrice)} in ${fmtMedium(f.home.priorDate)} to ${usdC(f.home.price)} by ${fmtMedium(f.home.date)}, about ${f.home.months} months out. The change followed Daniel's Sep 23 email about the Austin offer.`,
        ],
        bullets: [
          `Down payment (20%): ${usd(f.home.down)}`,
          `Closing costs (2.5%): ${usd(f.home.closing)}`,
          `Cash needed: ${usd(f.home.cashNeeded)}`,
          `Cash held: ${usd(f.home.cashHeld)}, gap ${usd(f.home.gap)}`,
          `Cash plus short treasuries: ${usd(f.home.liquidSafe)}`,
        ],
        sources: ['Goals, Home purchase', 'Email, Sep 23', 'Holdings table (cash, WSTX)'],
      }
    },
  },
  {
    id: 'cash',
    keys: /cash|liquid|bonus|money market/i,
    build: (c, b) => {
      const f = b.facts
      return {
        topic: 'Why the cash change matters',
        paragraphs: [
          `Cash rose ${usd(f.cashDelta)}, from ${usd(f.cash.prior)} to ${usd(f.cash.value)}. It came from ${usd(f.cashFromBonus)} of net bonus, ${usd(f.cashFromBond)} from selling 4,000 shares of Meridian Core Bond, and ${usd(f.cashFromIncome)} of income, less ${usd(Math.abs(f.cashSpent))} for the Austin trip and relocation consultant.`,
          `It looks like a cushion, but the home purchase needs about ${usd(f.home.cashNeeded)} (20% down plus 2.5% closing on ${usdC(f.home.price)}). Today's cash covers ${pct(f.home.cashHeld / f.home.cashNeeded, 0)} of that, leaving a ${usd(f.home.gap)} gap.`,
        ],
        sources: ['Transactions (Aug 14, Aug 28, Sep 24, Oct 1)', 'Holdings table (cash row)', 'Goals, Home purchase'],
      }
    },
  },
  {
    id: 'vol',
    keys: /volat|worr|concern|nervous|anxious|sleep|comfort|risk tol|lock/i,
    build: (c, b) => {
      const f = b.facts
      const call = c.comms.find(x => x.tags.includes('volatility-concern')) ?? c.comms[0]
      if (!call) return { topic: 'Volatility concern', paragraphs: ['No call notes are on file for this household.'], sources: [] }
      return {
        topic: 'Volatility concern',
        paragraphs: [
          `Call note, ${fmtMedium(call.date)}: ${call.excerpt}`,
          `The ${pct(Math.abs(f.worstDayPct), 1)} drop on ${fmtShort(f.worstDayDate)} was about ${usd(f.worstDayLoss)} on the household's shares. The risk profile was last assessed on ${fmtMedium(c.riskAssessed)} (${c.riskProfile}); the call suggests it may no longer fit.`,
        ],
        sources: ['Call note, Oct 8', 'ANVX price history', 'Client profile (risk assessment)'],
      }
    },
  },
  {
    id: 'tax',
    keys: /tax|gain|basis|lot|trim|sell|sale|gift|donor|daf|charit/i,
    build: (c, b) => {
      const f = b.facts
      const [s30, s25] = f.scenarios
      return {
        topic: 'Tax effect of trimming ANVX',
        paragraphs: [
          `Using highest-cost lots first, ${s30.name.toLowerCase()} means selling about ${num(s30.shares)} shares (${usd(s30.sell)}) and realizing about ${usd(s30.gain)} of gains. ${s25.name} means about ${num(s25.shares)} shares (${usd(s25.sell)}) and about ${usd(s25.gain)} of gains.`,
          `At an illustrative 23.8% federal rate that is roughly ${usd(s30.tax)} and ${usd(s25.tax)}. This is a planning illustration, not tax advice; state tax is not included.`,
          `Lot A (4,800 shares) has a $24.50 basis, so it is the most expensive to sell. Gifting those shares to the donor-advised fund Priya started in April avoids the gain on them. Daniel is an ANVX employee until Dec 18, so any sale needs pre-clearance.`,
        ],
        sources: ['ANVX tax-lot table', 'Compliance note', 'Apr 9 meeting note (DAF)'],
      }
    },
  },
  {
    id: 'retire',
    keys: /retire|probab|monte|plan.?(odds|success)|success/i,
    build: (c, b) => ({
      topic: 'Retirement plan probability',
      paragraphs: [
        `Probability of success for retirement at 60 is ${pct(c.plan.now, 0)}, down from ${pct(c.plan.prior, 0)} (${c.plan.method}). Your comfort level is ${pct(c.plan.threshold, 0)} or more.`,
        `Two inputs changed: the larger, earlier home purchase raises the spending drawn from the portfolio, and the share of assets in a single stock increased the simulated downside.`,
      ],
      sources: ['Goals, Retirement', 'Plan summary'],
    }),
  },
  {
    id: 'college',
    keys: /college|529|anika|school|educat/i,
    build: (c, b) => {
      const g = c.goals.find(x => x.kind === 'education')
      if (!g) return { topic: 'College fund', paragraphs: ['No education goal is on file for this household.'], sources: [] }
      return {
        topic: 'College fund',
        paragraphs: [
          `The 529 holds ${usd(g.funded ?? 0)}, ${pct((g.funded ?? 0) / g.target, 0)} of the ${usd(g.target)} goal with four years to go. At $2,000 a month it projects to about $270K, so it is on track.`,
          `Priya uploaded school cost estimates on Aug 20, and Anika has been accepted to a magnet program in Austin starting next fall.`,
        ],
        sources: ['Goals, College fund', 'Client portal, Aug 20', 'Jul 16 meeting note'],
      }
    },
  },
  {
    id: 'job',
    keys: /job|lumenfield|career|relocat|move|rsu|vest|unvested|employ/i,
    build: (c, b) => {
      const f = b.facts
      return {
        topic: 'The job change',
        paragraphs: [
          `Daniel accepted a Director role at Lumenfield Health in Austin, starting Jan 11, 2027. He leaves ANVX on Dec 18, 2026. About ${num(f.unvested)} unvested RSUs, worth about ${usd(f.forfeit)} at $${f.anvx.price}, are forfeited at separation.`,
          `This is why the ANVX decision now has a deadline: trading windows close options as the date nears, and any new employer equity could rebuild the concentration.`,
        ],
        sources: ['Life event, Sep 22', 'Email, Sep 23', 'Compliance note'],
      }
    },
  },
]

export function answer(question: string, client: Client, brief: Brief): Answer {
  const q = question.trim()
  if (!q) {
    return { topic: 'Ask a question', paragraphs: ['Type a question about this client, or pick one of the suggestions.'], sources: [], fallback: true }
  }
  // Score each topic by how many distinct keywords match; pick the best.
  let best: { t: Topic; score: number } | null = null
  for (const t of topics) {
    const m = q.match(new RegExp(t.keys.source, 'gi'))
    const score = m ? new Set(m.map(s => s.toLowerCase())).size : 0
    if (score > 0 && (!best || score > best.score)) best = { t, score }
  }
  if (best) return best.t.build(client, brief)
  return {
    topic: 'I could not ground that question',
    paragraphs: [
      'I can only answer from the data in this client record, and nothing in it matches that question.',
      'Try asking about ANVX concentration, the cash change, the home purchase, volatility, tax lots, retirement odds, college, or the job change.',
    ],
    sources: [],
    fallback: true,
  }
}
