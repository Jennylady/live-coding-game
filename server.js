import express from 'express'
import { createServer } from 'node:http'
import { Server as SocketIOServer } from 'socket.io'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 3000)
const ADMIN_PASSWORD = 'admin12'
const AUTH_SECRET = process.env.AUTH_SECRET || 'bootcamp-champion-change-this-secret-in-production'
const DIST_DIR = path.join(__dirname, 'dist')

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: true, credentials: true }
})

app.use(express.json({ limit: '64kb' }))

const DEFAULT_TEAM_CONFIG = [
  { name: 'Cookies', username: 'cookies' },
  { name: 'EVH', username: 'evh' },
  { name: 'N4SC', username: 'n4sc' },
]

const defaultTeams = () => DEFAULT_TEAM_CONFIG.map((config, id) => ({
  id,
  name: config.name,
  username: config.username,
  members: [],
  score: 0,
  registered: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

const initialState = () => ({
  version: 14,
  updatedAt: new Date().toISOString(),
  teams: defaultTeams(),
  qualificationSnapshot: [],
  finalists: [],
  screen: 'registration',
  stage: 'qualification',
  activeMode: null,
  index: 0,
  roundDone: false,
  buzzLock: null,
  buzzChallenge: null,
  scoreHistory: [],
})

let state = initialState()

function normalizeName(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a))
  const bBuf = Buffer.from(String(b))
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf)
}

function signToken(payload, ttlSeconds = 60 * 60 * 12) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url')
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

function verifyToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, signature] = parts
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(`${header}.${body}`).digest('base64url')
  if (!safeEqual(signature, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function authFrom(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  return verifyToken(token)
}

function requireAdmin(req, res, next) {
  const auth = authFrom(req)
  if (!auth || auth.role !== 'admin') return res.status(401).json({ ok: false, message: 'Accès administrateur requis.' })
  req.auth = auth
  next()
}

function requireTeam(req, res, next) {
  const auth = authFrom(req)
  if (!auth || auth.role !== 'team' || !Number.isInteger(auth.teamId)) return res.status(401).json({ ok: false, message: 'Connexion équipe requise.' })
  req.auth = auth
  next()
}

function publicTeam(team) {
  return { ...team }
}

function publicState() {
  return {
    version: state.version,
    updatedAt: state.updatedAt,
    teams: state.teams.map(publicTeam),
    qualificationSnapshot: state.qualificationSnapshot,
    finalists: state.finalists,
    screen: state.screen,
    stage: state.stage,
    activeMode: state.activeMode,
    index: state.index,
    roundDone: state.roundDone,
    buzzLock: state.buzzLock,
    buzzChallenge: state.buzzChallenge,
  }
}

function challengeKey(s = state) {
  if (s.screen !== 'game' || !s.activeMode) return null
  return `${s.stage}:${s.activeMode}:${s.index}`
}

async function persistState() {
  // V13 intentionally keeps the competition state only in server memory.
  // No JSON/database file is written. A server restart resets scores and phase.
  state.updatedAt = new Date().toISOString()
}

async function loadState() {
  state = initialState()
}

function broadcastState() {
  io.emit('state:update', publicState())
}

async function commit(mutator, { broadcast = true } = {}) {
  mutator(state)
  await persistState()
  if (broadcast) broadcastState()
}

function trimText(value, max = 64) {
  return String(value ?? '').trim().slice(0, max)
}

function validScreen(value) {
  return ['registration', 'lobby', 'finalists', 'winner', 'game'].includes(value)
}

function validStage(value) {
  return ['qualification', 'final'].includes(value)
}

function clearBuzzIfChallengeChanged(previousKey) {
  const nextKey = challengeKey()
  if (previousKey !== nextKey) {
    state.buzzLock = null
    state.buzzChallenge = nextKey
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'bootcamp-champion', version: 14, storage: 'memory' }))

app.get('/api/state', (_req, res) => res.json({ ok: true, state: publicState() }))

app.post('/api/auth/admin', (req, res) => {
  const password = String(req.body?.password ?? '')
  if (!safeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ ok: false, message: 'Mot de passe administrateur incorrect.' })
  }
  const token = signToken({ role: 'admin' })
  res.json({ ok: true, token, role: 'admin' })
})

