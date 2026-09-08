import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { Lock, Mail, AlertCircle, Heart } from 'lucide-react'
import { bookingDestination } from '../lib/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = bookingDestination(params.get('next'))

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: signError } = await signIn(email, password)
      if (signError) throw signError

      const loggedUser = data?.user
      if (!loggedUser) throw new Error('Authentication failed.')

      navigate(next || '/account', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8 selection:bg-[#67c4c7]/30">
      <div className="max-w-5xl w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Story / Branding Section */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between space-y-8 relative overflow-hidden">
          <div className="space-y-4 relative z-10 text-left">
            <span className="text-[10px] font-bold tracking-widest text-[#67c4c7] uppercase">WELCOME TO YOUR SMILE SPACE</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Good to<br />see you <span className="italic font-serif text-[#67c4c7]">again.</span>
            </h1>
            <p className="text-slate-300 text-sm font-normal leading-relaxed">
              Your next visit, your appointment updates, and a little peace of mind. Sign in to make time for your smile.
            </p>
          </div>
          
          <div className="flex items-center gap-3 relative z-10 text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-[#67c4c7]/20 text-[#67c4c7] flex items-center justify-center shrink-0 border border-[#67c4c7]/30">
              <Heart size={18} strokeWidth={1.8}/>
            </div>
            <span>Personal care, every step of the way.</span>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div className="text-left space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Welcome Back</h2>
            <p className="text-sm text-slate-500 font-normal">Sign in to manage your appointments</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm flex items-center gap-3 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none transition bg-slate-50/50 text-slate-900"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-[#67c4c7] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none transition bg-slate-50/50 text-slate-900 font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 text-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 font-normal pt-2">
            Don't have an account?{' '}
            <Link to={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'} className="text-[#67c4c7] font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}