/* The number that actually matters everywhere: P(watermark is present).
   The detector returns confidence in its CHOSEN class, so a destroyed
   watermark comes back as "not watermarked, 99%" — that must read as a
   LOW signal, not a high one. */
export function signalOf(result) {
  if (!result) return 0
  const p = result.prediction === 1 ? result.confidence : 1 - result.confidence
  return Math.max(0, Math.min(1, p))
}

/* verdict from the watermark-present probability, matching the
   backend's 0.75 threshold on class confidence */
export function verdictFromSignal(signal) {
  if (signal >= 0.75) return { headline: 'Watermark holding', tone: 'trace', icon: 'check' }
  if (signal <= 0.25) return { headline: 'Watermark lost', tone: 'break', icon: 'minus' }
  return { headline: 'Uncertain', tone: 'caution', icon: 'alert' }
}

/* One source of truth for how a detector result is presented.
   Colour is never the only signal — every verdict has an icon + words. */
export function verdictInfo(result) {
  if (!result) return null
  const { verdict, confidence } = result
  if (verdict === 'Likely watermarked') {
    return { headline: 'Likely watermarked', tone: 'trace', icon: 'check', note: 'A watermark signal is present.' }
  }
  if (verdict === 'Likely not watermarked') {
    return { headline: 'Likely not watermarked', tone: 'mute', icon: 'minus', note: 'No watermark signal found.' }
  }
  return {
    headline: 'Uncertain — inconclusive',
    tone: 'caution',
    icon: 'alert',
    note: `Confidence ${(confidence * 100).toFixed(1)}% is below the ${75}% threshold. Don't treat this as proof.`
  }
}

export function VIcon({ name, className = 'w-4 h-4' }) {
  const p = {
    check: 'M20 6 9 17l-5-5',
    minus: 'M5 12h14',
    alert: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z'
  }[name]
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  )
}
