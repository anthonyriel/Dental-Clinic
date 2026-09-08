import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useAuth } from '../../context/auth'
import AddressFields from '../../components/AddressFields'
import { clinicDate } from '../../lib/appointments'
import { 
  User, Phone, Calendar, MapPin, Lock, Camera, 
  AlertCircle, CheckCircle2, AtSign, Mail, ZoomIn, Check, X, Sliders 
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
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Choose a JPG, PNG or WebP image smaller than 5 MB.'); return }

    const reader = new FileReader()
    reader.onload = () => {
      setRawImageSrc(reader.result)
      setZoom(1)
      setPanX(0)
      setPanY(0)
    }
    reader.readAsDataURL(file)
  }

  // Allow re-adjusting current avatar anytime
  const handleReAdjustCurrentAvatar = () => {
    if (!formData.avatarUrl) return
    setRawImageSrc(formData.avatarUrl)
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  // Draw cropped image onto canvas matching preview precisely
  const handleSaveCroppedImage = async () => {
    if (!rawImageSrc) return
    setUploadingAvatar(true)
    setError('')

    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => { setUploadingAvatar(false); setError("Could not load this image. Choose another file.") }
    img.src = rawImageSrc
    img.onload = async () => {
      ctx.fillStyle = '#0f172a' // match background color
      ctx.fillRect(0, 0, 400, 400)

      ctx.save()
      const ratio = 400 / 192 // preview container is 192px wide (w-48)
      ctx.translate(200, 200)
      ctx.scale(zoom * ratio, zoom * ratio)
      ctx.translate(panX, panY)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()

      canvas.toBlob(async (blob) => {
        try {
          if (!blob) throw new Error('Image could not be processed.')
          const fileName = `${user.id}-${Date.now()}.jpg`
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob, { contentType: 'image/jpeg' })

          if (uploadError) throw uploadError

          const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
          const publicUrl = data.publicUrl

          const { error: profileError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id).select().single()
          if (profileError) throw profileError
          setFormData(prev => ({ ...prev, avatarUrl: publicUrl }))
          refreshProfile()
          setRawImageSrc(null)
        } catch (err) {
          setError('Avatar upload failed: ' + err.message)
        } finally {
          setUploadingAvatar(false)
        }
      }, 'image/jpeg', 0.95)
    }
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Manage Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Update your account details, address, profile picture, and password.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Image Cropper Modal */}
      {rawImageSrc && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-400" /> Adjust & Crop Profile Picture
          </h3>
          <p className="text-xs text-slate-300">Use the zoom and pan controls to fit your photo inside the circle.</p>

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-sky-500 bg-slate-950 flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img 
                  src={rawImageSrc} 
                  alt="Crop preview" 
                  style={{
                    transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                    transition: 'transform 0.05s ease-out',
                    maxWidth: 'none',
                    maxHeight: 'none'
                  }}
                  className="object-contain"
                />
              </div>
            </div>

            <div className="w-full max-w-sm space-y-3 bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5" /> Zoom</span>
                <span>{zoom.toFixed(2)}x</span>
              </div>
              <input 
                type="range" 
                min="0.2" 
                max="3" 
                step="0.05" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))} 
                className="w-full accent-sky-500 cursor-pointer"
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Pan Left / Right ({panX}px)</label>
                  <input 
                    type="range" 
                    min="-150" 
                    max="150" 
                    value={panX} 
                    onChange={(e) => setPanX(parseInt(e.target.value))} 
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Pan Up / Down ({panY}px)</label>
                  <input 
                    type="range" 
                    min="-150" 
                    max="150" 
                    value={panY} 
                    onChange={(e) => setPanY(parseInt(e.target.value))} 
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full max-w-sm pt-2">
              <button
                type="button"
                onClick={() => setRawImageSrc(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={handleSaveCroppedImage}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> {uploadingAvatar ? 'Saving...' : 'Crop & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Details Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-5 pb-4 border-b border-slate-100">
          <div className="relative w-20 h-20 rounded-full bg-slate-100 overflow-hidden border-2 border-sky-500 shrink-0 flex items-center justify-center">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">Profile Picture</h4>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold cursor-pointer transition">
                <Camera className="w-3.5 h-3.5" />
                <span>Upload New</span>
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
              {formData.avatarUrl && (
                <button
                  type="button"
                  onClick={handleReAdjustCurrentAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Adjust Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>

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
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address (Read-only)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

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
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-600" /> Philippine Address Directory
            </h3>
            <span className="text-xs text-slate-500">Saved: {formData.regionName} / {formData.provinceName} / {formData.municipalityName}</span>
          </div>

          <AddressFields value={formData} onChange={changes => setFormData(prev => ({ ...prev, ...changes }))} />

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
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition shadow-sm disabled:opacity-50 text-sm mt-4"
        >
          {loading ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handlePasswordChange} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-sky-600" /> Change Password
        </h3>

        {passError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        {passSuccess && (
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Password updated successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={passLoading}
          className="w-full py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50 text-sm"
        >
          {passLoading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
