const BASE_URL = 'https://authentimark-api.onrender.com'

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

export async function simulateAttack(file, attackType, paramValue) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('attack_type', attackType)
  formData.append('param_value', paramValue)
  
  const response = await fetch(`${BASE_URL}/attack`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to simulate attack')
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
