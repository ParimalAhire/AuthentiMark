const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function watermarkImage(file, method) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('method', method)
  
  const response = await fetch(`${BASE_URL}/watermark`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const err = await response.json()
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
    const err = await response.json()
    throw new Error(err.detail || 'Failed to detect watermark')
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
    const err = await response.json()
    throw new Error(err.detail || 'Failed to generate image')
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
    const err = await response.json()
    throw new Error(err.detail || 'Failed to simulate attack')
  }
  
  return response.json()
}
