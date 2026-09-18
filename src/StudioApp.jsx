import { useEffect, useState } from 'react'
import App from './App.jsx'
import AuthPage from './components/AuthPage.jsx'
import StudentDashboard from './components/StudentDashboard.jsx'
import StudentTransition from './components/StudentTransition.jsx'
import { supabase } from './lib/supabase.js'

const authRoutes = new Set(['entrar', 'primeiro-acesso', 'recuperar-senha', 'minha-conta'])
const dashboardRoutes = new Set(['transicao-aluno', 'aluno'])

function readLocation() {
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.slice(1))
  const callback = url.searchParams.get('auth')
  const route = authRoutes.has(callback) ? callback : url.hash.slice(1)
  const resolvedRoute = authRoutes.has(route) ? route : dashboardRoutes.has(route) ? route : 'home'
  return {
    route: resolvedRoute,
    callback: Boolean(callback),
    error: hash.get('error_code') || url.searchParams.get('error_code') || (hash.has('error') ? 'access_denied' : ''),
  }
}

export default function StudioApp() {
  const [location, setLocation] = useState(readLocation)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState(null)

  useEffect(() => {
    const onLocationChange = () => setLocation(readLocation())
    window.addEventListener('hashchange', onLocationChange)
    window.addEventListener('popstate', onLocationChange)
    let mounted = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') {
        setLocation({ route: 'recuperar-senha', callback: true, error: '' })
      }
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      setSession(data.session)
      setSessionError(error)
      setLoading(false)
    }).catch((error) => {
      if (!mounted) return
      setSessionError(error)
      setLoading(false)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener('hashchange', onLocationChange)
      window.removeEventListener('popstate', onLocationChange)
    }
  }, [])

  const navigate = (route) => {
    const url = new URL(window.location.href)
    url.searchParams.delete('auth')
    url.searchParams.delete('error')
    url.searchParams.delete('error_code')
    url.searchParams.delete('error_description')
    url.hash = route
    window.history.pushState({}, '', url)
    setLocation(readLocation())
    setSessionError(null)
    window.scrollTo(0, 0)
  }

  if (location.route === 'home') return <App session={session} />
  if (location.route === 'transicao-aluno') return <StudentTransition navigate={navigate} />
  if (location.route === 'aluno') return <StudentDashboard session={session} navigate={navigate} />

  return (
    <AuthPage
      key={location.route}
      mode={location.route === 'minha-conta' ? 'entrar' : location.route}
      session={session}
      loading={loading}
      callback={location.callback}
      initialError={location.error ? { code: location.error } : sessionError}
      navigate={navigate}
    />
  )
}
