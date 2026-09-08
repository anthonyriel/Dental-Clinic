import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { User, Phone, Edit, X, AlertCircle, MapPin, Search, ShieldCheck } from 'lucide-react'

import { useAuth } from '../../context/auth'
import { useQuery } from '../../hooks/useQuery'
import { allRows } from '../../lib/queries'
import { updateOne } from '../../lib/data'
import Feedback from '../../components/Feedback'

const loadUsers = () => allRows(() => supabase.from('profiles').select('*').order('created_at', { ascending: false }).order('id'))

export default function UserManagement() {
  const { user: currentUser, role } = useAuth()
  const { data: users, loading, error: loadError, refresh: fetchUsers } = useQuery(loadUsers, [])
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  
  const canManage = (account) => account.id !== currentUser.id && (role === 'owner' || !['admin','owner'].includes(account.role))
  const filtered = users.filter(account => ((account.full_name || '') + ' ' + (account.username || '') + ' ' + (account.phone || '')).toLowerCase().includes(search.toLowerCase()))
  const pageIndex = Math.min(page, Math.max(0, Math.ceil(filtered.length / 20) - 1))
  
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [error, setError] = useState('')

  // Form state for Edit
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phone: '',
    birthdate: '',
    gender: 'Female',
    role: 'client',
    region: '',
    province: '',
    municipality: '',
    barangay: '',
    houseNumber: '',
    streetName: '',
    subdivisionPurok: '',
    zipcode: ''
  })

  const handleRoleChange = async (userId, newRole) => {
    if (busy || !window.confirm('Change this account role?')) return
    setBusy(true); setError('')
    try { await updateOne('profiles', userId, { role: newRole }); fetchUsers() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setFormData({
      username: user.username || '',
      fullName: user.full_name || '',
      phone: user.phone || '',
      birthdate: user.birthdate || '',
      gender: user.gender || 'Female',
      role: user.role || 'client',
      region: user.region || '',
      province: user.province || '',
      municipality: user.municipality || '',
      barangay: user.barangay || '',
      houseNumber: user.house_number || '',
      streetName: user.street_name || '',
      subdivisionPurok: user.subdivision_purok || '',
      zipcode: user.zipcode || ''
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    setError('')
    if (busy) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username.trim(),
          full_name: formData.fullName,
          phone: formData.phone,
          birthdate: formData.birthdate,
          gender: formData.gender,
          role: formData.role,
          region: formData.region,
          province: formData.province,
          municipality: formData.municipality,
          barangay: formData.barangay,
          house_number: formData.houseNumber,
          street_name: formData.streetName,
          subdivision_purok: formData.subdivisionPurok,
          zipcode: formData.zipcode
        })
        .eq('id', selectedUser.id).select().single()

      if (error) throw error

      alert('User updated successfully!')
      setIsEditModalOpen(false)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally { setBusy(false) }
  }

  const handleToggleUser = async (account) => {
    if (busy || !window.confirm((account.is_active === false ? 'Reactivate' : 'Deactivate') + ' this account? Appointment history will be retained.')) return
    setBusy(true); setError('')
    try { await updateOne('profiles', account.id, { is_active: account.is_active === false }); fetchUsers() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">CLINIC WORKSPACE</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">User Management</h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">View registered accounts, edit profiles, assign roles, and manage users.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#67c4c7]/10 text-[#67c4c7] rounded-full text-xs font-bold border border-[#67c4c7]/20 shadow-2xs self-start">
          <ShieldCheck className="w-4 h-4 text-[#67c4c7]" /> Admin Access
        </div>
      </div>

      <Feedback error={error || loadError} onRetry={() => { setError(''); fetchUsers() }} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
          <input 
            aria-label="Search users" 
            placeholder="Search name, username or phone" 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(0) }} 
            className="w-full pl-10 pr-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none transition text-slate-900 bg-white shadow-sm" 
          />
        </div>
        
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <button 
            disabled={pageIndex === 0} 
            onClick={() => setPage(pageIndex - 1)}
            className="disabled:opacity-40 hover:text-[#67c4c7] transition font-bold"
          >
            Previous
          </button>
          <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-2xs font-mono">
            {filtered.length} users · Page {pageIndex + 1}
          </span>
          <button 
            disabled={(pageIndex + 1) * 20 >= filtered.length} 
            onClick={() => setPage(pageIndex + 1)}
            className="disabled:opacity-40 hover:text-[#67c4c7] transition font-bold"
          >
            Next
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm font-normal">Loading users...</div>
      ) : (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.slice(pageIndex * 20, pageIndex * 20 + 20).map((u) => (
              <div key={u.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/50 transition">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-slate-900 text-base">{u.full_name || 'Unnamed User'}</h4>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      u.role === 'owner' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      u.role === 'admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                      u.role === 'staff' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {u.role}{u.is_active === false ? ' · Inactive' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 font-normal">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> @{u.username || 'N/A'}</span>
                    <span className="flex items-center gap-1.5 font-mono"><Phone className="w-3.5 h-3.5 text-slate-400" /> {u.phone || 'N/A'}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {u.municipality || 'No City'}, {u.province || 'No Province'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Role:</label>
                    <select
                      disabled={busy || !canManage(u)}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="text-xs sm:text-sm border-none bg-transparent focus:ring-0 outline-none font-bold text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <option value="client">Client</option>
                      <option value="staff">Staff</option>
                      {(role === 'owner' || u.role === 'admin') && <option value="admin">Admin</option>}
                      {(role === 'owner' || u.role === 'owner') && <option value="owner">Owner</option>}
                    </select>
                  </div>

                  <button
                    disabled={busy || !canManage(u)}
                    onClick={() => openEditModal(u)}
                    className="p-2.5 bg-white border border-slate-200 hover:bg-[#67c4c7]/10 hover:text-[#67c4c7] hover:border-[#67c4c7]/30 text-slate-600 rounded-xl transition shadow-2xs disabled:opacity-50"
                    title="Edit User Profile"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    disabled={busy || !canManage(u)}
                    onClick={() => handleToggleUser(u)}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-50"
                    title="Change account access"
                  >
                    {u.is_active === false ? 'Reactivate' : 'Deactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto overflow-x-hidden text-left">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#67c4c7] uppercase">PROFILE MANAGEMENT</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Edit User Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm flex items-center gap-3 border border-red-200">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Username</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Phone</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Birthdate</label>
                    <input
                      type="date"
                      required
                      value={formData.birthdate}
                      onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    >
                      <option value="client">Client</option>
                      <option value="staff">Staff</option>
                      {role === 'owner' && <option value="admin">Admin</option>}
                      {role === 'owner' && <option value="owner">Owner</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Zipcode</label>
                    <input
                      type="text"
                      required
                      value={formData.zipcode}
                      onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Address Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Region</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Province</label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Municipality / City</label>
                    <input
                      type="text"
                      value={formData.municipality}
                      onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Barangay</label>
                    <input
                      type="text"
                      value={formData.barangay}
                      onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Street Name</label>
                    <input
                      type="text"
                      value={formData.streetName}
                      onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Subdivision / Purok</label>
                    <input
                      type="text"
                      value={formData.subdivisionPurok}
                      onChange={(e) => setFormData({ ...formData, subdivisionPurok: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  type="submit"
                  className="flex-1 px-5 py-3 bg-[#67c4c7] hover:bg-[#57b3b6] text-white text-sm font-bold rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {busy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}