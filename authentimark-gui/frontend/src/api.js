const BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:8000'
  : (import.meta.env.VITE_API_URL || 'https://authentimark-api.onrender.com')

export const API_BASE_URL = BASE_URL

export async function checkHealth() {
  const response = await fetch(`${BASE_URL}/health`)
  if (!response.ok) throw new Error('health check failed')
  return response.json()
}

export async function watermarkImage(file, method) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('method', method)
  
  const response = await fetch(`${BASE_URL}/watermark`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to watermark image')
  }
  
  return response.json()
}

export async function detectWatermark(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`${BASE_URL}/detect`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to detect watermark')
  }
  
  return response.json()
}

export async function simulateAttack(file, attackType, intensity) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('attackType', attackType)
  formData.append('intensity', intensity)
  
  const response = await fetch(`${BASE_URL}/simulate-attack`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to simulate attack')
  }
  
  return response.json()
}

// Apply an ordered list of attacks in one backend round-trip.
// chain: [{ type: 'blur', intensity: 2 }, ...]
export async function simulateAttackChain(file, chain) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('chain', JSON.stringify(chain))

  const response = await fetch(`${BASE_URL}/simulate-attack-chain`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to simulate attack chain')
  }

  return response.json()
}

export async function generateImage(prompt) {
  const formData = new FormData()
  formData.append('prompt', prompt)
  
  const response = await fetch(`${BASE_URL}/generate-image`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to generate image')
  }
  
  return response.json()
}

export async function decodeMessage(file, method) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('method', method)
  
  const response = await fetch(`${BASE_URL}/decode`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to decode message')
  }
  
  return response.json()
}
