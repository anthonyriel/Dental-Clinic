import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading, profileError, refreshProfile, signOut } = useAuth()
  if (loading) return <p role="status" className="p-8 text-center">Loading your account...</p>
  if (!user) return <Navigate to="/login" replace />
  if (profileError || !profile || !['client', 'staff', 'admin', 'owner'].includes(profile.role)) {
    return <div role="alert" className="p-8 space-y-4 text-center"><p>We could not load your account profile. Please retry or contact the clinic.</p><button onClick={refreshProfile}>Retry</button><button className="ml-4" onClick={signOut}>Sign out</button></div>
  }
  if (profile.is_active === false) return <div role="alert" className="p-8 text-center"><p>This account is inactive. Contact the clinic for assistance.</p><button onClick={signOut}>Sign out</button></div>
  if (allowedRoles && !allowedRoles.includes(profile.role)) return <Navigate to={profile.role === 'client' ? '/dashboard' : '/management'} replace />
  return children
}

