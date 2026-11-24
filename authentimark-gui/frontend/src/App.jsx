import { useState, useEffect } from 'react'
import { WorkspaceProvider } from './lib/workspace'
import Console from './Console'

const SECTION_IDS = ['embed', 'examine', 'attack', 'models']

function readHash() {
  const h = window.location.hash.replace(/^#\/?/, '')
  if (SECTION_IDS.includes(h)) return { view: 'console', section: h }
  return { view: 'console', section: 'embed' }
}

export default function App() {
  const [{ view, section }, setState] = useState(readHash)

  useEffect(() => {
    const onPop = () => setState(readHash())
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('hashchange', onPop)
    }
  }, [])

  const setSection = (s) => setState({ view: 'console', section: s })

  return (
    <WorkspaceProvider>
      <div className="relative min-h-screen">
        <div className="grid-floor" aria-hidden="true" />
        <div className="glow-floor" aria-hidden="true" />
        <Console section={section} setSection={setSection} />
      </div>
    </WorkspaceProvider>
  )
}
