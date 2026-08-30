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
    min: 10, max: 100, step: 1, default: 100, idle: 100,
    invert: true, // lower value = more damage
    presets: [{ at: 90, label: '90' }, { at: 30, label: '30' }],
    format: (v) => `Q ${Math.round(v)}`,
    hint: 'Re-encodes the image as JPEG.'
  },
  {
    key: 'crop', label: 'Center crop', unit: '%',
    min: 0.35, max: 1, step: 0.01, default: 1, idle: 1,
    invert: true,
    presets: [{ at: 0.7, label: '70%' }, { at: 0.4, label: '40%' }],
    format: (v) => `${Math.round(v * 100)}% kept`,
    hint: 'Keeps the centre, discards the border.'
  },
  {
    key: 'blur', label: 'Gaussian blur', unit: 'px',
    min: 0, max: 6, step: 0.1, default: 0, idle: 0,
    presets: [{ at: 1.5, label: '1.5' }, { at: 3, label: '3.0' }],
    format: (v) => `${v.toFixed(1)} px`,
    hint: 'Softens fine detail.'
  },
  {
    key: 'downscale', label: 'Downscale', unit: '%',
    min: 0.25, max: 1, step: 0.01, default: 1, idle: 1,
    invert: true,
    presets: [{ at: 0.5, label: '50%' }, { at: 0.35, label: '35%' }],
    format: (v) => `${Math.round(v * 100)}%`,
    hint: 'Shrinks then restores size — loses resolution.'
  },
  {
    key: 'brightness', label: 'Brightness', unit: '×',
    min: 0.4, max: 1.8, step: 0.02, default: 1, idle: 1,
    center: 1,
    presets: [{ at: 0.65, label: '−' }, { at: 1.4, label: '+' }],
    format: (v) => `${v.toFixed(2)}×`,
    hint: 'Shifts exposure up or down.'
  },
  {
    key: 'noise', label: 'Sensor noise', unit: 'σ',
    min: 0, max: 0.14, step: 0.002, default: 0, idle: 0,
    presets: [{ at: 0.04, label: 'low' }, { at: 0.09, label: 'high' }],
    format: (v) => `σ ${v.toFixed(3)}`,
    hint: 'Adds Gaussian noise, like a phone camera in low light.'
  },
  {
    key: 'rotate', label: 'Rotation', unit: '°',
    min: -48, max: 48, step: 1, default: 0, idle: 0,
    center: 0,
    presets: [{ at: 15, label: '15°' }, { at: 45, label: '45°' }],
    format: (v) => `${v > 0 ? '+' : ''}${Math.round(v)}°`,
    hint: 'Rotates in place — AE and VAE diverge here.'
  },
  {
    key: 'screenshot', label: 'Screenshot capture', unit: '',
    min: 0, max: 1, step: 0.02, default: 0, idle: 0,
    presets: [{ at: 0.5, label: 'mild' }, { at: 0.9, label: 'harsh' }],
    format: (v) => `${Math.round(v * 100)}%`,
    hint: 'Downscale + recompress + soft blur — what happens when an image is grabbed off a screen.'
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
