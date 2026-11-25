import { useState, useMemo } from 'react'
import { useWorkspace } from '../lib/workspace'
import { runAttackChain, ATTACK_BY_KEY } from '../lib/attacks'
import { detectWatermark } from '../api'
import { toneFor } from '../components/SignalMeter'
import { signalOf } from '../lib/verdict.jsx'

const TONE_HEX = { signal: '#4ADE80', caution: '#FBBF24', break: '#FB5D5D' }

const MODEL_CONFIG = {
  ae: { id: 'ae', label: 'Autoencoder (AE)', short: 'AE', color: '#5B8DEF' },
  vae: { id: 'vae', label: 'Variational AE (VAE)', short: 'VAE', color: '#4ADE80' },
  gan: { id: 'gan', label: 'GAN (Adversarial)', short: 'GAN', color: '#F43F5E' }
}

const SUITE = [
  { id: 'jpeg95', label: 'JPEG 95', state: { jpeg: 95 } },
  { id: 'jpeg85', label: 'JPEG 85', state: { jpeg: 85 } },
  { id: 'crop45', label: 'Crop 45%', state: { crop: 0.45 } },
  { id: 'rot30', label: 'Rotate 30°', state: { rotate: 30 } },
  { id: 'shot', label: 'Screenshot', state: { screenshot: 0.6 } }
]

const idle = () => Object.fromEntries(Object.keys(ATTACK_BY_KEY).map((k) => [k, ATTACK_BY_KEY[k].idle]))

