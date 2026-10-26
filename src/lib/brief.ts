import type { Client, Comm, Goal, LifeEvent, MeetingNote } from '../data/types'
import { analyze, type Facts } from './analyze'
import { fmtMedium, fmtMonthYear, fmtShort, num, pct, pts, signedUsdC, usdC } from './format'

export type Severity = 'High' | 'Medium' | 'Low' | 'Opportunity'

export interface Source {
  label: string // short citation, e.g. "Holdings table"
  anchor?: string // element id to scroll to
}

export interface Change {
  id: string
  tone: 'alert' | 'watch' | 'info'
  label: string
  from: string
  to: string
  why: string
  source: Source
}

export interface Insight {
  title: string
  body: string
  source: Source
}

export interface RiskItem {
  id: string
  severity: Severity
  title: string
  detail: string
  action: string
  sources: Source[]
}

export interface AgendaItem {
  minutes: number
  title: string
  detail: string
}

export interface Question {
  text: string
  why: string
  source: Source
}

export interface Brief {
  facts: Facts
  headline: string
  summary: string
  changes: Change[]
  insights: Insight[]
  risks: RiskItem[]
  agenda: AgendaItem[]
  questions: Question[]
  kpis: { label: string; value: string; sub: string; tone?: 'alert' | 'watch' | 'ok' }[]
}

const EMPTY_COMM = (client: Client): Comm => ({
  id: 'none',
  date: client.asOf,
  channel: 'Email',
  from: '',
  subject: '',
  excerpt: '',
  tags: [],
})