app.post('/api/auth/team', (req, res) => {
  // Les participants n'ont pas de mot de passe : ils choisissent simplement leur équipe.
  // teamId est la voie principale ; name/username restent acceptés pour compatibilité.
  const requestedTeamId = Number(req.body?.teamId)
  const suppliedLogin = trimText(req.body?.username ?? req.body?.name, 64)

  let config = Number.isInteger(requestedTeamId)
    ? DEFAULT_TEAM_CONFIG[requestedTeamId]
    : null

  if (!config && suppliedLogin) {
    config = DEFAULT_TEAM_CONFIG.find(item =>
      normalizeName(item.username) === normalizeName(suppliedLogin) ||
      normalizeName(item.name) === normalizeName(suppliedLogin)
    )
  }

  if (!config) {
    return res.status(400).json({ ok: false, message: 'Sélectionnez Cookies, EVH ou N4SC.' })
  }

  const team = state.teams.find(item => item.registered && normalizeName(item.name) === normalizeName(config.name))
  if (!team) return res.status(409).json({ ok: false, message: 'Équipe indisponible sur cette session.' })

  const token = signToken({ role: 'team', teamId: team.id, name: team.name, username: config.username })
  res.json({ ok: true, token, teamId: team.id, team: publicTeam(team) })
})

app.get('/api/auth/me', (req, res) => {
  const auth = authFrom(req)
  if (!auth) return res.status(401).json({ ok: false })
  if (auth.role === 'team') {
    const team = state.teams.find(t => t.id === auth.teamId && t.registered)
    if (!team) return res.status(401).json({ ok: false })
    return res.json({ ok: true, role: 'team', teamId: auth.teamId, team: publicTeam(team) })
  }
  res.json({ ok: true, role: 'admin', username: auth.username })
})

app.post('/api/teams/register', (_req, res) => {
  res.status(409).json({ ok: false, message: 'Les équipes sont préconfigurées : Cookies, EVH et N4SC.' })
})

app.delete('/api/admin/teams/:id', requireAdmin, (_req, res) => {
  res.status(405).json({ ok: false, message: 'Les trois équipes par défaut ne peuvent pas être supprimées.' })
})

app.post('/api/admin/competition/start', requireAdmin, async (_req, res) => {
  if (state.teams.filter(team => team.registered).length !== 3) {
    return res.status(409).json({ ok: false, message: 'Trois équipes doivent être inscrites avant le lancement.' })
  }
  await commit(s => {
    s.teams.forEach(team => { team.score = 0; team.updatedAt = new Date().toISOString() })
    s.finalists = []
    s.qualificationSnapshot = []
    s.stage = 'qualification'
    s.screen = 'lobby'
    s.activeMode = null
    s.index = 0
    s.roundDone = false
    s.buzzLock = null
    s.buzzChallenge = null
    s.scoreHistory = []
  })
  res.json({ ok: true, state: publicState() })
})

app.patch('/api/admin/state', requireAdmin, async (req, res) => {
  const patch = req.body || {}
  const previousKey = challengeKey()
  await commit(s => {
    if (patch.screen !== undefined && validScreen(patch.screen)) s.screen = patch.screen
    if (patch.stage !== undefined && validStage(patch.stage)) s.stage = patch.stage
    if (patch.activeMode !== undefined) s.activeMode = patch.activeMode === null ? null : trimText(patch.activeMode, 32)
    if (patch.index !== undefined && Number.isInteger(Number(patch.index)) && Number(patch.index) >= 0) s.index = Number(patch.index)
    if (patch.roundDone !== undefined) s.roundDone = Boolean(patch.roundDone)
    if (Array.isArray(patch.finalists)) s.finalists = [...new Set(patch.finalists.map(Number).filter(id => [0,1,2].includes(id)))].slice(0, 2)
    if (Array.isArray(patch.qualificationSnapshot)) {
      s.qualificationSnapshot = patch.qualificationSnapshot.slice(0, 3).map(item => ({
        id: Number(item.id),
        name: trimText(item.name, 32),
        members: Array.isArray(item.members) ? item.members.map(m => trimText(m, 40)).filter(Boolean) : [],
        score: Math.max(0, Number(item.score || 0)),
        registered: true,
      }))
    }
    clearBuzzIfChallengeChanged(previousKey)
  })
  res.json({ ok: true, state: publicState() })
})

app.post('/api/admin/final/start', requireAdmin, async (req, res) => {
  const finalists = Array.isArray(req.body?.finalists)
    ? [...new Set(req.body.finalists.map(Number).filter(id => [0,1,2].includes(id)))].slice(0, 2)
    : state.finalists
  if (finalists.length !== 2) return res.status(400).json({ ok: false, message: 'Sélectionnez exactement deux finalistes.' })
  await commit(s => {
    s.finalists = finalists
    s.teams.forEach(team => {
      if (finalists.includes(team.id)) team.score = 0
      team.updatedAt = new Date().toISOString()
    })
    s.stage = 'final'
    s.screen = 'lobby'
    s.activeMode = null
    s.index = 0
    s.roundDone = false
    s.buzzLock = null
    s.buzzChallenge = null
  })
  res.json({ ok: true, state: publicState() })
})

