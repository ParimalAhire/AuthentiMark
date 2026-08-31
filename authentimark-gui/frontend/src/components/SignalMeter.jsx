import { useEffect, useRef, useState } from 'react'

export function toneFor(value, explicit) {
  if (explicit) return explicit
  if (value >= 75) return 'trace'
  if (value >= 45) return 'caution'
  return 'break'
}

const TONE_HEX = {
  signal: 'var(--signal)',
  caution: 'var(--caution)',
  break: 'var(--break)',
  trace: 'var(--trace)'
}

/* Animated count-up so the number sweeps with the needle */
function useSweep(target) {
  const [v, setV] = useState(target)
  const raf = useRef(0)
  useEffect(() => {
    cancelAnimationFrame(raf.current)
    const from = v
    const start = performance.now()
    const dur = 780
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const e = 1 - Math.pow(1 - t, 3)
      setV(from + (target - from) * e)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return v
}

export default function SignalMeter({
  value = 0,
  variant = 'bar',
  tone: explicitTone,
  label,
  sub,
  size = 200,
  animate = true
}) {
  const target = Math.max(0, Math.min(100, value))
  const sweptRaw = useSweep(target)
  const swept = animate ? sweptRaw : target
  const tone = toneFor(target, explicitTone)
  const hex = TONE_HEX[tone]

  if (variant === 'dial') {
    const r = size * 0.38
    const c = 2 * Math.PI * r
    const arc = 0.75
    const needleAngle = -135 + 270 * (swept / 100)
    return (
      <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
        <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke="var(--line-2)" strokeWidth={size * 0.05}
              strokeDasharray={`${c * arc} ${c}`} strokeLinecap="round"
            />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={hex} strokeWidth={size * 0.05}
              strokeDasharray={`${c * arc * (swept / 100)} ${c}`} strokeLinecap="round"
              style={{ transition: 'stroke 0.5s ease' }}
            />
          </g>
          {/* tick marks */}
          {[0, 25, 50, 75, 100].map((p) => {
            const a = (-135 + 270 * (p / 100)) * (Math.PI / 180)
            const x1 = size / 2 + Math.cos(a) * (r + size * 0.045)
            const y1 = size / 2 + Math.sin(a) * (r + size * 0.045)
            const x2 = size / 2 + Math.cos(a) * (r + size * 0.09)
            const y2 = size / 2 + Math.sin(a) * (r + size * 0.09)
            return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line-2)" strokeWidth="1" />
          })}
          {/* needle */}
          <line
            x1={size / 2} y1={size / 2}
            x2={size / 2} y2={size / 2 - r * 0.9}
            stroke={hex} strokeWidth="2.5" strokeLinecap="round"
            transform={`rotate(${needleAngle} ${size / 2} ${size / 2})`}
            style={{ transition: 'transform 0.8s cubic-bezier(0.2,0.9,0.25,1)' }}
          />
          <circle cx={size / 2} cy={size / 2} r={size * 0.045} fill="var(--panel)" stroke="var(--line-2)" />
        </svg>
        <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: size * 0.32 }}>
          <div className="readout font-semibold leading-none" style={{ fontSize: size * 0.19, color: hex }}>
            {swept >= 99.95 ? '100' : swept.toFixed(swept >= 10 ? 1 : 2)}
            <span style={{ fontSize: size * 0.09 }}>%</span>
          </div>
        </div>
        {label && <div className="tag mt-1.5 text-center">{label}</div>}
      </div>
    )
  }

  // bar variant
  return (
    <div className="w-full">
      {(label || sub) && (
        <div className="flex items-baseline justify-between mb-1.5">
          {label && <span className="tag">{label}</span>}
          {sub != null && (
            <span className="readout text-[13px] font-medium" style={{ color: hex }}>
              {typeof sub === 'number' ? `${swept.toFixed(1)}%` : sub}
            </span>
          )}
        </div>
      )}
      <div className="meter-bar" style={{ '--tone': hex }}>
        <i style={{ width: `${swept}%` }} />
      </div>
    </div>
  )
}
