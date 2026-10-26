export const usd = (n: number) =>
  (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US')

export const usdC = (n: number) => {
  const a = Math.abs(n)
  const s = n < 0 ? '-' : ''
  if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (a >= 1e3) return s + '$' + Math.round(a / 1e3) + 'K'
  return s + '$' + Math.round(a)
}

export const signedUsdC = (n: number) => (n >= 0 ? '+' : '-') + usdC(Math.abs(n))

export const pct = (x: number, d = 1) => (x * 100).toFixed(d) + '%'
export const pts = (x: number, d = 1) => (x >= 0 ? '+' : '-') + Math.abs(x * 100).toFixed(d) + ' pts'
export const signedPct = (x: number, d = 0) => (x >= 0 ? '+' : '-') + Math.abs(x * 100).toFixed(d) + '%'

const d = (iso: string) => new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso)

export const fmtShort = (iso: string) =>
  d(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
export const fmtMedium = (iso: string) =>
  d(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
export const fmtWeekday = (iso: string) =>
  d(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
export const fmtLongDay = (iso: string) =>
  d(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
export const fmtTime = (iso: string) =>
  d(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
export const fmtMonthYear = (iso: string) =>
  d(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

export const num = (n: number) => Math.round(n).toLocaleString('en-US')
