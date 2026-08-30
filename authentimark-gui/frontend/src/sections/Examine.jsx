import { useState, useEffect, useMemo } from 'react'
import Dropzone from '../components/Dropzone'
import SignalMeter from '../components/SignalMeter'
import { useWorkspace } from '../lib/workspace'
import { detectWatermark } from '../api'
import { verdictInfo, VIcon, signalOf } from '../lib/verdict.jsx'

const TONE_HEX = { signal: '#4ADE80', caution: '#FBBF24', break: '#FB5D5D', trace: '#5B8DEF' }

export default function Examine({ go }) {
  const { source, marks, examine, setExamine, loadSource } = useWorkspace()
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  // candidates the user can examine straight away
  const candidates = useMemo(() => {
    const list = []
    if (marks.ae) list.push({ key: 'ae', label: 'Your AE-watermarked image', file: marks.ae.file, url: marks.ae.url })
    if (marks.vae) list.push({ key: 'vae', label: 'Your VAE-watermarked image', file: marks.vae.file, url: marks.vae.url })
    if (source) list.push({ key: 'src', label: 'Your original (unwatermarked)', file: source.file, url: source.url })
    return list
  }, [marks, source])

  const previewUrl = examine?.url || (file ? URL.createObjectURL(file) : null)
  useEffect(() => () => { if (file && previewUrl && !examine) URL.revokeObjectURL(previewUrl) }, [file]) // eslint-disable-line

  const run = async (f, label) => {
    const target = f || file
    if (!target) return
    setBusy(true)
    setErr(null)
    setExamine(null)
    try {
      const data = await detectWatermark(target)
      setExamine({
        ...data,
        url: label && f ? candidates.find((c) => c.file === f)?.url : URL.createObjectURL(target),
        name: label || name || target.name
      })
    } catch (e) {
      setErr(e.message || 'The detector did not respond. Check the backend and try again.')
    } finally {
      setBusy(false)
    }
  }

  const pick = (f) => {
    setFile(f)
    setName(f.name)
    setExamine(null)
    setErr(null)
  }

  const info = verdictInfo(examine)

  return (
    <div className="grid lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
      {/* left — the image under test */}
      <div className="space-y-4">
        <figure className="frame">
          <span className="frame-label text-mute">{examine ? 'Examined' : file ? 'Ready to examine' : 'No image loaded'}</span>
          {previewUrl ? (
            <img src={previewUrl} alt={`Image being examined: ${examine?.name || name || 'uploaded image'}`} />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-6">
              <Dropzone onFile={pick} title="Load any image to check" compact />
            </div>
          )}
        </figure>

        {candidates.length > 0 && (
          <div>
            <p className="tag mb-2">From your workspace</p>
            <div className="flex flex-col gap-1.5">
              {candidates.map((c) => (
                <button key={c.key} className="chip justify-start" onClick={() => run(c.file, c.label)}>
                  <span className="dot" />{c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {file && (
          <button className="btn btn-ghost" onClick={() => { setFile(null); setExamine(null) }}>Clear</button>
        )}
      </div>

      {/* right — the verdict */}
      <div className="panel p-6 sm:p-8 min-h-[280px] flex flex-col justify-center">
        {!examine && !busy && (
          <div>
            {file ? (
              <button className="btn btn-lg" onClick={() => run()}>Examine image</button>
            ) : (
              <p className="text-mute text-[14px] max-w-xs">
                Load an image, or pick one from your workspace, to read whether a watermark is present.
              </p>
            )}
            {err && <p className="text-break text-[13px] mt-4">{err}</p>}
          </div>
        )}

        {busy && (
          <div className="space-y-3">
            <p className="tag pulse">Reading the signal…</p>
            <div className="processing-bar max-w-xs"><i /></div>
          </div>
        )}

        {examine && info && (
          <div className="rise">
            <p className="tag mb-3">Verdict</p>
            <div className="flex items-center gap-3">
              <span
                className="grid place-items-center w-9 h-9 rounded-lg shrink-0"
                style={{ background: `${TONE_HEX[info.tone]}22`, color: TONE_HEX[info.tone] }}
              >
                <VIcon name={info.icon} className="w-5 h-5" />
              </span>
              <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)]" style={{ color: TONE_HEX[info.tone] }}>
                {info.headline}
              </h2>
            </div>

            <p className="text-[14px] text-mute mt-3 max-w-sm">{info.note}</p>

            <div className="mt-6 max-w-xs">
              <SignalMeter variant="bar" value={signalOf(examine) * 100} tone={info.tone} label="Watermark signal strength" sub={`${(signalOf(examine) * 100).toFixed(1)}%`} />
            </div>

            <div className="readout text-[12px] text-mute mt-5 grid gap-1" style={{ maxWidth: 340 }}>
              <div className="flex justify-between"><span>P(watermark present)</span><span className="text-filament">{(signalOf(examine) * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>detector class · confidence</span><span className="text-filament">{examine.prediction === 1 ? 'watermarked' : 'clean'} · {(examine.confidence * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>model</span><span className="text-filament">ViT · 2-class</span></div>
            </div>

            <div className="flex gap-2 mt-6">
              <button className="btn btn-ghost" onClick={() => { setFile(null); setExamine(null) }}>Examine another</button>
              {(marks.ae || marks.vae) && (
                <button className="btn btn-trace" onClick={() => go('attack')}>See it degrade under attack →</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
