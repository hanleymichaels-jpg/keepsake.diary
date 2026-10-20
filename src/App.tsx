import { useEffect, useState } from 'react'
import { Home } from './screens/Home'
import { Editor } from './screens/Editor'
import { Memory } from './screens/Memory'
import { Settings } from './screens/Settings'
import { Icons } from './screens/Icons'

export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'edit'; id: string }
  | { name: 'show'; id: string }
  | { name: 'memory'; id: string }
  | { name: 'settings' }
  | { name: 'icons' }

function parse(hash: string): Route {
  const [name, id] = hash.replace(/^#\/?/, '').split('/')
  if ((name === 'edit' || name === 'memory' || name === 'show') && id) return { name, id }
  if (name === 'new' || name === 'settings' || name === 'icons') return { name }
  return { name: 'home' }
}

export const go = (to: string) => {
  location.hash = to
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parse(location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parse(location.hash))
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])

  switch (route.name) {
    case 'new':
      return <Editor key="new" />
    case 'show':
      return <Editor key={route.id} id={route.id} fresh />
    case 'edit':
      return <Editor key={route.id} id={route.id} />
    case 'memory':
      return <Memory key={route.id} id={route.id} />
    case 'settings':
      return <Settings />
    case 'icons':
      return <Icons />
    default:
      return <Home />
  }
}
