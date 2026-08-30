import { useState, useEffect } from 'react'
import { WorkspaceProvider } from './lib/workspace'
import Landing from './Landing'
import Console from './Console'

const SECTION_IDS = ['embed', 'examine', 'attack', 'compare']

function readHash() {
  const h = window.location.hash.replace(/^#\/?/, '')
  if (SECTION_IDS.includes(h)) return { view: 'console', section: h }
  return { view: 'landing', section: 'embed' }
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

  const enter = () => {
    window.history.pushState(null, '', '#/embed')
    setState({ view: 'console', section: 'embed' })
    window.scrollTo(0, 0)
  }
  const toSite = () => {
    window.history.pushState(null, '', '#/')
    setState({ view: 'landing', section: 'embed' })
    window.scrollTo(0, 0)
  }
  const setSection = (s) => setState({ view: 'console', section: s })

  return (
    <WorkspaceProvider>
      <div className="relative min-h-screen">
        <div className="grid-floor" aria-hidden="true" />
        <div className="glow-floor" aria-hidden="true" />
        {view === 'landing'
          ? <Landing enter={enter} />
          : <Console section={section} setSection={setSection} toSite={toSite} />}
      </div>
    </WorkspaceProvider>
  )
}
