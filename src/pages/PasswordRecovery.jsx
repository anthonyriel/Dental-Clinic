import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/auth'
import Feedback from '../components/Feedback'

export default function PasswordRecovery({ reset = false }) {
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (busy) return
    if (reset && password !== confirm) { setError('Passwords do not match.'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const { error: failure } = reset
        ? await supabase.auth.updateUser({ password })
        : await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/reset-password' })
      if (failure) throw failure
      setMessage(reset ? 'Password updated. You can return to your account.' : 'If this email has an account, a password reset link will be sent. Check your inbox and spam folder.')
      setPassword(''); setConfirm('')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <div className="recovery-form auth-form mx-auto space-y-4">
    <h1 className="text-2xl font-bold">{reset ? 'Set a new password' : 'Forgot password'}</h1><Feedback error={error} message={message} />
    {loading ? <p>Loading account...</p> : reset && !user ? <p>Your reset link is missing or expired. <Link className="underline" to="/forgot-password">Request a new link.</Link></p> : <form onSubmit={submit} className="space-y-4">
      {reset ? <><label className="block">New password<input autoComplete="new-password" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="block border rounded-lg p-3 w-full" /></label><label className="block">Confirm password<input autoComplete="new-password" type="password" required minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)} className="block border rounded-lg p-3 w-full" /></label></> : <label className="block">Email<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="block border rounded-lg p-3 w-full" /></label>}
      <button disabled={busy} className="p-3 bg-sky-600 text-white rounded-lg w-full">{busy ? 'Submitting...' : reset ? 'Update password' : 'Send reset link'}</button>
    </form>}
    <Link className="underline text-sm" to={user ? '/account' : '/login'}>Return to {user ? 'account' : 'login'}</Link>
  </div>
}
