import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PublicLayout from './layouts/PublicLayout'
import AuthLayout from './layouts/AuthLayout'
import ClientLayout from './layouts/ClientLayout'
import ManagementLayout from './layouts/ManagementLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Services from './pages/Services'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Signup from './pages/Signup'

import ClientHome from './pages/patient/ClientHome'
import BookAppointment from './pages/patient/BookAppointment'
import AppointmentHistory from './pages/patient/AppointmentHistory'
import ManageProfile from './pages/patient/ManageProfile'

import ManagementHome from './pages/management/ManagementHome'
import Reports from './pages/management/Reports'
import ScheduleManagement from './pages/management/ScheduleManagement'
import ServicesManagement from './pages/management/ServicesManagement'
import UserManagement from './pages/management/UserManagement'
import PasswordRecovery from './pages/PasswordRecovery'
import AccountRedirect from './components/AccountRedirect'
import ClinicSettings from './pages/management/ClinicSettings'
import Notifications from './pages/Notifications'
import WalkIn from './pages/management/WalkIn'
import { Link } from 'react-router-dom'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Views */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/forgot-password" element={<PasswordRecovery />} />
            <Route path="/reset-password" element={<PasswordRecovery reset />} />
            <Route path="*" element={<div className="p-8"><h1>Page not found</h1><Link to="/">Return home</Link></div>} />
          </Route>

          {/* Patient Portal */}
          <Route element={<AuthLayout />}>
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
      </BrowserRouter>
    </AuthProvider>
  )
}
