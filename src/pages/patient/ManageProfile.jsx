import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useAuth } from '../../context/auth'
import AddressFields from '../../components/AddressFields'
import AvatarCropper from '../../components/AvatarCropper'
import { clinicDate } from '../../lib/appointments'
import {  
  User, Phone, Calendar, MapPin, Lock, Camera,  
  AlertCircle, CheckCircle2, AtSign, Mail, Sliders, ShieldCheck  
} from 'lucide-react'

export default function ManageProfile() {
  const { user, profile, refreshProfile } = useAuth()
  
  const [formData, setFormData] = useState(() => ({
    username: profile.username || '',
    fullName: profile.full_name || '',
    email: user.email || '',
    phone: profile.phone || '',
    birthdate: profile.birthdate || '',
    gender: profile.gender || 'Female',
    regionName: profile.region || '',
    provinceName: profile.province || '',
    municipalityName: profile.municipality || '',
    barangayName: profile.barangay || '',
    houseNumber: profile.house_number || '',
    streetName: profile.street_name || '',
    subdivisionPurok: profile.subdivision_purok || '',
    zipcode: profile.zipcode || '',
    avatarUrl: profile.avatar_url || ''
  }))

  // Password change state
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [passError, setPassError] = useState('')
  const [passSuccess, setPassSuccess] = useState(false)
  const [passLoading, setPassLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Avatar Cropper State
  const [rawImageSrc, setRawImageSrc] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { 
      setError('Choose a JPG, PNG or WebP image smaller than 5 MB.')
      return 
    }

    const reader = new FileReader()
    reader.onload = () => {
      setRawImageSrc(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleReAdjustCurrentAvatar = () => {
    if (!formData.avatarUrl) return
    setRawImageSrc(formData.avatarUrl)
  }

  const handleSaveCroppedImage = async (blob) => {
    const fileName = user.id + '-' + Date.now() + '.jpg'
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: 'image/jpeg' })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const { error: profileError } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id).select().single()
    if (profileError) throw profileError
    setFormData(previous => ({ ...previous, avatarUrl: data.publicUrl }))
    refreshProfile()
    setRawImageSrc(null)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      if (!formData.username.trim() || !formData.fullName.trim()) throw new Error('Username and full name cannot be blank.')
      if (formData.birthdate > clinicDate()) throw new Error('Birthdate cannot be in the future.')
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username.trim(),
          full_name: formData.fullName,
          phone: formData.phone,
          birthdate: formData.birthdate,
          gender: formData.gender,
          region: formData.regionName,
          province: formData.provinceName,
          municipality: formData.municipalityName,
          barangay: formData.barangayName,
          house_number: formData.houseNumber,
          street_name: formData.streetName,
          subdivision_purok: formData.subdivisionPurok,
          zipcode: formData.zipcode
        })
        .eq('id', user.id).select().single()

      if (error) throw error
      refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPassError('')
    setPassSuccess(false)

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassError('New passwords do not match.')
      return
    }

    if (passwords.newPassword.length < 8) {
      setPassError('Password must be at least 8 characters long.')
      return
    }

    setPassLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword })
      if (error) throw error

      setPassSuccess(true)
      setPasswords({ newPassword: '', confirmPassword: '' })
      setTimeout(() => setPassSuccess(false), 3000)
    } catch (err) {
      setPassError(err.message)
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 text-left">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">ACCOUNT SETTINGS</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Manage Profile</h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">Update your professional profile credentials, residential address, and security settings.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#67c4c7]/10 text-[#67c4c7] rounded-full text-xs font-bold border border-[#67c4c7]/20 shadow-2xs self-start">
          <ShieldCheck className="w-4 h-4 text-[#67c4c7]" /> Secure Portal
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm flex items-center gap-3 border border-red-200 shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 text-sm flex items-center gap-3 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">Profile updated successfully!</span>
        </div>
      )}

      {rawImageSrc && <AvatarCropper key={rawImageSrc} src={rawImageSrc} onSave={handleSaveCroppedImage} onCancel={() => setRawImageSrc(null)} />}

      {/* Main Profile Details Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-8">
        
        {/* Avatar Header Component */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 text-center sm:text-left">
          <div className="relative w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-4 border-[#67c4c7] shadow-inner shrink-0 flex items-center justify-center">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Profile Photograph</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">Upload a professional portrait or clear photo for your clinic profile.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#67c4c7]/10 hover:bg-[#67c4c7]/20 text-[#67c4c7] rounded-xl text-xs font-bold cursor-pointer transition border border-[#67c4c7]/30 shadow-2xs">
                <Camera className="w-4 h-4" />
                <span>Upload New Image</span>
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
              {formData.avatarUrl && (
                <button
                  type="button"
                  onClick={handleReAdjustCurrentAvatar}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 shadow-2xs"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Adjust Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Personal Credentials */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Personal Information</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none transition font-normal text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none transition font-normal text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100/80 text-slate-500 cursor-not-allowed font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="phone"
                  pattern="(09[0-9]{9}|[+]639[0-9]{9})"
                  title="Enter 09 followed by 9 digits, or +639 followed by 9 digits."
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none transition font-normal text-slate-900 bg-slate-50/50 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Birthdate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  name="birthdate"
                  max={clinicDate()}
                  required
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 font-normal text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 font-normal text-slate-900"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="border-t border-slate-200/80 pt-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#67c4c7]" /> Philippine Address Directory
            </h4>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              Saved Region: {formData.regionName || 'None selected'}
            </span>
          </div>

          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/60 space-y-4">
            <AddressFields value={formData} onChange={changes => setFormData(prev => ({ ...prev, ...changes }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                House / Bldg No.
              </label>
              <input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none font-normal text-slate-900 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Street Name
              </label>
              <input
                type="text"
                name="streetName"
                value={formData.streetName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none font-normal text-slate-900 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Subdivision / Purok
              </label>
              <input
                type="text"
                name="subdivisionPurok"
                value={formData.subdivisionPurok}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none font-normal text-slate-900 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
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
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none font-mono font-normal text-slate-900 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#67c4c7] text-white font-bold rounded-xl hover:bg-[#57b3b6] transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm mt-6"
        >
          {loading ? 'Saving Profile Changes...' : 'Save Profile Changes'}
        </button>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handlePasswordChange} className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Security Credentials</h3>
            <p className="text-xs text-slate-500 font-normal">Update your account password securely.</p>
          </div>
        </div>

        {passError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm flex items-center gap-3 border border-red-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span className="font-medium">{passError}</span>
          </div>
        )}

        {passSuccess && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-sm flex items-center gap-3 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">Password updated successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none font-normal text-slate-900 bg-slate-50/50 font-mono"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none font-normal text-slate-900 bg-slate-50/50 font-mono"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={passLoading}
          className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
        >
          {passLoading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}