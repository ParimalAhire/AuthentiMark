import { useState, useRef } from 'react'

export default function Dropzone({ onFile, title = 'Load an image', hint = 'PNG or JPG, up to 10MB', compact = false }) {
  const [drag, setDrag] = useState(false)
  const [rejected, setRejected] = useState(false)
  const input = useRef(null)

  const accept = (f) => {
    setRejected(false)
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setRejected(true)
      return
    }
    onFile(f)
  }

  return (
    <div
      className={`drop flex flex-col items-center justify-center text-center ${compact ? 'p-5' : 'p-10'}`}
      data-drag={drag}
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={() => input.current.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current.click()}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true) }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={(e) => { e.preventDefault(); setDrag(false) }}
      onDrop={(e) => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files?.[0]) }}
    >
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => accept(e.target.files?.[0])} />
      <svg className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} mb-3 text-trace`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4m0 0-4 4m4-4 4 4" />
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      <p className="font-medium text-[14px]">
        {drag ? 'Drop to load' : title}
      </p>
      <p className="tag mt-1.5">{rejected ? 'That was not an image — try a PNG or JPG' : hint}</p>
    </div>
  )
}
