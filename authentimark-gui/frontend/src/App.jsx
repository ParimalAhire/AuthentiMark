import { useState } from 'react'
import WatermarkPanel from './components/WatermarkPanel'
import DetectPanel from './components/DetectPanel'

export default function App() {
  const [activeTab, setActiveTab] = useState('embed')
  const [isDark, setIsDark] = useState(true)
  const [detectFile, setDetectFile] = useState(null)
  const [detectResult, setDetectResult] = useState(null)
  const [detectError, setDetectError] = useState(null)

  const handleSetDetectFile = (file) => {
    setDetectFile(file)
    setDetectResult(null)
    setDetectError(null)
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col font-sans ${
      isDark ? 'bg-[#151e1b] text-[#f0f2f0]' : 'bg-[#e6e7df] text-[#1b1e1b]'
    }`}>
      <header className={`border-b py-8 px-8 transition-colors duration-200 ${
        isDark ? 'border-[#f0f2f0]/10' : 'border-[#1b1e1b]/10'
      }`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-serif text-2xl font-light tracking-tight shadow-md transition-colors duration-200 ${
              isDark ? 'border-[#7f9778]/50 bg-[#212c29] text-[#7f9778]' : 'border-[#6f8368]/50 bg-[#f5f6f0] text-[#6f8368]'
            }`}>
              A
            </div>
            <div>
              <h1 className="text-xl font-serif tracking-wide">AuthentiMark</h1>
              <p className={`text-[10px] uppercase tracking-widest mt-0.5 font-mono ${
                isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
              }`}>Neural Watermarking Studio</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className={`text-[10px] uppercase tracking-widest font-mono font-bold ${
                isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
              }`}>Inference Only</span>
            </div>
            
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                isDark 
                  ? 'border-[#f0f2f0]/20 text-[#f0f2f0] hover:bg-[#f0f2f0]/5' 
                  : 'border-[#1b1e1b]/20 text-[#1b1e1b] hover:bg-[#1b1e1b]/5'
              }`}
            >
              {isDark ? 'Light ☼' : 'Dark ☾'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 px-6 max-w-6xl w-full mx-auto flex flex-col">
        <div className="mb-12">
          <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#e55f3c]">
            Image Provenance / 2026
          </span>
          <h2 className={`text-5xl font-sans font-medium tracking-tight mt-4 leading-tight max-w-2xl ${
            isDark ? 'text-[#f0f2f0]' : 'text-[#1b1e1b]'
          }`}>
            Make a mark.<br />
            Know what you're seeing.
          </h2>
          <p className={`mt-5 text-sm font-light max-w-xl leading-relaxed ${
            isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
          }`}>
            Embed a resilient signal with a trained autoencoder, then inspect it with the companion vision detector.
          </p>
        </div>

        <div className="flex justify-start mb-8">
          <div className={`flex p-1.5 rounded-2xl border transition-colors duration-200 ${
            isDark ? 'bg-[#212c29] border-[#7f9778]/10' : 'bg-[#f5f6f0] border-[#6f8368]/10'
          }`}>
            <button
              onClick={() => setActiveTab('embed')}
              className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === 'embed'
                  ? isDark
                    ? 'bg-[#7f9778] text-[#151e1b] shadow-md shadow-[#7f9778]/10'
                    : 'bg-[#6f8368] text-[#f5f6f0] shadow-md shadow-[#6f8368]/10'
                  : isDark
                    ? 'text-[#a3aca4] hover:text-[#f0f2f0]'
                    : 'text-[#5a6258] hover:text-[#1b1e1b]'
              }`}
            >
              01 / Embed
            </button>
            <button
              onClick={() => setActiveTab('detect')}
              className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === 'detect'
                  ? isDark
                    ? 'bg-[#7f9778] text-[#151e1b] shadow-md shadow-[#7f9778]/10'
                    : 'bg-[#6f8368] text-[#f5f6f0] shadow-md shadow-[#6f8368]/10'
                  : isDark
                    ? 'text-[#a3aca4] hover:text-[#f0f2f0]'
                    : 'text-[#5a6258] hover:text-[#1b1e1b]'
              }`}
            >
              02 / Inspect
            </button>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'embed' ? (
            <WatermarkPanel
              isDark={isDark}
              setActiveTab={setActiveTab}
              setDetectFile={handleSetDetectFile}
            />
          ) : (
            <DetectPanel
              isDark={isDark}
              file={detectFile}
              setFile={handleSetDetectFile}
              result={detectResult}
              setResult={setDetectResult}
              error={detectError}
              setError={setDetectError}
            />
          )}
        </div>
      </main>

      <footer className={`py-8 text-center text-[10px] uppercase tracking-widest font-mono transition-colors duration-200 border-t ${
        isDark 
          ? 'bg-[#151e1b] border-[#f0f2f0]/10 text-[#a3aca4]/30' 
          : 'bg-[#e6e7df] border-[#1b1e1b]/10 text-[#5a6258]/40'
      }`}>
        &copy; {new Date().getFullYear()} AuthentiMark Digital Content Watermarking System
      </footer>
    </div>
  )
}
