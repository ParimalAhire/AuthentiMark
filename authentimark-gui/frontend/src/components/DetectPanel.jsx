import { useState } from 'react'
import ImageUploader from './ImageUploader'
import VerdictBadge from './VerdictBadge'
import { detectWatermark } from '../api'

export default function DetectPanel({
  file,
  setFile,
  result,
  setResult,
  error,
  setError,
  isDark
}) {
  const [loading, setLoading] = useState(false)

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile)
  }

  const handleDetect = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await detectWatermark(file)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`p-8 rounded-2xl border transition-colors duration-200 shadow-lg max-w-xl mx-auto ${
      isDark ? 'bg-[#212c29] border-[#7f9778]/15 text-[#f0f2f0]' : 'bg-[#f5f6f0] border-[#6f8368]/15 text-[#1b1e1b]'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif tracking-wide">Check for a watermark</h2>
        <span className={`text-[10px] uppercase tracking-widest font-mono border px-2.5 py-0.5 rounded-lg ${
          isDark ? 'border-[#7f9778]/30 text-[#7f9778]' : 'border-[#6f8368]/30 text-[#6f8368]'
        }`}>ViT / 2-class</span>
      </div>

      <p className={`text-xs font-light mb-6 leading-relaxed ${
        isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
      }`}>
        Run the trained detector against any image. Results below the confidence threshold stay explicitly uncertain.
      </p>

      <div className="mb-6">
        <label className={`block text-xs uppercase tracking-widest mb-3 font-mono ${
          isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
        }`}>Upload Image to Analyze</label>
        <ImageUploader file={file} onFileSelected={handleFileSelected} isDark={isDark} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-950/20 text-rose-300 text-sm font-medium rounded-xl border border-rose-900/40">
          Error: {error}
        </div>
      )}

      {file && (
        <button
          onClick={handleDetect}
          disabled={loading}
          className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-md ${
            isDark ? 'bg-[#546660] hover:bg-[#43524c] text-[#f0f2f0] shadow-[#546660]/10' : 'bg-[#798c84] hover:bg-[#63736c] text-[#f5f6f0] shadow-[#798c84]/10'
          }`}
        >
          {loading ? 'Analyzing...' : 'Check for watermark'}
        </button>
      )}

      {result && (
        <div className={`mt-8 pt-8 border-t ${isDark ? 'border-[#7f9778]/10' : 'border-[#6f8368]/10'}`}>
          <VerdictBadge verdict={result.verdict} confidence={result.confidence} isDark={isDark} />
        </div>
      )}
    </div>
  )
}
