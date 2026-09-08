import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { AuthContext } from './auth'

export function AuthProvider({ children }) {
  const [sessionState, setSessionState] = useState({ user: null, ready: false, error: '' })
  const [profileState, setProfileState] = useState({ id: null, data: null, error: '' })
  const [revision, setRevision] = useState(0)
  const user = sessionState.user
  const refreshProfile = useCallback(() => setRevision(value => value + 1), [])

  useEffect(() => {
    let active = true
    let receivedEvent = false
    // This callback must stay synchronous; database calls here can deadlock auth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      receivedEvent = true
      if (!active) return
      setSessionState({ user: session?.user ?? null, ready: true, error: '' })
      if (!session) setProfileState({ id: null, data: null, error: '' })
      if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/reset-password') window.location.replace('/reset-password')
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !receivedEvent) setSessionState({ user: data?.session?.user ?? null, ready: true, error: error?.message || '' })
    }).catch(error => {
      if (active) setSessionState({ user: null, ready: true, error: error.message })
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!user) return
    window.addEventListener('focus', refreshProfile)
    const timer = setInterval(refreshProfile, 60000)
    return () => { clearInterval(timer); window.removeEventListener('focus', refreshProfile) }
  }, [user, refreshProfile])

  useEffect(() => {
    let active = true
    if (!user?.id) return
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data, error }) => {
      if (active) setProfileState({ id: user.id, data, error: error?.message || '' })
    }).catch(error => {
      if (active) setProfileState({ id: user.id, data: null, error: error.message })
    })
    return () => { active = false }
  }, [user?.id, revision])

  const profile = user && profileState.id === user.id ? profileState.data : null
  const loading = !sessionState.ready || Boolean(user && profileState.id !== user.id)
  const signOut = async () => {
    if (!window.confirm('Are you sure you want to log out?')) return
    const { error } = await supabase.auth.signOut()
    if (error) { window.alert('Could not sign out. Please try again.'); return }
    window.location.assign('/')
  }

  return <AuthContext.Provider value={{ user, profile, loading, refreshProfile,
    profileError: profileState.id === user?.id ? profileState.error : '', sessionError: sessionState.error,
    role: profile?.role, signOut,
    signUp: (email, password, metadata) => supabase.auth.signUp({ email: email.trim(), password, options: { data: metadata, emailRedirectTo: window.location.origin + '/login' } }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email: email.trim(), password }),
  }}>{children}</AuthContext.Provider>
}