function MultiGroupBars({ rows, activeModels }) {
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label} className="border-b border-[var(--line)] pb-3 last:border-b-0">
          <div className="flex flex-wrap items-baseline justify-between mb-1.5 gap-2">
            <span className="tag font-semibold text-[11px] text-[var(--filament)]">{r.label}</span>
            <div className="flex flex-wrap gap-3 readout text-[11px] text-mute">
              {activeModels.map((m) => {
                const conf = MODEL_CONFIG[m]
                const val = r.values[m]
                if (val == null) return null
                return (
                  <span key={m}>
                    {conf.short}{' '}
                    <span style={{ color: conf.color, fontWeight: 'bold' }}>
                      {val.toFixed(r.dp ?? 0)}{r.unit || ''}
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
          <div className="space-y-1">
            {activeModels.map((m) => {
              const conf = MODEL_CONFIG[m]
              const val = r.values[m]
              if (val == null) return null
              const pct = Math.max(2, Math.min(100, (val / r.max) * 100))
              return (
                <div key={m} className="meter-bar" style={{ '--tone': conf.color, height: 8 }}>
                  <i style={{ width: `${pct}%` }} title={`${conf.short}: ${val.toFixed(r.dp ?? 0)}${r.unit || ''}`} />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Compare({ go }) {
  const { marks } = useWorkspace()
  
  // Available models that have watermarked images in workspace
  const readyModels = useMemo(() => {
    return ['ae', 'vae', 'gan'].filter((m) => marks[m] != null)
  }, [marks])

  const [compareMode, setCompareMode] = useState('all') // 'all' or 'pairwise'
  const [model1, setModel1] = useState('ae')
  const [model2, setModel2] = useState('gan')

  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [suiteResults, setSuiteResults] = useState(null) // { ae: {...}, vae: {...}, gan: {...} }
  const [err, setErr] = useState(null)

  // Determine active models to compare
  const activeModels = useMemo(() => {
    if (compareMode === 'all') {
      return ['ae', 'vae', 'gan'].filter((m) => marks[m] != null)
    }
    const pair = [model1, model2].filter(Boolean)
    // ensure unique pair
    return Array.from(new Set(pair))
  }, [compareMode, model1, model2, marks])

  const canCompare = activeModels.length >= 2 && activeModels.every((m) => marks[m] != null)

  const runSuite = async () => {
    if (!canCompare) return
    setRunning(true)
    setErr(null)
    const res = { ...(suiteResults || {}) }
    try {
      for (const m of activeModels) {
        if (!marks[m]?.file) continue
        res[m] = res[m] || {}
        for (const step of SUITE) {
          setProgress(`${MODEL_CONFIG[m].short} · ${step.label}`)
          const f = await runAttackChain(marks[m].file, { ...idle(), ...step.state })
          const d = await detectWatermark(f)
          res[m][step.id] = signalOf(d)
        }
      }
      setSuiteResults(res)
    } catch (e) {
      setErr('The robustness suite could not finish — the backend may be busy. Try again.')
    } finally {
      setRunning(false)
      setProgress('')
    }
  }

  // Quality metrics comparison (PSNR and SSIM)
  const qualityRows = useMemo(() => {
    if (activeModels.length < 2) return null
    const psnrVals = {}
    const ssimVals = {}
    for (const m of activeModels) {
      if (marks[m]) {
        psnrVals[m] = marks[m].psnr
        ssimVals[m] = marks[m].ssim
      }
    }
    return [
      { label: 'PSNR — image fidelity (higher is cleaner)', values: psnrVals, max: 45, unit: ' dB', dp: 1 },
      { label: 'SSIM — structural similarity match (max 1.0)', values: ssimVals, max: 1, unit: '', dp: 3 }
    ]
  }, [activeModels, marks])

  // Robustness rows from suite
  const robustness = useMemo(() => {
    if (!suiteResults) return null
    const validModels = activeModels.filter((m) => suiteResults[m] != null)
    if (validModels.length < 2) return null

    const rows = SUITE.map((s) => {
      const vals = {}
      for (const m of validModels) {
        vals[m] = (suiteResults[m][s.id] ?? 0) * 100
      }
      return { label: s.label, values: vals, max: 100, unit: '%', dp: 0 }
    })

    const averages = {}
    for (const m of validModels) {
      const avg = rows.reduce((acc, r) => acc + (r.values[m] || 0), 0) / rows.length
      averages[m] = avg
    }

    return { rows, averages, validModels }
  }, [suiteResults, activeModels])

  // Dynamic verdict based on measured quality and robustness
  const verdict = useMemo(() => {
    if (!qualityRows || activeModels.length < 2) return null

    // Determine highest PSNR
    const bestPsnrModel = activeModels.reduce((best, m) => {
      const v = marks[m]?.psnr || 0
      return v > (marks[best]?.psnr || 0) ? m : best
    }, activeModels[0])

    const bestSsimModel = activeModels.reduce((best, m) => {
      const v = marks[m]?.ssim || 0
      return v > (marks[best]?.ssim || 0) ? m : best
    }, activeModels[0])

    const pBest = MODEL_CONFIG[bestPsnrModel].short
    const psnrVal = marks[bestPsnrModel]?.psnr?.toFixed(1)

    let line = `${pBest} achieves the highest image fidelity (PSNR ${psnrVal} dB, SSIM ${marks[bestPsnrModel]?.ssim?.toFixed(3)}), causing minimal perceptible distortion.`

    let overall = `${pBest} Leads Quality`

    if (robustness && robustness.validModels.length >= 2) {
      const bestRobModel = robustness.validModels.reduce((best, m) => {
        return (robustness.averages[m] || 0) > (robustness.averages[best] || 0) ? m : best
      }, robustness.validModels[0])

      const rBest = MODEL_CONFIG[bestRobModel].short
      const rPct = robustness.averages[bestRobModel].toFixed(0)

      line += ` Under post-processing attacks, ${rBest} retains the strongest detection signal (average ${rPct}% watermark confidence).`
      overall = bestPsnrModel === bestRobModel ? `${pBest} Dominates Overall` : `${pBest} for Quality · ${rBest} Under Attack`
    } else {
      line += ' Run the robustness suite below to measure how each survives compound attacks.'
    }

    return { line, overall }
  }, [qualityRows, robustness, activeModels, marks])

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Controls: Mode & Dropdowns */}
      <div className="panel p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div>
            <h2 className="text-[18px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Model Comparison Mode
            </h2>
            <p className="text-[12px] text-mute mt-0.5">
              Compare image fidelity and attack survivability across deep watermarking architectures.
            </p>
          </div>
          
          {/* Mode Switcher */}
          <div className="seg inline-flex p-1 rounded-lg bg-graphite border border-[var(--line)]">
            <button
              onClick={() => setCompareMode('all')}
              className="px-3.5 py-1.5 rounded-md text-[11px] font-medium uppercase tracking-wide transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                background: compareMode === 'all' ? 'var(--filament)' : 'transparent',
                color: compareMode === 'all' ? 'var(--graphite)' : 'var(--mute)'
              }}
            >
              Compare All Three (AE vs VAE vs GAN)
            </button>
            <button
              onClick={() => setCompareMode('pairwise')}
              className="px-3.5 py-1.5 rounded-md text-[11px] font-medium uppercase tracking-wide transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                background: compareMode === 'pairwise' ? 'var(--filament)' : 'transparent',
                color: compareMode === 'pairwise' ? 'var(--graphite)' : 'var(--mute)'
              }}
            >
              Head-to-Head (Select 2 Models)
            </button>
          </div>
        </div>

        {/* Pairwise Dropdowns */}
        {compareMode === 'pairwise' && (
          <div className="grid sm:grid-cols-2 gap-4 bg-[var(--panel-inset)] p-4 rounded-xl border border-[var(--line)]">
            <div>
              <label className="tag block mb-1.5 text-[10px] text-[var(--filament)]">Select Model 1</label>
              <select
                value={model1}
                onChange={(e) => setModel1(e.target.value)}
                className="w-full bg-[var(--panel)] border border-[var(--line-2)] rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--filament)] focus:outline-none focus:border-[var(--trace)]"
              >
                <option value="ae">Autoencoder (AE) {marks.ae ? '✓' : '(Not Embedded)'}</option>
                <option value="vae">Variational AE (VAE) {marks.vae ? '✓' : '(Not Embedded)'}</option>
                <option value="gan">GAN (Adversarial) {marks.gan ? '✓' : '(Not Embedded)'}</option>
              </select>
            </div>

            <div>
              <label className="tag block mb-1.5 text-[10px] text-[var(--filament)]">Select Model 2</label>
              <select
                value={model2}
                onChange={(e) => setModel2(e.target.value)}
                className="w-full bg-[var(--panel)] border border-[var(--line-2)] rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--filament)] focus:outline-none focus:border-[var(--trace)]"
              >
                <option value="ae">Autoencoder (AE) {marks.ae ? '✓' : '(Not Embedded)'}</option>
                <option value="vae">Variational AE (VAE) {marks.vae ? '✓' : '(Not Embedded)'}</option>
                <option value="gan">GAN (Adversarial) {marks.gan ? '✓' : '(Not Embedded)'}</option>
              </select>
            </div>
          </div>
        )}

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11.5px]">
          <span className="text-mute font-mono uppercase text-[10px]">Workspace Status:</span>
          {['ae', 'vae', 'gan'].map((m) => {
            const isReady = marks[m] != null
            const conf = MODEL_CONFIG[m]
            return (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[11px]"
                style={{
                  borderColor: isReady ? conf.color : 'var(--line-2)',
                  background: isReady ? `${conf.color}18` : 'transparent',
                  color: isReady ? conf.color : 'var(--mute)'
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isReady ? conf.color : 'var(--mute)' }} />
                {conf.short} {isReady ? 'Embedded ✓' : 'Not Embedded'}
              </span>
            )
          })}
        </div>
      </div>

      {/* If models not ready */}
      {!canCompare && (
        <div className="panel p-8 text-center max-w-lg mx-auto">
          <h3 className="text-[1.4rem] font-bold mb-2">Embed at least two models to compare</h3>
          <p className="text-mute text-[13.5px] mb-6">
            Go to the <span className="text-[var(--filament)] font-semibold">Embed</span> console to watermark an image using Autoencoder, VAE, or GAN. Then return here to put them head-to-head.
          </p>
          {go && (
            <button className="btn btn-trace" onClick={() => go('embed')}>
              Go to Embed Console →
            </button>
          )}
        </div>
      )}

      {/* Comparison Sections */}
      {canCompare && (
        <>
          {/* Quality Panel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="tag">Perceptual Image Quality & Fidelity</p>
              <span className="text-[11px] text-mute font-mono">Calculated on identical source image</span>
            </div>
            <div className="panel p-6">
              {qualityRows && <MultiGroupBars rows={qualityRows} activeModels={activeModels} />}
            </div>
          </div>

          {/* Robustness Suite Panel */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <p className="tag">Surviving Post-Processing Attacks</p>
                <p className="text-[11px] text-mute">Measures ViT detection confidence after each distortion step.</p>
              </div>
              <button className="btn btn-trace btn-lg" onClick={runSuite} disabled={running}>
                {running ? `Benchmarking · ${progress}` : suiteResults ? 'Re-run Robustness Suite' : 'Run Robustness Suite'}
              </button>
            </div>

            {running && <div className="processing-bar mb-4"><i /></div>}
            {err && <p className="text-break text-[13px] mb-3">{err}</p>}

            {robustness ? (
              <div className="panel p-6 space-y-6">
                {/* Average score cards */}
                <div className={`grid gap-4 ${robustness.validModels.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {robustness.validModels.map((m) => {
                    const conf = MODEL_CONFIG[m]
                    const avg = robustness.averages[m] || 0
                    return (
                      <div key={m} className="panel-inset p-4 text-center">
                        <p className="tag font-bold text-[11px]" style={{ color: conf.color }}>
                          {conf.short} · Avg Signal Retained
                        </p>
                        <p className="readout font-bold mt-1" style={{ fontSize: 28, color: TONE_HEX[toneFor(avg)] }}>
                          {avg.toFixed(0)}%
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Detailed Attack breakdown */}
                <MultiGroupBars rows={robustness.rows} activeModels={robustness.validModels} />
                <p className="tag text-[10px] text-mute">
                  Higher percentage = watermark preserved and detected with higher confidence under that specific attack.
                </p>
              </div>
            ) : (
              !running && (
                <div className="panel-inset p-4 text-[13px] text-mute">
                  Click <b>Run Robustness Suite</b> to simulate 5 standardized attacks (JPEG 95, JPEG 85, Center Crop 45%, Rotation 30°, Screenshot) across the selected models.
                </div>
              )
            )}
          </div>

          {/* Analytical Verdict */}
          {verdict && (
            <div className="panel p-6 border-2" style={{ borderColor: 'rgba(91,141,239,0.35)' }}>
              <p className="tag mb-1.5 text-[var(--trace)]">Empirical Benchmark Takeaway</p>
              <h2 className="text-[clamp(1.4rem,2.8vw,1.9rem)] font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {verdict.overall}
              </h2>
              <p className="text-[13.5px] text-mute leading-relaxed">{verdict.line}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
