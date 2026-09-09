import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../lib/data'
export function useQuery(loader, initial = null, interval = 0, { refreshOnFocus = true } = {}) {
  const [state, setState] = useState({ data: initial, loading: true, error: '', loader: null })
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion(value => value + 1), [])
  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const data = await loader()
        if (!cancelled) setState({ data, loading: false, error: '', loader })
      } catch (error) {
        if (!cancelled) setState(previous => ({ ...previous, loading: false, error: errorMessage(error), loader }))
      }
    }
    run()
    const timer = interval ? setInterval(() => { if (!document.hidden) refresh() }, interval) : null
    if (refreshOnFocus) window.addEventListener('focus', refresh)
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [loader, version, interval, refresh, refreshOnFocus])
  return { ...state, data: state.loader === loader ? state.data : initial, loading: state.loader !== loader || state.loading, error: state.loader === loader ? state.error : '', refresh }
}
