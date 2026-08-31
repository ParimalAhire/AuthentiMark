import { useState, useEffect, useMemo } from 'react'
import Dropzone from '../components/Dropzone'
import { useWorkspace, base64ToFile } from '../lib/workspace'
import { watermarkImage, generateImage } from '../api'
import { buildDiffMap, bitsFromMessage } from '../lib/imaging'

const SAMPLES = [
  { name: 'Portrait', src: '/samples/sample-portrait.jpg' },
  { name: 'Still life', src: '/samples/sample-still.jpg' },
  { name: 'Abstract', src: '/samples/sample-abstract.jpg' }
]

function ScoreDial({ label, value, max, unit, good }) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100))
  return (
    <div className="panel-inset p-4">
      <div className="flex items-baseline justify-between">
        <span className="tag">{label}</span>
        <span className="tag">{good}</span>
      </div>
      <div className="readout font-semibold mt-1" style={{ fontSize: 26 }}>
        {value.toFixed(label === 'SSIM' ? 3 : 1)}
        <span className="text-[12px] text-mute ml-1">{unit}</span>
      </div>
      <div className="meter-bar mt-3" style={{ '--tone': 'var(--trace)' }}>
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Embed({ go }) {
  const { source, loadSource, marks, setMark, resetWorkspace } = useWorkspace()
  const [method, setMethod] = useState('ae')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [diff, setDiff] = useState(null)
  const [showDiff, setShowDiff] = useState(false)
  const [developing, setDeveloping] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setErr(null)
    try {
      const data = await generateImage(prompt)
      const file = base64ToFile(data.imageUrl, `generated_${Date.now()}.png`)
      loadSource(file)
    } catch (e) {
      setErr(e.message || 'Image generation failed. Ensure backend is running.')
    } finally {
      setGenerating(false)
    }
  }

  const mark = marks[method]
  const bits = useMemo(() => (mark ? bitsFromMessage(mark.bits) : null), [mark])

  useEffect(() => {
    setDiff(null)
    setShowDiff(false)
  }, [method, source])

  const loadSample = async (src) => {
    setErr(null)
    try {
      const blob = await (await fetch(src)).blob()
      loadSource(new File([blob], src.split('/').pop(), { type: blob.type || 'image/jpeg' }))
    } catch {
      setErr("Couldn't load that sample. Try uploading your own image.")
    }
  }

  const embed = async () => {
    if (!source) return
    setBusy(true)
    setErr(null)
    setDiff(null)
    try {
      const data = await watermarkImage(source.file, method)
      const file = base64ToFile(data.watermarkedImageUrl, `${method}_marked.png`)
      setMark(method, { url: data.watermarkedImageUrl, file, psnr: data.psnr, ssim: data.ssim, bits: data.message })
      setDeveloping(true)
      setTimeout(() => setDeveloping(false), 900)
      buildDiffMap(source.url, data.watermarkedImageUrl).then(setDiff).catch(() => setDiff(null))
    } catch (e) {
      setErr(e.message || 'The embedder did not respond. Check that the backend is running, then try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!source) {
    return (
      <div className="max-w-xl space-y-6 mx-auto">
        <div>
          <Dropzone onFile={loadSource} title="Load an image to watermark" />
          <p className="tag mt-4 mb-2">Or start from a sample</p>
          <div className="flex gap-2">
            {SAMPLES.map((s) => (
              <button key={s.name} className="chip" onClick={() => loadSample(s.src)}>{s.name}</button>
            ))}
          </div>
        </div>

        <div className="panel p-5 border border-[var(--line)]">
          <p className="tag mb-1.5">AI Image Generator</p>
          <p className="text-mute text-[13px] mb-4">Enter a text prompt to generate a custom starting image using Pollinations AI.</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. A serene mountain lake at sunrise, highly detailed..."
              className="flex-1 px-4 py-2 text-[14px] rounded-lg border border-[var(--line-2)] bg-[var(--panel-2)] text-[var(--filament)] focus:outline-none focus:border-[var(--trace)]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate()
              }}
            />
            <button
              className="btn btn-trace"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
            >
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
        
        {err && <p className="text-break text-[13px] mt-4">{err}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* controls */}
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="tag mb-2">Embedding model</p>
          <div className="seg inline-flex p-1 rounded-lg bg-graphite border border-[var(--line)]">
            {['ae', 'vae'].map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className="px-4 py-2 rounded-md text-[12px] font-medium uppercase tracking-wide transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: method === m ? 'var(--filament)' : 'transparent',
                  color: method === m ? 'var(--graphite)' : 'var(--mute)'
                }}
              >
                {m === 'ae' ? 'Autoencoder' : 'Variational'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-lg" onClick={embed} disabled={busy}>
            {busy ? 'Embedding…' : mark ? 'Re-embed' : 'Embed watermark'}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={resetWorkspace} disabled={busy}>
            Refresh / Clear
          </button>
        </div>
      </div>

      {busy && <div className="processing-bar max-w-md"><i /></div>}
      {err && (
        <div className="panel-inset p-4 max-w-md">
          <p className="tag text-break mb-1">Embed failed</p>
          <p className="text-[13px]">{err}</p>
        </div>
      )}

      {/* the payoff: original vs watermarked */}
      <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
        <figure className="frame">
          <span className="frame-label text-mute">Original</span>
          <img src={source.url} alt={`Original image: ${source.name}`} />
        </figure>
        <figure className={`frame ${developing ? 'rendering' : ''}`}>
          <span className="frame-label" style={{ color: mark ? 'var(--signal)' : 'var(--mute)' }}>
            {mark ? (showDiff ? 'Watermark ×12' : `Watermarked · ${method.toUpperCase()}`) : 'Not yet watermarked'}
          </span>
          {mark ? (
            <img
              src={showDiff && diff ? diff : mark.url}
              alt={showDiff ? 'Amplified view of the embedded watermark pattern' : `Watermarked image, ${method.toUpperCase()} method`}
            />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <span className="tag">press embed watermark</span>
            </div>
          )}
        </figure>
      </div>

      {mark && (
        <div className="space-y-6 max-w-3xl rise">
          <div className="flex items-center gap-3">
            <p className="tag">Quality — original vs watermarked</p>
            {diff && (
              <button className="chip" data-on={showDiff} onClick={() => setShowDiff((s) => !s)}>
                <span className="dot" />{showDiff ? 'Hide the pattern' : 'Reveal the pattern'}
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ScoreDial label="PSNR" value={mark.psnr} max={50} unit="dB" good={mark.psnr >= 35 ? 'excellent' : mark.psnr >= 28 ? 'good' : 'visible'} />
            <ScoreDial label="SSIM" value={mark.ssim} max={1} unit="" good={mark.ssim >= 0.97 ? 'near-identical' : mark.ssim >= 0.9 ? 'close' : 'noticeable'} />
          </div>

          <div>
            <p className="tag mb-2">32-bit signature written into the image</p>
            <div className="grid grid-cols-16 gap-1.5" style={{ gridTemplateColumns: 'repeat(16, 1fr)', maxWidth: 420 }}>
              {bits.map((b, i) => (
                <span
                  key={i}
                  className="aspect-square rounded-[2px] border border-[var(--line-2)]"
                  style={{
                    background: b ? 'linear-gradient(135deg, var(--trace), var(--signal))' : 'var(--panel-2)',
                    transitionDelay: `${i * 10}ms`
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button className="btn btn-trace" onClick={() => go('attack')}>Test under attack →</button>
            <button className="btn btn-ghost" onClick={() => go('examine')}>Examine this image →</button>
            <a className="btn btn-ghost" href={mark.url} download={`authentimark_${method}.png`}>Download</a>
          </div>
        </div>
      )}
    </div>
  )
}
