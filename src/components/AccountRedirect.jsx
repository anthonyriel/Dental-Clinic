import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { Loader2 } from 'lucide-react'

export default function AccountRedirect() {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#67c4c7]" />
        <p role="status" className="text-sm font-medium text-slate-500">Redirecting your account...</p>
      </div>
    )
  }

  return <Navigate to={role === 'client' ? '/dashboard' : '/management'} replace />
}