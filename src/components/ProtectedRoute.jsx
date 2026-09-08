import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading, profileError, refreshProfile, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#67c4c7]" />
        <p role="status" className="text-sm font-medium text-slate-500">Loading your account...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (profileError || !profile || !['client', 'staff', 'admin', 'owner'].includes(profile.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div role="alert" className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-8 rounded-3xl shadow-xl max-w-md w-full space-y-6 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">Profile Loading Error</h2>
            <p className="text-sm text-slate-600 font-normal leading-relaxed">
              We could not load your account profile. Please retry or contact the clinic.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={refreshProfile}
              className="flex-1 py-3 bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold rounded-xl transition shadow-md text-sm"
            >
              Retry
            </button>
            <button 
              onClick={signOut}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (profile.is_active === false) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div role="alert" className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-8 rounded-3xl shadow-xl max-w-md w-full space-y-6 text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">Account Inactive</h2>
            <p className="text-sm text-slate-600 font-normal leading-relaxed">
              This account is inactive. Contact the clinic for assistance.
            </p>
          </div>
          <div className="pt-2">
            <button 
              onClick={signOut}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-md text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={profile.role === 'client' ? '/dashboard' : '/management'} replace />
  }

  return children
}