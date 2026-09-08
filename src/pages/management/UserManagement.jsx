import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { User, Phone, Edit, X, AlertCircle, MapPin } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">View registered accounts, edit profiles, assign roles, and manage users.</p>
        </div>
      </div>

      <Feedback error={error || loadError} onRetry={() => { setError(''); fetchUsers() }} />
      <input aria-label="Search users" placeholder="Search name, username or phone" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} className="border rounded-lg p-3 w-full" />
      <div className="flex gap-4 text-sm"><button disabled={pageIndex === 0} onClick={() => setPage(pageIndex - 1)}>Previous</button><span>{filtered.length} users · Page {pageIndex + 1}</span><button disabled={(pageIndex + 1) * 20 >= filtered.length} onClick={() => setPage(pageIndex + 1)}>Next</button></div>
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading users...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.slice(pageIndex * 20, pageIndex * 20 + 20).map((u) => (
              <div key={u.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">{u.full_name || 'Unnamed User'}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                      u.role === 'owner' ? 'bg-purple-50 text-purple-700' :
                      u.role === 'admin' ? 'bg-indigo-50 text-indigo-700' :
                      u.role === 'staff' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role}{u.is_active === false ? ' · Inactive' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> @{u.username || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {u.phone || 'N/A'}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {u.municipality || 'No City'}, {u.province || 'No Province'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase hidden sm:inline">Role:</label>
                    <select
                      disabled={busy || !canManage(u)}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
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
                    className="p-2 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-700 rounded-lg transition"
                    title="Edit User Profile"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    disabled={busy || !canManage(u)}
                    onClick={() => handleToggleUser(u)}
                    className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit User Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Birthdate</label>
                  <input
                    type="date"
                    required
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white font-semibold"
                  >
                    <option value="client">Client</option>
                    <option value="staff">Staff</option>
                    {role === 'owner' && <option value="admin">Admin</option>}
                    {role === 'owner' && <option value="owner">Owner</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Zipcode</label>
                  <input
                    type="text"
                    required
                    value={formData.zipcode}
                    onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Municipality / City</label>
                  <input
                    type="text"
                    value={formData.municipality}
                    onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Barangay</label>
                  <input
                    type="text"
                    value={formData.barangay}
                    onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Street Name</label>
                  <input
                    type="text"
                    value={formData.streetName}
                    onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Subdivision / Purok</label>
                  <input
                    type="text"
                    value={formData.subdivisionPurok}
                    onChange={(e) => setFormData({ ...formData, subdivisionPurok: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}