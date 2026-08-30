import { useState, useMemo, useRef } from 'react'
import SignalMeter from './components/SignalMeter'
import finding from './data/finding.json'

/* linear interpolation that works whether x ascends or descends */
function interp(series, xRaw) {
  const xs = series.x
  const n = xs.length
  const x = Math.max(Math.min(xs[0], xs[n - 1]), Math.min(Math.max(xs[0], xs[n - 1]), xRaw))
  for (let i = 1; i < n; i += 1) {
    const a = xs[i - 1]
    const b = xs[i]
    if (x >= Math.min(a, b) && x <= Math.max(a, b)) {
      const t = b === a ? 0 : (x - a) / (b - a)
      return {
        ae: series.ae[i - 1] + (series.ae[i] - series.ae[i - 1]) * t,
        vae: series.vae[i - 1] + (series.vae[i] - series.vae[i - 1]) * t
      }
    }
  }
  return { ae: series.ae[0], vae: series.vae[0] }
}

/* tiny bar-spectrum that "erodes" as signal drops */
function Spectrum({ level, tone }) {
  const bars = 28
  return (
    <div className="flex items-end gap-[3px] h-10">
      {Array.from({ length: bars }).map((_, i) => {
        const base = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.3) * Math.cos(i * 0.5))
        const alive = i / bars < level
        return (
          <span
            key={i}
            className="flex-1 rounded-[1px] transition-all duration-500"
            style={{
              height: `${(alive ? base : 0.12) * 100}%`,
              background: alive ? tone : 'rgba(245,243,236,0.12)',
              boxShadow: alive ? `0 0 6px ${tone}66` : 'none'
            }}
          />
        )
      })}
    </div>
  )
}

