import type { Client } from '../data/types'
import type { Brief } from './brief'
import { fmtLongDay, num, pct, usd, usdC } from './format'

export function buildFollowUp(client: Client, brief: Brief, meetingStart: string, advisorName: string): string {
  const f = brief.facts
  const [s30, s25] = f.scenarios.length >= 2 ? f.scenarios : [f.scenarios[0], f.scenarios[0]]
  const first = advisorName.split(' ')[0]
  return `Subject: Following up on our meeting, ${fmtLongDay(meetingStart)}

Hi Daniel and Priya,

Thank you for your time today, and congratulations again on the Austin opportunity. Here is a short summary of what we covered and what happens next.

WHAT WE DISCUSSED
- ANVX has grown to ${pct(f.anvx.wNow, 0)} of your investable assets (from ${pct(f.anvx.wPrior, 0)} in July). Our policy limit is ${pct(client.ips.singlePositionLimit, 0)}.
- Your home purchase target is ${usdC(f.home.price)} within about ${f.home.months} months. We estimated roughly ${usd(f.home.cashNeeded)} in cash for the down payment and closing costs. You hold ${usd(f.home.cashHeld)} today.
- Priya, you shared that the recent swings in ANVX have been hard to watch. That is a fair reaction, and it shaped what we looked at.

OPTIONS WE REVIEWED FOR ANVX
- Reduce to ${pct(s30.targetWeight, 0)}: sell about ${num(s30.shares)} shares (${usd(s30.sell)}); estimated gains of ${usd(s30.gain)}.
- Reduce to ${pct(s25.targetWeight, 0)}: sell about ${num(s25.shares)} shares (${usd(s25.sell)}); estimated gains of ${usd(s25.gain)}.
- Gifting some low-cost-basis shares to your donor-advised fund, which avoids the gain on those shares.
These are illustrations for discussion, not a recommendation to trade, and tax figures are estimates. Please confirm with your tax professional.

NEXT STEPS
1. Daniel: confirm with ANVX when your trading window opens and send us any pre-clearance rules.
2. Priya: send the donor-advised fund paperwork if you would like to proceed with a gift.
3. Both: let us know the home budget and the closing date you are targeting once you have a shortlist.
4. ${first}: send a one-page plan comparing the two ANVX options and a home-fund schedule within a week.
5. We will re-take the risk questionnaire together at our next call.

Please reply with anything I missed, or call me if something here does not match what you remember.

Warm regards,
${advisorName}
Halcyon Private Wealth

This is a demonstration with fictional data and is not investment, tax or legal advice.`
}
