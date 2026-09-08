import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { bookingDestination } from '../lib/navigation'
import { useAuth } from '../context/auth'
import AddressFields from '../components/AddressFields'
import { clinicDate } from '../lib/appointments'
import { Lock, Mail, User, Phone, Calendar, MapPin, AlertCircle, AtSign } from 'lucide-react'

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    birthdate: '',
    gender: 'Female',
    regionName: '',
    provinceName: '',
    municipalityName: '',
    barangayName: '',
    houseNumber: '',
    streetName: '',
    subdivisionPurok: '',
    zipcode: ''
  })

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = bookingDestination(params.get('next'))

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (loading) return
    setLoading(true)

    try {
      if (!formData.username.trim() || !formData.fullName.trim()) throw new Error('Username and full name cannot be blank.')
      if (formData.birthdate > clinicDate()) throw new Error('Birthdate cannot be in the future.')
      const { data, error } = await signUp(formData.email, formData.password, {
        username: formData.username.trim(),
        full_name: formData.fullName,
        phone: formData.phone,
        birthdate: formData.birthdate,
        gender: formData.gender,
        house_number: formData.houseNumber,
        street_name: formData.streetName,
        subdivision_purok: formData.subdivisionPurok,
        barangay: formData.barangayName,
        municipality: formData.municipalityName,
        province: formData.provinceName,
        region: formData.regionName,
        zipcode: formData.zipcode,
        country: 'Philippines',
        role: 'client'
      })

      if (error) {
        if (error.message.includes('profiles_username_key') || error.message.includes('unique constraint')) {
          throw new Error('This username is already taken. Please choose another one.')
        }
        throw error
      }

      if (data?.session) navigate(next || '/account', { replace: true })
      else setMessage('Check your email to confirm your account before signing in. If you already registered, use login or password recovery.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <div className="max-w-2xl w-full bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create an Account</h2>
          <p className="text-sm text-slate-500 mt-1">Join Dentaprime to book and manage your appointments</p>
        </div>

        {message && <p role="status" className="bg-emerald-50 p-4 rounded-xl">{message}</p>}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="juandelacruz"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Juan Dela Cruz"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="phone"
                  pattern="(09[0-9]{9}|[+]639[0-9]{9})"
                  title="Enter 09 followed by 9 digits, or +639 followed by 9 digits."
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="09123456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Birthdate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  name="birthdate"
                  max={clinicDate()}
                  required
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Address Section */}
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-600" /> Philippine Address Directory
            </h3>

            <AddressFields value={formData} onChange={changes => setFormData(prev => ({ ...prev, ...changes }))} />

            {/* Optional street details & Zipcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  House / Bldg No.
                </label>
                <input
                  type="text"
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="e.g. Blk 4 Lot 12"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Street Name
                </label>
                <input
                  type="text"
                  name="streetName"
                  value={formData.streetName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="e.g. Rizal Street"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Subdivision or Purok 
                </label>
                <input
                  type="text"
                  name="subdivisionPurok"
                  value={formData.subdivisionPurok}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="e.g. Purok 3"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Zipcode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="zipcode"
                  pattern="[0-9]{4}"
                  title="Enter a four-digit Philippine postal code."
                  required
                  value={formData.zipcode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                  placeholder="e.g. 6328"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition shadow-sm disabled:opacity-50 text-sm mt-4"
          >
            {loading ? 'Creating account...' : 'Complete Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="text-sky-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
