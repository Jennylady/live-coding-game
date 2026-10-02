export const ADMIN_TOKEN_KEY = 'bootcamp-champion-admin-token-v16'
export const TEAM_ID_KEY = 'bootcamp-champion-team-id-v16'

export async function api(path, { method = 'GET', body, token, signal } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...(signal ? { signal } : {}),
    cache: 'no-store',
  })

  let data = {}
  try { data = await response.json() } catch {}

  if (!response.ok) {
    const error = new Error(data?.message || `Erreur serveur (${response.status})`)
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export async function downloadAdminBackup(token) {
  const response = await fetch('/api/admin/export', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Export impossible.')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bootcamp-champion-backup.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
