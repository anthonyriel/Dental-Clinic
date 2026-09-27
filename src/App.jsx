import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PublicLayout from './layouts/PublicLayout'
import AuthLayout from './layouts/AuthLayout'
import ClientLayout from './layouts/ClientLayout'
import ManagementLayout from './layouts/ManagementLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PageBoundary from './components/PageBoundary'

const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))

const ClientHome = lazy(() => import('./pages/patient/ClientHome'))
const BookAppointment = lazy(() => import('./pages/patient/BookAppointment'))
const AppointmentHistory = lazy(() => import('./pages/patient/AppointmentHistory'))
const ManageProfile = lazy(() => import('./pages/patient/ManageProfile'))

const ManagementHome = lazy(() => import('./pages/management/ManagementHome'))
const Reports = lazy(() => import('./pages/management/Reports'))
const ScheduleManagement = lazy(() => import('./pages/management/ScheduleManagement'))
const ServicesManagement = lazy(() => import('./pages/management/ServicesManagement'))
const UserManagement = lazy(() => import('./pages/management/UserManagement'))
const PasswordRecovery = lazy(() => import('./pages/PasswordRecovery'))
import AccountRedirect from './components/AccountRedirect'
const ClinicSettings = lazy(() => import('./pages/management/ClinicSettings'))
const Notifications = lazy(() => import('./pages/Notifications'))
const WalkIn = lazy(() => import('./pages/management/WalkIn'))
const Clients = lazy(() => import('./pages/management/Clients'))
import { Link } from 'react-router-dom'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageBoundary><Suspense fallback={<div role="status" className="min-h-[60vh] grid place-items-center text-slate-600">Loading page…</div>}>
        <Routes>
          {/* Public Views */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<div className="p-8"><h1>Page not found</h1><Link to="/">Return home</Link></div>} />
          </Route>

          {/* Patient Portal */}
          <Route element={<AuthLayout />}>
            <Route path="/forgot-password" element={<PasswordRecovery />} />
            <Route path="/reset-password" element={<PasswordRecovery reset />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['client', 'staff', 'admin', 'owner']}>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientHome />} />
            <Route path="book" element={<BookAppointment />} />
            <Route path="history" element={<AppointmentHistory />} />
            <Route path="profile" element={<ManageProfile />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Management Portal */}
          <Route
            path="/management"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'owner']}>
                <ManagementLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagementHome />} />
            <Route path="schedule" element={<ScheduleManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="walk-ins" element={<WalkIn />} />
            <Route path="clients" element={<Clients />} />
            <Route path="services" element={<ServicesManagement />} />
            <Route path="settings" element={<ClinicSettings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<ManageProfile />} />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/account" element={<ProtectedRoute><AccountRedirect /></ProtectedRoute>} />
        </Routes>
        </Suspense></PageBoundary>
      </BrowserRouter>
    </AuthProvider>
  )
}
