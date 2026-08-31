import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import SignalMeter, { toneFor } from '../components/SignalMeter'
import { useWorkspace, base64ToFile } from '../lib/workspace'
import { ATTACKS, ATTACK_BY_KEY, activeAttacks, attackSummary, runAttackChain } from '../lib/attacks'
import { detectWatermark, watermarkImage } from '../api'
import { signalOf, verdictFromSignal, VIcon } from '../lib/verdict.jsx'

const TONE_HEX = {
  signal: 'var(--signal)',
  caution: 'var(--caution)',
  break: 'var(--break)',
  trace: 'var(--trace)'
}
const idleState = () => Object.fromEntries(ATTACKS.map((a) => [a.key, a.idle]))

function Fader({ spec, value, onChange }) {
  const active = Math.abs(value - spec.idle) > 1e-6
  const pct = active ? ((value - spec.min) / (spec.max - spec.min)) * 100 : 0
  return (
    <div
      className="panel-inset p-3.5 transition-all"
      style={{
        borderColor: active ? 'var(--trace)' : undefined,
        borderWidth: active ? '1.5px' : undefined,
        background: active ? 'rgba(153, 183, 245, 0.04)' : undefined,
        boxShadow: active ? '0 2px 10px rgba(153, 183, 245, 0.08)' : undefined
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans font-bold text-[11px] uppercase tracking-wider" style={{ color: active ? 'var(--trace)' : 'var(--filament)' }}>
          {spec.label}
        </span>
        <span className="readout font-mono font-bold text-[11.5px]" style={{ color: active ? 'var(--trace)' : 'var(--mute)' }}>
          {spec.format(value)}
        </span>
      </div>
      <input
        type="range"
        className="fader"
        min={spec.min} max={spec.max} step={spec.step} value={value}
        style={{ '--pct': `${pct}%` }}
        onChange={(e) => onChange(spec.key, parseFloat(e.target.value))}
        aria-label={`${spec.label}: ${spec.format(value)}`}
      />
      <div className="flex items-center justify-between mt-1.5">
        <button
          className="font-sans text-[9px] uppercase tracking-wider font-semibold text-mute hover:text-filament transition-colors"
          style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
          onClick={() => onChange(spec.key, spec.idle)}
        >
          reset
        </button>
        <div className="flex gap-1">
          {spec.presets.map((p) => (
            <button
              key={p.at}
              className="chip font-sans text-[8.5px] uppercase tracking-wider !py-0.5 !px-1.5"
              data-on={Math.abs(value - p.at) < (spec.step || 0.01)}
              onClick={() => onChange(spec.key, p.at)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ThreeUp({ label, originalUrl, cleanUrl, attackedUrl, rendering, tag, psnr }) {
  const cells = [
    { t: 'Original', u: originalUrl, alt: 'Original image before any watermark' },
    { t: psnr ? `Watermarked · ${psnr.toFixed(0)} dB` : 'Watermarked', u: cleanUrl, alt: `${tag} watermarked image, no attack applied` },
    { t: 'Attacked', u: attackedUrl || cleanUrl, alt: 'Watermarked image after the active attacks' }
  ]
  return (
    <div>
      {label && <h4 className="font-display font-semibold text-[13px] tracking-wider uppercase mb-2 text-mute">{label}</h4>}
      <div className="grid grid-cols-3 gap-3">
        {cells.map((c, i) => (
          <figure key={i} className={`frame ${i === 2 && rendering ? 'rendering' : ''}`}>
            <span
              className="frame-label"
              style={{ color: i === 1 ? 'var(--trace)' : i === 2 ? 'var(--caution)' : 'var(--mute)' }}
            >
              {c.t}
            </span>
            <img src={c.u} alt={c.alt} />
          </figure>
        ))}
      </div>
    </div>
  )
}

function TimelineRow({ entry }) {
  const pct = entry.signal * 100
  const tone = toneFor(pct)
  return (
    <div className="flex items-center gap-3 py-2 border-t border-[var(--line)]">
      <span className="readout text-[10px] text-mute w-6 shrink-0">{String(entry.id).padStart(2, '0')}</span>
      <span className="tag w-9 shrink-0" style={{ color: entry.target === 'ae' ? 'var(--trace)' : 'var(--signal)' }}>
        {entry.target}
      </span>
      <span className="text-[11px] text-mute flex-1 truncate" title={entry.label}>{entry.label || 'no attack'}</span>
      <div className="meter-bar w-24 shrink-0" style={{ '--tone': TONE_HEX[tone], height: 6 }}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <span className="readout text-[12px] w-12 text-right shrink-0" style={{ color: TONE_HEX[tone] }}>
        {pct.toFixed(0)}
      </span>
    </div>
  )
}

export default function Attack({ go }) {
  const { source, marks, setMark, timeline, pushTimeline, clearTimeline } = useWorkspace()
  const haveAny = marks.ae || marks.vae

  const [target, setTarget] = useState(marks.ae ? 'ae' : 'vae')
  const [compare, setCompare] = useState(false)
  const [attacks, setAttacks] = useState(idleState)
  const [attackedUrls, setAttackedUrls] = useState({ ae: null, vae: null })
  const [attackedFiles, setAttackedFiles] = useState({ ae: null, vae: null })
  const [rendering, setRendering] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [results, setResults] = useState({ ae: null, vae: null })
  const [stale, setStale] = useState(false)
  const [sampleBusy, setSampleBusy] = useState(false)
  const [err, setErr] = useState(null)
  const debRef = useRef(0)
  const runId = useRef(0)

  const methods = compare ? ['ae', 'vae'].filter((m) => marks[m]) : [target]
  const active = useMemo(() => activeAttacks(attacks), [attacks])
  const summary = useMemo(() => attackSummary(attacks).join('  ·  '), [attacks])

  const renderChain = useCallback(async () => {
    const mine = ++runId.current
    setRendering(true)
    setErr(null)
    try {
      const next = { ...attackedUrls }
      const nextF = { ...attackedFiles }
      for (const m of methods) {
        if (!marks[m]) continue
        const f = await runAttackChain(marks[m].file, attacks)
        if (runId.current !== mine) return
        nextF[m] = f
        next[m] = active.length ? URL.createObjectURL(f) : marks[m].url
      }
      setAttackedUrls(next)
      setAttackedFiles(nextF)
    } catch (e) {
      setErr('An attack step failed to render. The backend may be busy — adjust a control to retry.')
    } finally {
      if (runId.current === mine) setRendering(false)
    }
  }, [attacks, methods.join(','), marks]) // eslint-disable-line

  useEffect(() => {
    if (!haveAny) return
    clearTimeout(debRef.current)
    setStale(true)
    setRendering(true) // lock "Run detection" for the whole debounce + render window
    debRef.current = setTimeout(renderChain, 380)
    return () => clearTimeout(debRef.current)
  }, [attacks, target, compare, renderChain, haveAny])

  const setOne = (key, value) => setAttacks((s) => ({ ...s, [key]: value }))
  const resetAll = () => setAttacks(idleState())

  const runDetection = async () => {
    setDetecting(true)
    setErr(null)
    try {
      for (const m of methods) {
        const f = attackedFiles[m] || marks[m]?.file
        if (!f) continue
        const data = await detectWatermark(f)
        setResults((r) => ({ ...r, [m]: data }))
        pushTimeline({
          label: summary,
          target: m,
          signal: signalOf(data),
          verdict: data.verdict
        })
      }
      setStale(false)
    } catch (e) {
      setErr(e.message || 'The detector did not respond. Check the backend and try again.')
    } finally {
      setDetecting(false)
    }
  }

  const loadSampleWatermarked = async () => {
    setSampleBusy(true)
    setErr(null)
    try {
      const blob = await (await fetch('/samples/sample-portrait.jpg')).blob()
      const f = new File([blob], 'sample-portrait.jpg', { type: 'image/jpeg' })
      for (const m of ['ae', 'vae']) {
        const data = await watermarkImage(f, m)
        setMark(m, {
          url: data.watermarkedImageUrl,
          file: base64ToFile(data.watermarkedImageUrl, `${m}_marked.png`),
          psnr: data.psnr, ssim: data.ssim, bits: data.message
        })
      }
    } catch (e) {
      setErr("Couldn't prepare a sample. Try the Embed section with your own image.")
    } finally {
      setSampleBusy(false)
    }
  }

  if (!haveAny) {
    return (
      <div className="panel p-8 max-w-lg mx-auto">
        <h2 className="text-[1.6rem] mb-2">No watermarked image yet</h2>
        <p className="text-mute text-[14px] mb-6 max-w-sm">
          The attack bench needs a watermarked image to degrade. Make one in Embed, or start from a sample.
        </p>
        <div className="flex gap-2">
          <button className="btn" onClick={() => go('embed')}>Go to Embed</button>
          <button className="btn btn-ghost" onClick={loadSampleWatermarked} disabled={sampleBusy}>
            {sampleBusy ? 'Preparing…' : 'Use a sample'}
          </button>
        </div>
        {err && <p className="text-break text-[13px] mt-4">{err}</p>}
      </div>
    )
  }

  const cleanUrl = (m) => marks[m]?.url
  const origUrl = source?.url || marks.ae?.url || marks.vae?.url

  return (
    <div className="space-y-7">
      {/* header controls */}
      <div className="flex flex-wrap items-center gap-3">
        {!compare && (
          <div className="seg inline-flex p-1 rounded-lg bg-graphite border border-[var(--line)]">
            {['ae', 'vae'].map((m) => (
              <button
                key={m}
                disabled={!marks[m]}
                onClick={() => setTarget(m)}
                className="px-3.5 py-1.5 rounded-md text-[11px] font-medium uppercase disabled:opacity-30"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: target === m ? 'var(--filament)' : 'transparent',
                  color: target === m ? 'var(--graphite)' : 'var(--mute)'
                }}
              >
                {m}
              </button>
            ))}
          </div>
        )}
        <button
          className="chip"
          data-on={compare}
          disabled={!(marks.ae && marks.vae)}
          onClick={() => setCompare((c) => !c)}
          title={!(marks.ae && marks.vae) ? 'Embed both AE and VAE first' : ''}
        >
          <span className="dot" />Compare AE vs VAE
        </button>
        {active.length > 0 && (
          <button className="chip" onClick={resetAll}><span className="dot" />Clear {active.length} attack{active.length > 1 ? 's' : ''}</button>
        )}
        <div className="flex-1" />
        <button className="btn btn-trace btn-lg" onClick={runDetection} disabled={detecting || rendering}>
          {detecting ? 'Measuring…' : 'Run detection'}
        </button>
      </div>

      {err && (
        <div className="panel-inset p-3 max-w-lg">
          <p className="text-[13px] text-break">{err}</p>
        </div>
      )}

      {/* image comparison */}
      <div className="space-y-5 max-w-4xl mx-auto">
        {methods.map((m) => (
          <ThreeUp
            key={m}
            label={compare ? `${m.toUpperCase()} watermark` : null}
            tag={m.toUpperCase()}
            psnr={marks[m]?.psnr}
            originalUrl={origUrl}
            cleanUrl={cleanUrl(m)}
            attackedUrl={attackedUrls[m]}
            rendering={rendering}
          />
        ))}
        <p className="font-sans text-[12px] text-mute">
          {active.length === 0
            ? 'No attack applied — this is the clean watermarked image. Drag a fader to degrade it.'
            : <>Active: <span className="text-filament">{summary}</span>{stale && <span className="text-caution"> · run detection to measure</span>}</>}
        </p>
      </div>

      {/* faders */}
      <div className="mx-auto max-w-4xl">
        <h3 className="font-display font-semibold text-[15px] tracking-wider uppercase mb-3 text-mute">Attack Bench — Stack any combination</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {ATTACKS.map((spec) => (
            <Fader key={spec.key} spec={spec} value={attacks[spec.key]} onChange={setOne} />
          ))}
        </div>
      </div>

      {/* readout + timeline */}
      <div className="grid lg:grid-cols-[auto_minmax(0,1fr)] gap-8 pt-2 items-start max-w-4xl mx-auto">
        <div className="flex gap-6">
          {methods.map((m) => {
            const res = results[m]
            const sig = res ? signalOf(res) : 0
            const v = res ? verdictFromSignal(sig) : null
            return (
              <div key={m} className={`text-center shrink-0 ${stale && res ? 'opacity-50' : ''}`}>
                {compare && <p className="tag mb-1" style={{ color: m === 'ae' ? 'var(--trace)' : 'var(--signal)' }}>{m.toUpperCase()}</p>}
                <SignalMeter
                  variant="dial"
                  size={compare ? 148 : 176}
                  value={sig * 100}
                  label={res ? 'watermark signal' : 'run to measure'}
                />
                {v && (
                  <p className="flex items-center justify-center gap-1.5 mt-1 text-[12px] font-medium" style={{ color: TONE_HEX[v.tone] }}>
                    <VIcon name={v.icon} className="w-3.5 h-3.5" />{v.headline}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-display font-semibold text-[13px] tracking-wider uppercase text-mute">Timeline — {timeline.length} run{timeline.length === 1 ? '' : 's'}</h4>
            {timeline.length > 0 && (
              <button className="font-sans text-[10px] uppercase tracking-wider text-mute hover:text-filament" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={clearTimeline}>clear</button>
            )}
          </div>
          {timeline.length === 0 ? (
            <p className="text-[12px] text-mute py-3">
              Each detection run lands here. Try JPEG at 95, then 88, then 80 — watch the watermark signal fall off a cliff.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto pr-1">
              {timeline.map((e) => <TimelineRow key={`${e.id}-${e.target}`} entry={e} />)}
            </div>
          )}
        </div>
      </div>

      {timeline.length >= 3 && (
        <button className="btn btn-ghost" onClick={() => go('models')}>See the full AE vs VAE comparison & metrics →</button>
      )}
    </div>
  )
}
