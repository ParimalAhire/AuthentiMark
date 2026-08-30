import { useEffect, useState } from 'react'
import { useWorkspace } from './lib/workspace'
import Embed from './sections/Embed'
import Examine from './sections/Examine'
import Attack from './sections/Attack'
import Compare from './sections/Compare'

const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)

const SECTIONS = [
  {
    id: 'embed', label: 'Embed', blurb: 'Write an invisible watermark into an image',
    icon: <Icon d={<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>} />
  },
  {
    id: 'examine', label: 'Examine', blurb: 'Read whether a watermark is present',
    icon: <Icon d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />
  },
  {
    id: 'attack', label: 'Attack', blurb: 'Degrade the image and watch the watermark signal fall',
    icon: <Icon d={<><path d="M14.5 3.5 3.5 14.5 M9.5 3.5l11 11" /><path d="M12 8 8 12l4 4 4-4Z" /></>} />
  },
  {
    id: 'compare', label: 'Compare', blurb: 'AE vs VAE — quality and robustness, side by side',
    icon: <Icon d={<><path d="M5 21V9M12 21V4M19 21v-8" /></>} />
  }
]

function SpecimenStrip() {
  const { source, marks } = useWorkspace()
  const items = [
    source && { k: 'src', tag: 'SRC', url: source.url, dot: null },
    marks.ae && { k: 'ae', tag: 'AE', url: marks.ae.url, dot: 'var(--trace)' },
    marks.vae && { k: 'vae', tag: 'VAE', url: marks.vae.url, dot: 'var(--signal)' }
  ].filter(Boolean)

  if (items.length === 0) {
    return <p className="tag px-1 leading-relaxed">No image loaded yet</p>
  }
  return (
    <div className="flex lg:flex-col gap-2">
      {items.map((it) => (
        <div key={it.k} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md overflow-hidden border border-[var(--line-2)] shrink-0">
            <img src={it.url} alt={`${it.tag} image thumbnail`} className="w-full h-full object-cover" />
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center gap-1.5">
              {it.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: it.dot }} />}
              <span className="tag">{it.tag}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Console({ section, setSection, toSite }) {
  const meta = SECTIONS.find((s) => s.id === section) || SECTIONS[0]
  const { marks, timeline } = useWorkspace()
  const [online, setOnline] = useState(null)

  useEffect(() => {
    window.history.replaceState(null, '', `#/${section}`)
  }, [section])

  useEffect(() => {
    let alive = true
    fetch('http://localhost:8000/health')
      .then((r) => r.json())
      .then((d) => alive && setOnline(d.status === 'ok'))
      .catch(() => alive && setOnline(false))
    return () => { alive = false }
  }, [])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative z-10">
      {/* rail */}
      <aside className="lg:w-[210px] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--line)] bg-[var(--panel)]/70 backdrop-blur-sm sticky top-0 z-30 lg:h-screen">
        <div className="px-3 py-2.5 lg:p-5 flex lg:flex-col gap-2 lg:gap-6 w-full items-center lg:items-stretch">
          <button onClick={toSite} className="flex items-center gap-2 shrink-0" aria-label="Back to landing page">
            <span className="w-5 h-5 rounded-md" style={{ background: 'linear-gradient(135deg, var(--trace), var(--signal))' }} />
            <span className="display-wide text-[13px] hidden lg:block">AuthentiMark</span>
          </button>

          <nav className="flex lg:flex-col gap-1 flex-1 lg:overflow-visible overflow-x-auto no-scrollbar">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className="rail-item shrink-0 !px-3 !py-2 lg:!px-3.5 lg:!py-3 text-[10px] lg:text-[11px]"
                data-on={section === s.id}
                onClick={() => setSection(s.id)}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden lg:block pt-5 border-t border-[var(--line)]">
            <p className="tag mb-3">Workspace</p>
            <SpecimenStrip />
          </div>

          <button onClick={toSite} className="tag hidden lg:block hover:text-filament text-left" style={{ background: 'none', border: 0, cursor: 'pointer' }}>
            ← Back to site
          </button>
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        <div className="flex-1 p-5 sm:p-8 lg:p-12 max-w-[1180px] w-full">
          <header className="mb-8">
            <p className="tag mb-2">Console · {String(SECTIONS.findIndex((s) => s.id === section) + 1).padStart(2, '0')} / 04</p>
            <h1 className="display-xl text-[clamp(2.2rem,5vw,3.4rem)]">{meta.label}</h1>
            <p className="text-mute text-[14px] mt-2">{meta.blurb}</p>
          </header>

          {section === 'embed' && <Embed go={setSection} />}
          {section === 'examine' && <Examine go={setSection} />}
          {section === 'attack' && <Attack go={setSection} />}
          {section === 'compare' && <Compare go={setSection} />}
        </div>

        <footer className="border-t border-[var(--line)] px-5 sm:px-8 lg:px-12 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 readout text-[10px] text-mute">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: online == null ? 'var(--mute)' : online ? 'var(--signal)' : 'var(--break)' }}
            />
            {online == null ? 'connecting' : online ? 'backend online' : 'backend offline'}
          </span>
          <span>AE {marks.ae ? '✓' : '—'}</span>
          <span>VAE {marks.vae ? '✓' : '—'}</span>
          <span>{timeline.length} detection{timeline.length === 1 ? '' : 's'} logged</span>
          <span className="ml-auto">inference only · no data leaves this machine</span>
        </footer>
      </main>
    </div>
  )
}
