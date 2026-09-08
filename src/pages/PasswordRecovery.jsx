import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/auth'
import Feedback from '../components/Feedback'
import { KeyRound, Mail, Lock, ShieldCheck } from 'lucide-react'

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8 selection:bg-[#67c4c7]/30">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6 text-left">
        
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-[#67c4c7]/10 text-[#67c4c7] flex items-center justify-center border border-[#67c4c7]/20 mb-4">
            <KeyRound size={20} strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {reset ? 'Set a new password' : 'Forgot password'}
          </h1>
          <p className="text-sm text-slate-500 font-normal">
            {reset ? 'Enter your new secure password below.' : 'Enter your email address and we’ll send you a recovery link.'}
          </p>
        </div>

        <Feedback error={error} message={message} />

        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Loading account...</p>
        ) : reset && !user ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              Your reset link is missing or expired.{' '}
              <Link className="text-[#67c4c7] font-bold underline" to="/forgot-password">Request a new link.</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {reset ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
                    <input 
                      autoComplete="new-password" 
                      type="password" 
                      required 
                      minLength={8} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="w-full pl-11 pr-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono" 
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
                    <input 
                      autoComplete="new-password" 
                      type="password" 
                      required 
                      minLength={8} 
                      value={confirm} 
                      onChange={e => setConfirm(e.target.value)} 
                      className="w-full pl-11 pr-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono" 
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    required 
                    autoComplete="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full pl-11 pr-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition" 
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

            <button 
              disabled={busy} 
              className="w-full py-3.5 bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 text-sm"
            >
              {busy ? 'Submitting...' : reset ? 'Update password' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link className="text-xs font-bold text-[#67c4c7] hover:underline" to={user ? '/account' : '/login'}>
            Return to {user ? 'account' : 'login'}
          </Link>
        </div>
      </div>
    </div>
  )
}