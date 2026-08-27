export default function VerdictBadge({ verdict, confidence, isDark }) {
  let bgColor = 'bg-slate-900/40 text-slate-400 border-slate-800'
  let label = 'Unknown'

  if (verdict === 'Likely watermarked') {
    bgColor = 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
    label = 'Likely Watermarked'
  } else if (verdict === 'Likely not watermarked') {
    bgColor = 'bg-slate-900/40 text-slate-300 border-slate-800/40'
    label = 'Likely Not Watermarked'
  } else if (verdict === 'Uncertain -- do not treat as definitive proof') {
    bgColor = 'bg-amber-950/30 text-amber-400 border-amber-800/40'
    label = 'Uncertain (Low Confidence)'
  }

  return (
    <div className={`flex flex-col items-center p-8 rounded-2xl border shadow-lg max-w-md w-full mx-auto transition-colors duration-200 ${
      isDark ? 'bg-[#212c29] border-[#7f9778]/15 text-[#f0f2f0]' : 'bg-[#f5f6f0] border-[#6f8368]/15 text-[#1b1e1b]'
    }`}>
      <h4 className={`text-xs uppercase tracking-widest mb-4 font-mono ${
        isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
      }`}>Detection Verdict</h4>
      <span className={`inline-flex items-center px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-bold border ${bgColor} text-center mb-6`}>
        {label}
      </span>
      <div className={`w-full rounded-full h-2 mb-3 overflow-hidden border ${
        isDark ? 'bg-[#151e1b] border-[#7f9778]/5' : 'bg-[#e6e7df] border-[#6f8368]/5'
      }`}>
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            verdict === 'Likely watermarked'
              ? 'bg-emerald-500'
              : verdict === 'Likely not watermarked'
              ? 'bg-slate-500'
              : 'bg-amber-500'
          }`}
          style={{ width: `${(confidence * 100).toFixed(1)}%` }}
        ></div>
      </div>
      <div className={`flex justify-between w-full text-xs font-mono ${
        isDark ? 'text-[#a3aca4]' : 'text-[#5a6258]'
      }`}>
        <span>Confidence Score</span>
        <span>{(confidence * 100).toFixed(1)}%</span>
      </div>
      {verdict === 'Uncertain -- do not treat as definitive proof' && (
        <div className={`mt-6 p-4 text-xs rounded-xl border leading-relaxed ${
          isDark 
            ? 'bg-[#151e1b] text-amber-200/70 border-amber-950/50' 
            : 'bg-[#e6e7df] text-amber-900/70 border-amber-900/30'
        }`}>
          <strong className={`${isDark ? 'text-amber-400' : 'text-amber-700'} block mb-1`}>Ethical Safeguard Notification:</strong> The detector is not sufficiently confident in this classification. Do not rely on this result as definitive proof of a watermark presence or absence.
        </div>
      )}
    </div>
  )
}
