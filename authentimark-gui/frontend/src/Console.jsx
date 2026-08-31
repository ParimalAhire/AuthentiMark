import { useEffect, useState } from 'react'
import { useWorkspace } from './lib/workspace'
import Embed from './sections/Embed'
import Examine from './sections/Examine'
import Attack from './sections/Attack'
import ModelsDetails from './sections/ModelsDetails'

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
    id: 'models', label: 'Model Details', blurb: 'View performance specifications, training curves, and analysis metrics',
    icon: <Icon d={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></>} />
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

export default function Console({ section, setSection }) {
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
      <aside className="lg:w-[210px] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--line)] bg-[var(--panel)] sticky top-0 z-30 lg:h-screen">
        <div className="px-3 py-2.5 lg:p-5 flex lg:flex-col gap-2 lg:gap-6 w-full items-center lg:items-stretch">
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <svg className="w-5 h-5 text-[var(--trace)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span className="font-display font-black text-[13px] tracking-[0.16em] uppercase hidden lg:block" style={{ color: 'var(--filament)' }}>AuthentiMark</span>
          </div>

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
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        <div className="flex-1 p-5 sm:p-8 lg:p-12 max-w-[1000px] w-full mx-auto">
          <header className="mb-8">
            <p className="tag mb-2">Console · {String(SECTIONS.findIndex((s) => s.id === section) + 1).padStart(2, '0')} / 04</p>
            <h1 className="display-xl text-[clamp(2.2rem,5vw,3.4rem)]">{meta.label}</h1>
            <p className="text-mute text-[14px] mt-2">{meta.blurb}</p>
          </header>

          {section === 'embed' && <Embed go={setSection} />}
          {section === 'examine' && <Examine go={setSection} />}
          {section === 'attack' && <Attack go={setSection} />}
          {section === 'models' && <ModelsDetails />}
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