export function buildBrief(client: Client, durationMin = 60): Brief {
  const f = analyze(client)
  const goalCollege: Goal = client.goals.find(g => g.kind === 'education') ?? {
    id: 'none',
    name: 'Education',
    kind: 'education',
    target: 1,
    targetDate: client.asOf,
    funded: 0,
    status: 'on-track',
    note: '',
  }
  const call: Comm = client.comms.find(c => c.tags.includes('volatility-concern')) ?? client.comms[0] ?? EMPTY_COMM(client)
  const jobMail: Comm = client.comms.find(c => c.tags.includes('career')) ?? client.comms[0] ?? EMPTY_COMM(client)
  const jobEvent: LifeEvent = client.events.find(e => e.tags.includes('career')) ??
    client.events[0] ?? { id: 'none', date: client.asOf, title: '', detail: '', tags: [] }
  const lastNote: MeetingNote = client.notes[0] ?? { id: 'none', date: client.lastMeeting, title: '', summary: '', decisions: [], actionItems: [] }
  const separationDate = client.equityComp?.separationDate ?? client.asOf
  const fixedIncome = f.byClass.find(c => c.cls === 'Fixed income')
  const trim30 = f.scenarios[0]
  const trim25 = f.scenarios[1]

  const kpis: Brief['kpis'] = [
    {
      label: 'Investable assets',
      value: usdC(f.totalNow),
      sub: `${signedUsdC(f.totalNow - f.totalPrior)} since ${fmtShort(f.lastMeeting)}`,
    },
    {
      label: 'ANVX concentration',
      value: pct(f.anvx.wNow, 0),
      sub: `was ${pct(f.anvx.wPrior, 0)} · policy limit ${pct(client.ips.singlePositionLimit, 0)}`,
      tone: 'alert',
    },
    {
      label: 'Cash',
      value: usdC(f.cash.value),
      sub: `${signedUsdC(f.cashDelta)} · ${usdC(Math.abs(f.home.gap))} short of home need`,
      tone: 'watch',
    },
    {
      label: 'Plan probability',
      value: pct(client.plan.now, 0),
      sub: `was ${pct(client.plan.prior, 0)} · target ${pct(client.plan.threshold, 0)}+`,
      tone: 'watch',
    },
  ]

  const changes: Change[] = [
    {
      id: 'chg-anvx',
      tone: 'alert',
      label: 'ANVX concentration',
      from: pct(f.anvx.wPrior, 0),
      to: pct(f.anvx.wNow, 0),
      why: `Price rose ${pct(f.priceMovePct, 0)} ($${f.anvx.priorPrice} to $${f.anvx.price}) and a Sep 15 vest added ${num(f.sharesAdded)} shares. Now ${pts(f.anvx.wNow - client.ips.singlePositionLimit, 0).replace('+', '')} above the policy limit and over the 30% trigger set on Jul 16.`,
      source: { label: 'Holdings table', anchor: 'sec-portfolio' },
    },
    {
      id: 'chg-cash',
      tone: 'watch',
      label: 'Cash balance',
      from: usdC(f.cash.prior),
      to: usdC(f.cash.value),
      why: `Up ${usdC(f.cashDelta)}: ${usdC(f.cashFromBonus)} net bonus, ${usdC(f.cashFromBond)} from a bond sale, ${usdC(f.cashFromIncome)} income, less a ${usdC(Math.abs(f.cashSpent))} relocation trip. Still ${usdC(f.home.gap)} below the cash the home purchase needs.`,
      source: { label: 'Transactions', anchor: 'sec-portfolio' },
    },
    {
      id: 'chg-home',
      tone: 'alert',
      label: 'Home purchase',
      from: `${usdC(f.home.priorPrice)} · ${fmtMonthYear(f.home.priorDate)}`,
      to: `${usdC(f.home.price)} · in ${f.home.months} months`,
      why: `Pulled forward 9 months and raised by ${usdC(f.home.price - f.home.priorPrice)} after the Austin job offer. Needs about ${usdC(f.home.cashNeeded)} for down payment and closing.`,
      source: { label: `Email, ${fmtShort(jobMail.date)}`, anchor: 'sec-insights' },
    },
    {
      id: 'chg-vol',
      tone: 'watch',
      label: 'Volatility concern',
      from: 'Comfortable holding',
      to: 'Asked to "lock some in"',
      why: `Priya raised it on ${fmtShort(call.date)} after ANVX fell ${pct(Math.abs(f.worstDayPct), 1)} in a day (${usdC(f.worstDayLoss)} on this household's shares). Daniel is reluctant to sell.`,
      source: { label: `Call note, ${fmtShort(call.date)}`, anchor: 'sec-insights' },
    },
  ]

  const insights: Insight[] = [
    {
      title: 'The household is not aligned on ANVX',
      body: `Priya wants to reduce risk before the house; Daniel believes in the company and is reluctant to sell. A joint conversation will work better than a recommendation to one of them.`,
      source: { label: `Call note, ${fmtShort(call.date)}` },
    },
    {
      title: 'The job change moves the ANVX decision to a deadline',
      body: `Daniel leaves ANVX on ${fmtMedium(separationDate)}. About ${num(f.unvested)} unvested RSUs (about ${usdC(f.forfeit)} at today\u2019s price) are forfeited, and his ability to trade the stock is governed by employer windows until then.`,
      source: { label: `Life event, ${fmtShort(jobEvent.date)}` },
    },
    {
      title: 'The home purchase is now the binding constraint',
      body: `Target moved from ${usdC(f.home.priorPrice)} in 2028 to ${usdC(f.home.price)} by ${fmtMedium(f.home.date)}. Cash covers ${pct(f.home.cashHeld / f.home.cashNeeded, 0)} of the ${usdC(f.home.cashNeeded)} need; cash plus short treasuries (${usdC(f.home.liquidSafe)}) would cover it with room to spare.`,
      source: { label: 'Goals, Home purchase' },
    },
    {
      title: 'Other goals are intact, but retirement slipped',
      body: `The 529 is ${pct((goalCollege.funded ?? 0) / (goalCollege.target || 1), 0)} funded and on track. Retirement-at-60 probability fell from ${pct(client.plan.prior, 0)} to ${pct(client.plan.now, 0)}, below the ${pct(client.plan.threshold, 0)} comfort level, mostly from the bigger home and concentration risk.`,
      source: { label: 'Goals, Retirement' },
    },
    {
      title: 'Working style',
      body: `Priya handles day-to-day contact and prefers visual summaries. Daniel makes the final call on ANVX. They gave about $25K to charity this year, so gifting appreciated shares may land well.`,
      source: { label: 'Client profile' },
    },
  ]

  const risks: RiskItem[] = [
    {
      id: 'risk-conc',
      severity: 'High',
      title: 'ANVX concentration is 13 points above policy',
      detail: `ANVX is ${usdC(f.anvx.value)}, ${pct(f.anvx.wNow, 0)} of investable assets, and Daniel\u2019s salary and unvested pay are tied to the same company. A 30% drop would cost about ${usdC(f.stress30)} (${pct(f.stress30Pct, 1)} of the portfolio).`,
      action: `Discuss a staged trim. Selling about ${usdC(trim30.sell)} reaches the 30% trigger; about ${usdC(trim25.sell)} reaches the 25% limit.`,
      sources: [{ label: 'Holdings table' }, { label: 'IPS, Jul 16 note' }],
    },
    {
      id: 'risk-home',
      severity: 'High',
      title: 'Home purchase funds come from a volatile source',
      detail: `Cash of ${usdC(f.home.cashHeld)} is ${usdC(f.home.gap)} short of the ${usdC(f.home.cashNeeded)} needed in ${f.home.months} months. The natural source of the gap is ANVX, the asset the clients are worried about.`,
      action: `Ring-fence the home fund in cash or short treasuries and set a funding date.`,
      sources: [{ label: 'Goals, Home purchase' }, { label: 'Holdings table' }],
    },
    {
      id: 'risk-vol',
      severity: 'Medium',
      title: 'Client comfort with risk may have shifted',
      detail: `The risk profile was last assessed on ${fmtMedium(client.riskAssessed)} as moderate growth (7 of 10). Priya\u2019s ${fmtShort(call.date)} call suggests current tolerance is lower.`,
      action: 'Re-run the risk questionnaire with both clients.',
      sources: [{ label: `Call note, ${fmtShort(call.date)}` }],
    },
    {
      id: 'risk-comp',
      severity: 'Medium',
      title: 'Trading window and tax lots',
      detail: `Daniel is an ANVX employee until ${fmtMedium(separationDate)}, so any sale needs pre-clearance. Lot A has a $24.50 basis, so unplanned sales create large gains.`,
      action: `Confirm window status. Select lots by cost basis; a 25% trim realizes about ${usdC(trim25.gain)} of gains (about ${usdC(trim25.tax)} illustrative federal tax).`,
      sources: [{ label: 'Compliance note' }, { label: 'ANVX tax lots' }],
    },
    {
      id: 'opp-gift',
      severity: 'Opportunity',
      title: 'Offset gains with appreciated-share gifting',
      detail: `The clients give about $25K a year and an open donor-advised fund application is waiting. Gifting low-basis ANVX shares avoids the gain on those shares and trims the position.`,
      action: 'Ask Priya whether the DAF paperwork is still on her list.',
      sources: [{ label: 'Apr 9 note' }, { label: 'ANVX tax lots' }],
    },
    {
      id: 'opp-bonds',
      severity: 'Low',
      title: 'Fixed income ran down while ANVX ran up',
      detail: `Core bond holdings were reduced by 4,000 shares on Aug 28. Fixed income is now ${pct(fixedIncome?.wNow ?? 0, 0)} of assets against ${pct(fixedIncome?.wPrior ?? 0, 0)} in July, further from the moderate-growth model.`,
      action: 'Rebalance with the proceeds of any ANVX trim, not by selling more bonds.',
      sources: [{ label: 'Holdings table' }],
    },
  ]

  const agendaBase: AgendaItem[] = [
    { minutes: 5, title: 'Welcome and congratulations', detail: 'Acknowledge the Lumenfield offer and the Austin move. Confirm both clients are here.' },
    { minutes: 10, title: 'What has changed since July', detail: `Walk through the four changes: ANVX at ${pct(f.anvx.wNow, 0)}, cash up ${usdC(f.cashDelta)}, the ${usdC(f.home.price)} home, and Priya\u2019s concern about swings.` },
    { minutes: 15, title: 'Fund the home purchase', detail: `Lock the date and budget, then size the home fund: about ${usdC(f.home.cashNeeded)} against ${usdC(f.home.cashHeld)} held.` },
    { minutes: 15, title: 'ANVX staged-trim options', detail: `Compare trimming to 30% (${usdC(trim30.sell)}) with 25% (${usdC(trim25.sell)}), tax cost, gifting, and the trading-window schedule.` },
    { minutes: 10, title: 'Retirement and risk check', detail: `Plan odds at ${pct(client.plan.now, 0)}. Revisit the risk questionnaire and the 529.` },
    { minutes: 5, title: 'Decisions and next steps', detail: 'Read back what was agreed and who owns each item.' },
  ]
  const total = agendaBase.reduce((a, i) => a + i.minutes, 0)
  const scale = durationMin / total
  const agenda = agendaBase.map(i => ({ ...i, minutes: Math.max(5, Math.round((i.minutes * scale) / 5) * 5) }))

  const questions: Question[] = [
    {
      text: 'When Daniel imagines ANVX falling another 30% right after you close on the house, what would that change for you both?',
      why: `A 30% drop is about ${usdC(f.stress30)}. This tests how real the volatility concern is.`,
      source: { label: `Call note, ${fmtShort(call.date)}` },
    },
    {
      text: 'Priya, you asked whether to "lock some in." What would make you comfortable with the amount: a dollar figure, a percentage, or a date?',
      why: 'Turns a feeling into a number the IPS can use.',
      source: { label: `Call note, ${fmtShort(call.date)}` },
    },
    {
      text: 'Daniel, what would you need to see to feel good about selling some ANVX before you leave on Dec 18?',
      why: 'Respects his conviction while surfacing the deadline.',
      source: { label: `Email, ${fmtShort(jobMail.date)}` },
    },
    {
      text: 'Is $2M your ceiling, or is there room if the right house appears? And how much do you want to put down?',
      why: `The ${usdC(f.home.cashNeeded)} cash need assumes 20% down plus 2.5% closing.`,
      source: { label: 'Goals, Home purchase' },
    },
    {
      text: 'Does the Lumenfield offer include equity, and would you want that stock to be part of the plan?',
      why: 'New employer equity could rebuild the concentration the plan is trying to reduce.',
      source: { label: `Email, ${fmtShort(jobMail.date)}` },
    },
    {
      text: 'You mentioned giving about $25K a year. Have you thought about giving appreciated shares instead of cash?',
      why: 'A gift of low-basis shares avoids the gain and trims the position.',
      source: { label: 'Apr 9 note' },
    },
    {
      text: 'Priya sent the school cost estimates in August. With the move to Austin, should we keep the 529 at $2,000 a month or revisit it?',
      why: `The 529 is ${pct((goalCollege.funded ?? 0) / (goalCollege.target || 1), 0)} funded with four years to go.`,
      source: { label: 'Client portal, Aug 20' },
    },
  ]

  return {
    facts: f,
    headline: `${client.household}: three decisions are now linked`,
    summary: `Since ${fmtMedium(f.lastMeeting)} (${f.daysSinceMeeting} days), ANVX has grown from ${pct(f.anvx.wPrior, 0)} to ${pct(f.anvx.wNow, 0)} of investable assets, above the ${pct(client.ips.singlePositionLimit, 0)} policy limit. At the same time the clients plan to buy a ${usdC(f.home.price)} home in ${f.home.months} months, and Priya has asked to reduce the swings. The ANVX decision, the home fund, and Daniel\u2019s Dec 18 departure all need to be settled together. ${lastNote.decisions?.[1] ? 'The Jul 16 staged-trim trigger has been hit.' : ''}`,
    changes,
    insights,
    risks,
    agenda,
    questions,
    kpis,
  }
}
