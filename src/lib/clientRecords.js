export function clientRecordActive(record) {
  return record.is_active !== false && (!record.profile_id || (record.profiles?.is_active === true && !record.profiles?.deletion_pending))
}

export function clientRecordStatus(record) {
  if (record.profiles?.deletion_pending) return 'Deletion pending'
  return clientRecordActive(record) ? (record.profile_id ? 'Login linked' : 'Record only') : 'Deactivated'
}
