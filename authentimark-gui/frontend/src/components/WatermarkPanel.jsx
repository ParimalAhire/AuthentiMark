import { useState } from 'react'
import ImageUploader from './ImageUploader'
import { watermarkImage, generateImage, simulateAttack } from '../api'

export default function WatermarkPanel({ setActiveTab, setDetectFile, isDark }) {
  const [file, setFile] = useState(null)
  const [method, setMethod] = useState('ae')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  const [attackType, setAttackType] = useState('rotate')
  const [intensity, setIntensity] = useState(15)
  const [attackLoading, setAttackLoading] = useState(false)
  const [attackError, setAttackError] = useState(null)
  const [attackResult, setAttackResult] = useState(null)

  const base64ToFile = (dataUrl, filename) => {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile)
    setResult(null)
    setAttackResult(null)
    setError(null)
    setAttackError(null)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)
    setResult(null)
    setAttackResult(null)
    try {
      const data = await generateImage(prompt)
      const imageFile = base64ToFile(data.imageUrl, 'generated_prompt.png')
      setFile(imageFile)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleWatermark = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    setAttackResult(null)
    try {
      const data = await watermarkImage(file, method)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAttackTypeChange = (type) => {
    setAttackType(type)
    setAttackResult(null)
    if (type === 'crop') setIntensity(0.8)
    else if (type === 'rotate') setIntensity(15)
    else if (type === 'noise') setIntensity(0.05)
    else if (type === 'blur') setIntensity(2.0)
    else if (type === 'jpeg') setIntensity(50)
  }

  const handleSimulateAttack = async () => {
    if (!result || !result.watermarkedImageUrl) return
    setAttackLoading(true)
    setAttackError(null)
    setAttackResult(null)
    try {
      const wmFile = base64ToFile(result.watermarkedImageUrl, 'watermarked.png')
      const data = await simulateAttack(
        wmFile,
        attackType,
        intensity
      )
      setAttackResult(data)
    } catch (err) {
      setAttackError(err.message)
    } finally {
      setAttackLoading(false)
    }
  }

  const handleSendToDetector = () => {
    if (!attackResult || !attackResult.attackedImageUrl) return
    const attackedFile = base64ToFile(attackResult.attackedImageUrl, `attacked_${attackType}.png`)
    setDetectFile(attackedFile)
    setActiveTab('detect')
  }

  const getIntensityLabel = () => {
    if (attackType === 'crop') return `Crop Ratio: ${Math.round(intensity * 100)}%`
    if (attackType === 'rotate') return `Rotation Angle: ${intensity}°`
    if (attackType === 'noise') return `Noise Variance: ${intensity}`
    if (attackType === 'blur') return `Blur Radius: ${intensity}px`
    if (attackType === 'jpeg') return `JPEG Quality: ${intensity}`
    return ''
  }

  const getSliderParams = () => {
    if (attackType === 'crop') return { min: 0.1, max: 1.0, step: 0.05 }
    if (attackType === 'rotate') return { min: -180, max: 180, step: 5 }
    if (attackType === 'noise') return { min: 0.0, max: 0.5, step: 0.01 }
    if (attackType === 'blur') return { min: 0.0, max: 10.0, step: 0.5 }
    if (attackType === 'jpeg') return { min: 1, max: 100, step: 1 }
    return { min: 0, max: 100, step: 1 }
  }

  return (
    <div className="space-y-12">
      <div className={`p-8 rounded-2xl border transition-colors duration-200 ${
        isDark ? 'bg-[#212c29] border-[#7f9778]/15' : 'bg-[#f5f6f0] border-[#6f8368]/15'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif tracking-wide">1. Generate Cover Image</h2>
          <span className={`text-[10px] uppercase tracking-widest font-mono border px-2.5 py-0.5 rounded-lg ${
            isDark ? 'border-[#7f9778]/30 text-[#7f9778]' : 'border-[#6f8368]/30 text-[#6f8368]'
          }`}>Ready</span>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
            className={`flex-1 px-5 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 ${
              isDark 
                ? 'bg-[#151e1b] border-[#7f9778]/20 text-[#f0f2f0] placeholder-[#a3aca4]/35 focus:border-[#7f9778] focus:ring-[#7f9778]/30' 
                : 'bg-[#e6e7df] border-[#6f8368]/20 text-[#1b1e1b] placeholder-[#5a6258]/35 focus:border-[#6f8368] focus:ring-[#6f8368]/30'
            }`}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${
              isDark ? 'bg-[#a0543e] hover:bg-[#894430] text-[#f0f2f0]' : 'bg-[#e59a84] hover:bg-[#cf836d] text-[#f5f6f0]'
            }`}
          >
            {generating ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
      </div>

      <div className={`p-8 rounded-2xl border transition-colors duration-200 ${
        isDark ? 'bg-[#212c29] border-[#7f9778]/15' : 'bg-[#f5f6f0] border-[#6f8368]/15'
      }`}>
        <h2 className="text-xl font-serif tracking-wide mb-6">2. Embed Watermark</h2>
        
        <div className="mb-6">
          <label className={`block text-xs uppercase tracking-widest mb-3 font-mono ${
            isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
          }`}>Model Selection</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-1 ${
              isDark 
                ? 'bg-[#151e1b] border-[#7f9778]/20 text-[#f0f2f0] focus:border-[#7f9778] focus:ring-[#7f9778]/30' 
                : 'bg-[#e6e7df] border-[#6f8368]/20 text-[#1b1e1b] focus:border-[#6f8368] focus:ring-[#6f8368]/30'
            }`}
          >
            <option value="ae">AutoEncoder (AE)</option>
            <option value="vae">Variational AutoEncoder (VAE)</option>
          </select>
        </div>

        <div className="mb-6">
          <label className={`block text-xs uppercase tracking-widest mb-3 font-mono ${
            isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
          }`}>Upload or Generated Image</label>
          <ImageUploader file={file} onFileSelected={handleFileSelected} isDark={isDark} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/20 text-rose-300 text-sm font-medium rounded-xl border border-rose-900/40">
            Error: {error}
          </div>
        )}

        {file && !result && (
          <button
            onClick={handleWatermark}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${
              isDark ? 'bg-[#a0543e] hover:bg-[#894430] text-[#f0f2f0]' : 'bg-[#e59a84] hover:bg-[#cf836d] text-[#f5f6f0]'
            }`}
          >
            {loading ? 'Processing...' : 'Embed Watermark'}
          </button>
        )}

        {result && (
          <div className={`mt-8 pt-8 border-t ${isDark ? 'border-[#7f9778]/10' : 'border-[#6f8368]/10'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className={`text-xs uppercase tracking-widest mb-3 text-center font-mono ${
                  isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
                }`}>Original (128x128)</h3>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#151e1b] border-[#7f9778]/10' : 'bg-[#e6e7df] border-[#6f8368]/10'
                } flex items-center justify-center`}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Original"
                    className="max-h-64 object-contain rounded-lg"
                  />
                </div>
              </div>
              <div>
                <h3 className={`text-xs uppercase tracking-widest mb-3 text-center font-mono ${
                  isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
                }`}>Watermarked (128x128)</h3>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#151e1b] border-[#7f9778]/10' : 'bg-[#e6e7df] border-[#6f8368]/10'
                } flex flex-col items-center justify-center`}>
                  <img
                    src={result.watermarkedImageUrl}
                    alt="Watermarked"
                    className="max-h-64 object-contain rounded-lg"
                  />
                  <a
                    href={result.watermarkedImageUrl}
                    download={`${method}_watermarked.png`}
                    className={`mt-5 inline-flex items-center justify-center px-5 py-2.5 border rounded-xl text-xs uppercase tracking-wider font-bold bg-transparent transition-colors ${
                      isDark 
                        ? 'border-[#7f9778]/30 text-[#7f9778] hover:bg-[#7f9778]/5' 
                        : 'border-[#6f8368]/30 text-[#6f8368] hover:bg-[#6f8368]/5'
                    }`}
                  >
                    Download Watermarked Image
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`p-8 rounded-2xl border transition-colors duration-200 ${
        isDark ? 'bg-[#212c29] border-[#7f9778]/15' : 'bg-[#f5f6f0] border-[#6f8368]/15'
      }`}>
        <h2 className="text-xl font-serif tracking-wide mb-6">3. Distortion & Attack Simulation</h2>
        
        {!result ? (
          <div className={`text-center py-10 font-light text-sm rounded-2xl border border-dashed ${
            isDark ? 'text-[#a3aca4]/50 bg-[#151e1b]/50 border-[#7f9778]/15' : 'text-[#5a6258]/50 bg-[#e6e7df]/50 border-[#6f8368]/15'
          }`}>
            Please upload or generate an image, then click "Embed Watermark" to enable attack simulations.
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className={`block text-xs uppercase tracking-widest mb-3 font-mono ${
                  isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
                }`}>Select Attack Type</label>
                <select
                  value={attackType}
                  onChange={(e) => handleAttackTypeChange(e.target.value)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-1 ${
                    isDark 
                      ? 'bg-[#151e1b] border-[#7f9778]/20 text-[#f0f2f0] focus:border-[#7f9778] focus:ring-[#7f9778]/30' 
                      : 'bg-[#e6e7df] border-[#6f8368]/20 text-[#1b1e1b] focus:border-[#6f8368] focus:ring-[#6f8368]/30'
                  }`}
                >
                  <option value="none">No Attack</option>
                  <option value="crop">Center Crop</option>
                  <option value="rotate">Rotation</option>
                  <option value="noise">Gaussian Noise</option>
                  <option value="blur">Gaussian Blur</option>
                  <option value="jpeg">JPEG Compression</option>
                </select>
              </div>

              {attackType !== 'none' && (
                <div className="md:col-span-2">
                  <div className={`flex justify-between text-xs uppercase tracking-widest mb-3 font-mono ${
                    isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
                  }`}>
                    <span>Distortion Intensity</span>
                    <span className={`font-bold ${isDark ? 'text-[#7f9778]' : 'text-[#6f8368]'}`}>{getIntensityLabel()}</span>
                  </div>
                  <input
                    type="range"
                    value={intensity}
                    onChange={(e) => { setIntensity(parseFloat(e.target.value)); setAttackResult(null); }}
                    {...getSliderParams()}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      isDark ? 'accent-[#7f9778] bg-[#151e1b]' : 'accent-[#6f8368] bg-[#e6e7df]'
                    }`}
                  />
                </div>
              )}
            </div>

            {attackError && (
              <div className="mb-6 p-4 bg-rose-950/20 text-rose-300 text-sm font-medium rounded-xl border border-rose-900/40">
                Error: {attackError}
              </div>
            )}

            <button
              onClick={handleSimulateAttack}
              disabled={attackLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${
                isDark ? 'bg-[#a0543e] hover:bg-[#894430] text-[#f0f2f0]' : 'bg-[#e59a84] hover:bg-[#cf836d] text-[#f5f6f0]'
              }`}
            >
              {attackLoading ? 'Applying Attack...' : 'Apply Attack'}
            </button>

            {attackResult && (
              <div className={`mt-8 pt-8 border-t flex flex-col items-center ${isDark ? 'border-[#7f9778]/10' : 'border-[#6f8368]/10'}`}>
                <h3 className={`text-xs uppercase tracking-widest mb-3 text-center font-mono ${
                  isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
                }`}>Attacked Image</h3>
                <div className={`p-3 rounded-xl border flex items-center justify-center max-w-sm w-full mb-6 ${
                  isDark ? 'bg-[#151e1b] border-[#7f9778]/10' : 'bg-[#e6e7df] border-[#6f8368]/10'
                }`}>
                  <img
                    src={attackResult.attackedImageUrl}
                    alt="Attacked"
                    className="max-h-64 object-contain rounded-lg"
                  />
                </div>
                <button
                  onClick={handleSendToDetector}
                  className={`px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                    isDark ? 'bg-[#a0543e] hover:bg-[#894430] text-[#f0f2f0] shadow-[#a0543e]/10' : 'bg-[#e59a84] hover:bg-[#cf836d] text-[#f5f6f0] shadow-[#e59a84]/10'
                  }`}
                >
                  Send to Detector for Testing
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
