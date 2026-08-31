import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const WorkspaceContext = createContext(null)
export const useWorkspace = () => useContext(WorkspaceContext)

export function base64ToFile(dataUrl, name) {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)[1]
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i)
  return new File([arr], name, { type: mime })
}

export function WorkspaceProvider({ children }) {
  // the image the user brought in
  const [source, setSource] = useState(null) // { file, url, name }
  // watermarking results, keyed by method
  const [marks, setMarks] = useState({ ae: null, vae: null }) // { url, file, psnr, ssim, bits }
  // last Examine run
  const [examine, setExamine] = useState(null) // { url, name, prediction, confidence, verdict }
  // Attack Simulation timeline — persists across sections
  const [timeline, setTimeline] = useState([]) // [{ id, label, target, confidence, verdict, attacks }]

  const loadSource = useCallback((file) => {
    setSource((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return { file, url: URL.createObjectURL(file), name: file.name }
    })
    setMarks({ ae: null, vae: null })
  }, [])

  const setMark = useCallback((method, data) => {
    setMarks((prev) => ({ ...prev, [method]: data }))
  }, [])

  const pushTimeline = useCallback((entry) => {
    setTimeline((prev) => [{ ...entry, id: prev.length + 1 }, ...prev].slice(0, 40))
  }, [])

  const clearTimeline = useCallback(() => setTimeline([]), [])

  const resetWorkspace = useCallback(() => {
    setSource((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
    setMarks({ ae: null, vae: null })
    setExamine(null)
  }, [])

  const value = useMemo(
    () => ({ source, loadSource, marks, setMark, setMarks, examine, setExamine, timeline, pushTimeline, clearTimeline, resetWorkspace }),
    [source, loadSource, marks, setMark, examine, timeline, pushTimeline, clearTimeline, resetWorkspace]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
