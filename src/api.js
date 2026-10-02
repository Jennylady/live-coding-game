import { io } from 'socket.io-client'

export const ADMIN_TOKEN_KEY = 'bootcamp-champion-admin-token-v14'
export const TEAM_TOKEN_KEY = 'bootcamp-champion-team-token-v13'
export const TEAM_ID_KEY = 'bootcamp-champion-team-id-v13'

export async function api(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
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

export function connectRealtime() {
  return io({ transports: ['websocket', 'polling'] })
}

export async function downloadAdminBackup(token) {
  const response = await fetch('/api/admin/export', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