function FindingChart({ series, x, onX }) {
  const ref = useRef(null)
  const W = 620
  const H = 170
  const pad = { l: 30, r: 10, t: 14, b: 22 }
  const xr = [series.x[0], series.x[series.x.length - 1]]
  const px = (v) => pad.l + ((v - xr[0]) / (xr[1] - xr[0])) * (W - pad.l - pad.r)
  const py = (v) => pad.t + (1 - v) * (H - pad.t - pad.b)
  const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${px(series.x[i]).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')
  const cur = interp(series, x)

  const handle = (e) => {
    const r = ref.current.getBoundingClientRect()
    const rel = (e.clientX - r.left) / r.width
    onX(xr[0] + rel * (xr[1] - xr[0]))
  }

  return (
    <div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-ew-resize touch-none select-none"
        role="slider"
        aria-label={`${series.label} — drag to change`}
        aria-valuenow={Math.round(x)}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handle(e) }}
        onPointerMove={(e) => e.buttons && handle(e)}
      >
        {[0, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={py(g)} y2={py(g)} stroke="rgba(245,243,236,0.06)" />
            <text x={pad.l - 6} y={py(g) + 3} fill="#7C808C" fontSize="8" textAnchor="end" fontFamily="var(--font-mono)">{Math.round(g * 100)}</text>
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={py(0.75)} y2={py(0.75)} stroke="rgba(251,191,36,0.5)" strokeDasharray="4 4" />
        <text x={W - pad.r} y={py(0.75) - 4} fill="#FBBF24" fontSize="7.5" textAnchor="end" fontFamily="var(--font-mono)">THRESHOLD</text>
        <path d={`${path(series.ae)} L${px(series.x[series.x.length - 1])} ${py(0)} L${px(series.x[0])} ${py(0)} Z`} fill="rgba(91,141,239,0.1)" />
        <path d={path(series.vae)} fill="none" stroke="#4ADE80" strokeWidth="2.5" />
        <path d={path(series.ae)} fill="none" stroke="#5B8DEF" strokeWidth="2.5" />
        <line x1={px(x)} x2={px(x)} y1={pad.t} y2={H - pad.b} stroke="rgba(245,243,236,0.4)" />
        <circle cx={px(x)} cy={py(cur.vae)} r="4" fill="#4ADE80" />
        <circle cx={px(x)} cy={py(cur.ae)} r="4" fill="#5B8DEF" />
        {series.x.map((v) => (
          <text key={v} x={px(v)} y={H - 6} fill="#7C808C" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">{v}</text>
        ))}
      </svg>
      <div className="flex gap-6 mt-2 readout text-[12px]">
        <span style={{ color: '#5B8DEF' }}>AE {(cur.ae * 100).toFixed(0)}%</span>
        <span style={{ color: '#4ADE80' }}>VAE {(cur.vae * 100).toFixed(0)}%</span>
        <span className="text-mute">{series.label.split(' ')[0]} {Math.round(x)}{series.unit}</span>
      </div>
    </div>
  )
}

export default function Landing({ enter }) {
  const [q, setQ] = useState(100) // JPEG quality for the hero demo
  const [find, setFind] = useState(88) // playhead for the finding chart
  const demo = useMemo(() => interp(finding.jpeg, q), [q])

  return (
    <div className="relative z-10">
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[var(--graphite)]/70 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-md" style={{ background: 'linear-gradient(135deg, var(--trace), var(--signal))' }} />
            <span className="display-wide text-[14px]">AuthentiMark</span>
          </div>
          <button className="btn" onClick={enter}>Open console →</button>
        </div>
      </nav>

      {/* hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-20">
        <p className="tag rise">Signal integrity for AI images</p>
        <h1 className="display-xl text-[clamp(2.6rem,10vw,5.4rem)] mt-4 rise d1">
          Invisible by design.
        </h1>

        <div className="grid lg:grid-cols-[1fr_minmax(0,500px)] gap-10 lg:gap-16 items-start mt-8">
          <div className="rise d2">
            <p className="text-[17px] text-mute max-w-md">
              Embed a watermark no one can see. Then stress-test how well it survives the internet.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <button className="btn btn-lg" onClick={enter}>Open the console →</button>
              <a className="btn btn-ghost btn-lg" href="#finding">See the finding</a>
            </div>
            <div className="hidden lg:flex gap-8 mt-12 readout text-[12px] text-mute">
              <span>3 models</span><span>8 attack types</span><span>live detection</span>
            </div>
          </div>

          {/* live demo panel */}
          <div className="panel p-6 sm:p-7 rise d3 scanlines relative">
            <p className="tag mb-4">Live · save the watermarked image as JPEG</p>
            <div className="space-y-4">
              {[
                { k: 'ae', name: 'AE watermark', c: '#5B8DEF', v: demo.ae },
                { k: 'vae', name: 'VAE watermark', c: '#4ADE80', v: demo.vae }
              ].map((row) => (
                <div key={row.k}>
                  <div className="flex justify-between mb-1.5">
                    <span className="tag" style={{ color: row.c }}>{row.name}</span>
                    <span className="readout text-[12px]" style={{ color: row.v < 0.25 ? 'var(--break)' : row.c }}>
                      {row.v < 0.25 ? 'LOST' : `${(row.v * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <Spectrum level={row.v} tone={row.v < 0.25 ? '#FB5D5D' : row.c} />
                </div>
              ))}
            </div>
            <div className="mt-5">
              <input
                type="range" className="fader" min={55} max={100} step={1} value={q}
                style={{ '--pct': `${((q - 55) / 45) * 100}%` }}
                onChange={(e) => setQ(+e.target.value)}
                aria-label="JPEG quality"
              />
              <div className="fader-ticks">
                <span style={{ left: '0%' }}>Q55</span>
                <span style={{ left: '55%' }}>Q80</span>
                <span style={{ left: '100%' }}>Q100</span>
              </div>
            </div>
            <p className="tag mt-3">
              {q >= 96 ? 'Fresh from the encoder — the AE mark is intact' : demo.ae < 0.25 ? 'Both marks gone — and the image looks fine' : `Quality ${q} · the AE mark is failing`}
            </p>
          </div>
        </div>
      </section>

      {/* model chips */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 border-t border-[var(--line)]">
        <p className="tag mb-4">The three models</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { t: 'Autoencoder', s: 'Deterministic embed', v: 82, m: '~31 dB PSNR' },
            { t: 'Variational AE', s: 'Sampled latent embed', v: 40, m: '~17 dB PSNR' },
            { t: 'ViT detector', s: '2-class · confidence out', v: 99, m: '99% test acc' }
          ].map((m) => (
            <div key={m.t} className="panel p-5">
              <div className="flex items-baseline justify-between">
                <div className="display-wide text-[14px]">{m.t}</div>
                <span className="readout text-[10px] text-mute">{m.m}</span>
              </div>
              <div className="tag mt-1 mb-1">{m.s}</div>
              <div className="tag mb-4 opacity-60">image fidelity</div>
              <SignalMeter variant="bar" value={m.v} animate={false} />
            </div>
          ))}
        </div>
      </section>

      {/* the finding */}
      <section id="finding" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t border-[var(--line)] scroll-mt-16">
        <div className="grid lg:grid-cols-[1fr_minmax(0,640px)] gap-10 lg:gap-14 items-start">
          <div>
            <p className="tag">The finding — measured, not claimed</p>
            <h2 className="display-wide text-[clamp(1.8rem,4vw,2.8rem)] mt-3">
              A routine save<br />wipes it out.
            </h2>
            <p className="text-[15px] text-mute mt-4 max-w-sm">
              Re-save the image as a JPEG — what every platform does — and the watermark
              is gone. The VAE mark dies at quality 100; the AE mark lasts to about 88.
              Drag the chart.
            </p>
            <button className="btn btn-trace mt-6" onClick={enter}>Run it yourself →</button>
          </div>
          <div className="panel p-5 sm:p-6 scanlines relative">
            <FindingChart series={finding.jpeg} x={find} onX={setFind} />
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-5 sm:px-8 py-10 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, var(--trace), var(--signal))' }} />
          <span className="display-wide text-[12px]">AuthentiMark</span>
        </div>
        <span className="tag">AE · VAE · ViT — inference only</span>
      </footer>
    </div>
  )
}