app.post('/api/admin/score', requireAdmin, async (req, res) => {
  const teamId = Number(req.body?.teamId)
  const delta = Number(req.body?.delta)
  if (![0,1,2].includes(teamId) || !Number.isFinite(delta) || Math.abs(delta) > 10000) {
    return res.status(400).json({ ok: false, message: 'Modification de score invalide.' })
  }
  const team = state.teams.find(t => t.id === teamId && t.registered)
  if (!team) return res.status(404).json({ ok: false, message: 'Équipe introuvable.' })
  const before = team.score
  await commit(s => {
    const target = s.teams[teamId]
    target.score = Math.max(0, Number(target.score || 0) + delta)
    target.updatedAt = new Date().toISOString()
    s.scoreHistory.push({
      at: new Date().toISOString(),
      teamId,
      teamName: target.name,
      delta,
      before,
      after: target.score,
      reason: trimText(req.body?.reason || 'admin/game', 80),
    })
    if (s.scoreHistory.length > 500) s.scoreHistory = s.scoreHistory.slice(-500)
  })
  res.json({ ok: true, team: publicTeam(state.teams[teamId]), state: publicState() })
})

app.post('/api/admin/buzz', requireAdmin, async (req, res) => {
  const teamId = Number(req.body?.teamId)
  const team = state.teams.find(t => t.id === teamId && t.registered)
  const key = challengeKey()
  if (!team || !key) return res.status(400).json({ ok: false, message: 'Buzzer indisponible.' })
  if (state.buzzChallenge === key && state.buzzLock !== null && state.buzzLock !== teamId) {
    return res.status(409).json({ ok: false, message: 'Le buzzer a déjà été pris.', teamId: state.buzzLock })
  }
  await commit(s => {
    s.buzzChallenge = key
    s.buzzLock = teamId
  }, { broadcast: false })
  const payload = { teamId, at: Date.now(), challenge: key }
  io.emit('buzz:accepted', payload)
  broadcastState()
  res.json({ ok: true, ...payload })
})

app.post('/api/admin/buzz/release', requireAdmin, async (_req, res) => {
  await commit(s => {
    s.buzzLock = null
    s.buzzChallenge = challengeKey(s)
  })
  io.emit('buzz:released', { at: Date.now() })
  res.json({ ok: true })
})

app.post('/api/team/buzz', async (req, res) => {
  // V13: les participants n'ont ni mot de passe ni jeton d'authentification.
  // Le navigateur conserve seulement l'identifiant de l'équipe choisie.
  const teamId = Number(req.body?.teamId)
  if (![0, 1, 2].includes(teamId)) {
    return res.status(400).json({ ok: false, message: 'Équipe invalide.' })
  }
  const team = state.teams.find(t => t.id === teamId && t.registered)
  const key = challengeKey()
  if (!team) return res.status(404).json({ ok: false, message: 'Équipe introuvable.' })
  if (!key) return res.status(409).json({ ok: false, message: 'Aucune épreuve n’accepte de buzz actuellement.' })
  const activeIds = state.stage === 'final' ? state.finalists : state.teams.filter(t => t.registered).map(t => t.id)
  if (!activeIds.includes(teamId)) return res.status(403).json({ ok: false, message: 'Votre équipe ne participe pas à cette phase.' })
  if (state.buzzChallenge === key && state.buzzLock !== null) {
    return res.status(409).json({ ok: false, message: 'Le buzzer a déjà été pris.', teamId: state.buzzLock })
  }

  await commit(s => {
    s.buzzChallenge = key
    s.buzzLock = teamId
  }, { broadcast: false })
  const payload = { teamId, at: Date.now(), challenge: key }
  io.emit('buzz:accepted', payload)
  broadcastState()
  res.json({ ok: true, ...payload })
})

app.post('/api/admin/reset', requireAdmin, async (_req, res) => {
  state = initialState()
  await persistState()
  broadcastState()
  io.emit('buzz:released', { at: Date.now() })
  res.json({ ok: true, state: publicState() })
})

app.get('/api/admin/export', requireAdmin, (_req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="bootcamp-champion-backup.json"')
  res.send(JSON.stringify(state, null, 2))
})

// Toujours renvoyer une erreur JSON explicite pour une route API inexistante.
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, message: `Route API introuvable : ${req.method} ${req.originalUrl}` })
})

io.on('connection', socket => {
  socket.emit('state:update', publicState())
})

try {
  await fs.access(DIST_DIR)
  app.use(express.static(DIST_DIR))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) return next()
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
} catch {
  app.get('/', (_req, res) => res.status(200).send('Bootcamp Champion API is running. Build the React app with npm run build.'))
}

await loadState()
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bootcamp Champion server listening on :${PORT}`)
  console.log('State storage: server memory only (no persistent file)')
})
