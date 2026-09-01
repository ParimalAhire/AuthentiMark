import { simulateAttack } from '../api'
import { base64ToFile } from './workspace'

/* Every attack maps to a real backend function in
   backend/inference.py (crop/rotate/noise/blur/jpeg existed;
   brightness/downscale/screenshot were added following the same
   pattern). Nothing here is a cosmetic-only preview — the image
   that reaches the detector is exactly what these produce. */
export const ATTACKS = [
  {
    key: 'jpeg', label: 'JPEG compression', unit: 'Q',
    min: 2, max: 100, step: 1, default: 100, idle: 100,
    invert: true, // lower value = more damage
    presets: [{ at: 15, label: '15' }, { at: 3, label: '3' }],
    format: (v) => `Q ${Math.round(v)}`,
    hint: 'Re-encodes as JPEG. This watermark rides low frequencies — VAE gives way near Q8, AE hangs on to about Q3.'
  },
  {
    key: 'crop', label: 'Center crop', unit: '%',
    min: 0.25, max: 1, step: 0.01, default: 1, idle: 1,
    invert: true,
    presets: [{ at: 0.6, label: '60%' }, { at: 0.35, label: '35%' }],
    format: (v) => `${Math.round(v * 100)}% kept`,
    hint: 'Keeps the centre, discards the border. Hits AE harder than VAE.'
  },
  {
    key: 'blur', label: 'Gaussian blur', unit: '%',
    min: 0, max: 0.04, step: 0.001, default: 0, idle: 0,
    presets: [{ at: 0.012, label: 'soft' }, { at: 0.025, label: 'heavy' }],
    format: (v) => `${(v * 100).toFixed(1)}% of frame`,
    hint: 'Gaussian blur with radius set as a fraction of the image — resolution-independent. Breaks around 2%.'
  },
  {
    key: 'downscale', label: 'Downscale', unit: '%',
    min: 0.1, max: 1, step: 0.01, default: 1, idle: 1,
    invert: true,
    presets: [{ at: 0.4, label: '40%' }, { at: 0.15, label: '15%' }],
    format: (v) => `${Math.round(v * 100)}%`,
    hint: 'Shrinks then restores size. The spread watermark shrugs this off — a robustness check, not a kill.'
  },
  {
    key: 'brightness', label: 'Brightness', unit: '×',
    min: 0.4, max: 1.8, step: 0.02, default: 1, idle: 1,
    center: 1,
    presets: [{ at: 0.65, label: '−' }, { at: 1.4, label: '+' }],
    format: (v) => `${v.toFixed(2)}×`,
    hint: 'Shifts exposure. Photometric only — the detector is invariant to it.'
  },
  {
    key: 'noise', label: 'Sensor noise', unit: 'σ',
    min: 0, max: 0.3, step: 0.005, default: 0, idle: 0,
    presets: [{ at: 0.08, label: 'low' }, { at: 0.2, label: 'high' }],
    format: (v) => `σ ${v.toFixed(3)}`,
    hint: 'Adds Gaussian noise. The ViT detector is highly noise-robust — expect the signal to hold.'
  },
  {
    key: 'rotate', label: 'Rotation', unit: '°',
    min: -48, max: 48, step: 1, default: 0, idle: 0,
    center: 0,
    presets: [{ at: 20, label: '20°' }, { at: 40, label: '40°' }],
    format: (v) => `${v > 0 ? '+' : ''}${Math.round(v)}°`,
    hint: 'Rotates in place. AE falls apart past ~20°; VAE is rotation-invariant.'
  },
  {
    key: 'screenshot', label: 'Screenshot capture', unit: '',
    min: 0, max: 1, step: 0.02, default: 0, idle: 0,
    presets: [{ at: 0.5, label: 'mild' }, { at: 0.9, label: 'harsh' }],
    format: (v) => `${Math.round(v * 100)}%`,
    hint: 'Downscale + recompress + soft blur + exposure lift — grabbing an image off a screen.'
  }
]

export const ATTACK_BY_KEY = Object.fromEntries(ATTACKS.map((a) => [a.key, a]))

// order matters: geometry first, photometry next, codec last
const ORDER = ['crop', 'rotate', 'downscale', 'brightness', 'noise', 'blur', 'jpeg', 'screenshot']

export function activeAttacks(state) {
  return ORDER.filter((k) => {
    const spec = ATTACK_BY_KEY[k]
    const v = state[k]
    return v !== undefined && Math.abs(v - spec.idle) > 1e-6
  }).map((k) => ({ key: k, value: state[k], spec: ATTACK_BY_KEY[k] }))
}

export function attackSummary(state) {
  return activeAttacks(state).map(({ spec, value }) => `${spec.label.split(' ')[0]} ${spec.format(value)}`)
}

/* Run the active attacks as a chain of real /simulate-attack calls,
   feeding each result into the next, and return the final File. */
export async function runAttackChain(startFile, state) {
  const chain = activeAttacks(state)
  if (chain.length === 0) return startFile
  let file = startFile
  for (const { key, value } of chain) {
    const data = await simulateAttack(file, key, value)
    file = base64ToFile(data.attackedImageUrl, `atk_${key}.png`)
  }
  return file
}
