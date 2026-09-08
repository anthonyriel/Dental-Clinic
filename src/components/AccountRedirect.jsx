import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
export default function AccountRedirect() {
  const { role } = useAuth()
  return <Navigate to={role === 'client' ? '/dashboard' : '/management'} replace />
}
