import { useState, useMemo } from 'react'
import { useWorkspace } from '../lib/workspace'
import { runAttackChain, ATTACK_BY_KEY } from '../lib/attacks'
import { detectWatermark } from '../api'
import { toneFor } from '../components/SignalMeter'
import { signalOf } from '../lib/verdict.jsx'

const TONE_HEX = { signal: '#4ADE80', caution: '#FBBF24', break: '#FB5D5D' }
const AE_C = '#5B8DEF'
const VAE_C = '#4ADE80'

/* A fixed suite so AE and VAE are measured on exactly the same attacks */
const SUITE = [
  { id: 'jpeg95', label: 'JPEG 95', state: { jpeg: 95 } },
  { id: 'jpeg85', label: 'JPEG 85', state: { jpeg: 85 } },
  { id: 'crop45', label: 'Crop 45%', state: { crop: 0.45 } },
  { id: 'rot30', label: 'Rotate 30°', state: { rotate: 30 } },
  { id: 'shot', label: 'Screenshot', state: { screenshot: 0.6 } }
]
const idle = () => Object.fromEntries(Object.keys(ATTACK_BY_KEY).map((k) => [k, ATTACK_BY_KEY[k].idle]))

function GroupBars({ rows }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between mb-1">
            <span className="tag">{r.label}</span>
            <span className="readout text-[11px] text-mute">
              AE <span style={{ color: AE_C }}>{r.ae.toFixed(r.dp ?? 0)}{r.unit || ''}</span>
              {'   '}VAE <span style={{ color: VAE_C }}>{r.vae.toFixed(r.dp ?? 0)}{r.unit || ''}</span>
            </span>
          </div>
          {[['ae', r.ae, AE_C], ['vae', r.vae, VAE_C]].map(([k, v, c]) => (
            <div key={k} className="meter-bar mb-1" style={{ '--tone': c, height: 8 }}>
              <i style={{ width: `${Math.max(2, Math.min(100, (v / r.max) * 100))}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function Compare() {
  const { marks } = useWorkspace()
  const both = marks.ae && marks.vae
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [suite, setSuite] = useState(null) // { ae: {jpeg90:conf,...}, vae: {...} }
  const [err, setErr] = useState(null)

  const runSuite = async () => {
    setRunning(true)
    setErr(null)
    const res = { ae: {}, vae: {} }
    try {
      for (const m of ['ae', 'vae']) {
        for (const step of SUITE) {
          setProgress(`${m.toUpperCase()} · ${step.label}`)
          const f = await runAttackChain(marks[m].file, { ...idle(), ...step.state })
          const d = await detectWatermark(f)
          res[m][step.id] = signalOf(d)
        }
      }
      setSuite(res)
    } catch (e) {
      setErr('The robustness suite could not finish — the backend may be busy. Try again.')
    } finally {
      setRunning(false)
      setProgress('')
    }
  }

  const quality = useMemo(() => {
    if (!both) return null
    return [
      { label: 'PSNR — image fidelity', ae: marks.ae.psnr, vae: marks.vae.psnr, max: 45, unit: ' dB', dp: 1 },
      { label: 'SSIM — structural match', ae: marks.ae.ssim, vae: marks.vae.ssim, max: 1, unit: '', dp: 3 }
    ]
  }, [both, marks])

  const robustness = useMemo(() => {
    if (!suite) return null
    const rows = SUITE.map((s) => ({
      label: s.label, ae: suite.ae[s.id] * 100, vae: suite.vae[s.id] * 100, max: 100, unit: '', dp: 0
    }))
    const avgAe = rows.reduce((a, r) => a + r.ae, 0) / rows.length
    const avgVae = rows.reduce((a, r) => a + r.vae, 0) / rows.length
    return { rows, avgAe, avgVae }
  }, [suite])

  const verdict = useMemo(() => {
    if (!quality) return null
    const qAe = (quality[0].ae / 45) * 0.5 + quality[1].ae * 0.5
    const qVae = (quality[0].vae / 45) * 0.5 + quality[1].vae * 0.5
    const better = qAe > qVae ? 'AE' : 'VAE'
    let line = `${better} preserves image quality better (PSNR ${quality[0][better.toLowerCase()].toFixed(1)} dB vs ${quality[0][better === 'AE' ? 'vae' : 'ae'].toFixed(1)}).`
    if (robustness) {
      const rBetter = robustness.avgAe > robustness.avgVae ? 'AE' : 'VAE'
      line += ` Under attack, ${rBetter} keeps its watermark detectable more often — ${(rBetter === 'AE' ? robustness.avgAe : robustness.avgVae).toFixed(0)}% average signal retained vs ${(rBetter === 'AE' ? robustness.avgVae : robustness.avgAe).toFixed(0)}%.`
      return { line, overall: better === rBetter ? better : `${better} for quality, ${rBetter} under attack` }
    }
    return { line: line + ' Run the robustness suite to compare how each survives attacks.', overall: better }
  }, [quality, robustness])

  if (!both) {
    return (
      <div className="panel p-8 max-w-lg">
        <h2 className="text-[1.6rem] mb-2">Embed both methods to compare</h2>
        <p className="text-mute text-[14px]">
          Go to Embed and watermark the same image once with AE and once with VAE. Then this section can put them head to head.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <p className="tag mb-3">Image quality — same source, both methods</p>
        <div className="panel p-5"><GroupBars rows={quality} /></div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <p className="tag">Robustness under attack</p>
          <button className="btn btn-trace" onClick={runSuite} disabled={running}>
            {running ? `Running · ${progress}` : suite ? 'Re-run suite' : 'Run robustness suite'}
          </button>
        </div>
        {running && <div className="processing-bar mb-4"><i /></div>}
        {err && <p className="text-break text-[13px] mb-3">{err}</p>}
        {robustness ? (
          <div className="panel p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[['AE', robustness.avgAe, AE_C], ['VAE', robustness.avgVae, VAE_C]].map(([k, v, c]) => (
                <div key={k} className="panel-inset p-4 text-center">
                  <p className="tag" style={{ color: c }}>{k} · avg signal retained</p>
                  <p className="readout font-semibold mt-1" style={{ fontSize: 30, color: TONE_HEX[toneFor(v)] }}>{v.toFixed(0)}%</p>
                </div>
              ))}
            </div>
            <GroupBars rows={robustness.rows} />
            <p className="tag">Each bar: probability the watermark is still detectable after that single attack. Taller = it survived.</p>
          </div>
        ) : (
          !running && <p className="text-[13px] text-mute">Runs the same five attacks against both watermarks and measures detector confidence after each.</p>
        )}
      </div>

      {verdict && (
        <div className="panel p-6" style={{ borderColor: 'rgba(91,141,239,0.3)' }}>
          <p className="tag mb-2">Which method wins</p>
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] mb-2">{verdict.overall}</h2>
          <p className="text-[14px] text-mute">{verdict.line}</p>
        </div>
      )}
    </div>
  )
}
