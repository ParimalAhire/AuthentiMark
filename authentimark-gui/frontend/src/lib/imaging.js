const load = (src) =>
  new Promise((res, rej) => {
    const im = new Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => res(im)
    im.onerror = rej
    im.src = src
  })

/* Amplified per-pixel difference between two images — the actual
   watermark perturbation, made visible. Trace-blue on graphite. */
export async function buildDiffMap(aUrl, bUrl, gain = 12) {
  const [a, b] = await Promise.all([load(aUrl), load(bUrl)])
  const w = Math.min(a.naturalWidth || 256, b.naturalWidth || 256)
  const h = Math.min(a.naturalHeight || 256, b.naturalHeight || 256)
  const ctx = (img) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const x = c.getContext('2d')
    x.drawImage(img, 0, 0, w, h)
    return x.getImageData(0, 0, w, h)
  }
  const da = ctx(a)
  const db = ctx(b)
  const out = new ImageData(w, h)
  for (let i = 0; i < da.data.length; i += 4) {
    const d =
      (Math.abs(da.data[i] - db.data[i]) +
        Math.abs(da.data[i + 1] - db.data[i + 1]) +
        Math.abs(da.data[i + 2] - db.data[i + 2])) / 3
    const m = Math.min(1, Math.pow((d / 255) * gain, 0.75))
    out.data[i] = 40 + m * 60
    out.data[i + 1] = 90 + m * 90
    out.data[i + 2] = 120 + m * 135
    out.data[i + 3] = 255
  }
  const oc = document.createElement('canvas')
  oc.width = w
  oc.height = h
  oc.getContext('2d').putImageData(out, 0, 0)
  return oc.toDataURL()
}

export function bitsFromMessage(message) {
  if (Array.isArray(message)) return message.map((n) => (n ? 1 : 0)).slice(0, 32)
  if (typeof message === 'string') {
    const clean = message.replace(/[^01]/g, '')
    if (clean.length >= 8) return clean.slice(0, 32).padEnd(32, '0').split('').map(Number)
  }
  return Array.from({ length: 32 }, () => 0)
}
