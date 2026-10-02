import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, Award, Binary, BrainCircuit, Check, ChevronRight, CircleHelp,
  Clock3, Code2, Crown, Gauge, Medal, Network, Pause, Play, RotateCcw,
  Settings2, ShieldCheck, Sparkles, Swords, TerminalSquare, Trophy, Users,
  X, Zap, KeyRound, LogIn, LogOut, Plus, Minus
} from 'lucide-react'
import { api, ADMIN_TOKEN_KEY, TEAM_ID_KEY } from './api'
import {
  quizQuestions,
  championQuestions,
  bashChallenges,
  pythonChallenges,
  finalQuizQuestions,
  finalChampionQuestions,
  finalBashChallenges,
  finalPythonChallenges
} from './data/questions'

const KEYS = ['a', 'g', 'l']
const KEY_LABELS = ['A', 'G', 'L']

const emptyTeams = () => [
  { id: 0, name: 'Cookies', score: 0 },
  { id: 1, name: 'EVH', score: 0 },
  { id: 2, name: 'N4SC', score: 0 },
]

const normalize = (value = '') => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9. ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

function beep(freq = 520, duration = 0.09) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.045, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

const QUAL_MODES = [
  { id: 'quiz', title: 'Quiz · Choix multiple', subtitle: '12 questions · 25 s/question · buzzer', meta: 'ÉPREUVE 01', icon: Binary, tone: 'cyan' },
  { id: 'champion', title: 'Question pour un champion', subtitle: '12 questions · 4 indices · 7 s/indice', meta: 'ÉPREUVE 02', icon: BrainCircuit, tone: 'violet' },
  { id: 'bash', title: 'Live Code · Bash', subtitle: '3 exercices pratiques · 4 à 6 min', meta: 'ÉPREUVE 03', icon: TerminalSquare, tone: 'amber' },
  { id: 'python', title: 'Live Code · Python système', subtitle: '3 exercices pratiques · 4 à 5 min', meta: 'ÉPREUVE 04', icon: Code2, tone: 'amber' },
]

const FINAL_MODES = [
  { id: 'finalQuiz', title: 'Quiz final', subtitle: '6 questions · 35 s/question · buzzer', meta: 'FINALE 01', icon: Swords, tone: 'cyan' },
  { id: 'finalChampion', title: 'Champion final', subtitle: '4 questions · indices progressifs', meta: 'FINALE 02', icon: BrainCircuit, tone: 'violet' },
  { id: 'finalBash', title: 'Live Code · Bash final', subtitle: '2 exercices · points manuels', meta: 'FINALE 03', icon: TerminalSquare, tone: 'amber' },
  { id: 'finalPython', title: 'Live Code · Python final', subtitle: '2 exercices · points manuels', meta: 'FINALE 04', icon: Code2, tone: 'amber' },
]

function questionsForMode(mode) {
  if (mode === 'quiz') return quizQuestions
  if (mode === 'champion') return championQuestions
  if (mode === 'bash') return bashChallenges
  if (mode === 'python') return pythonChallenges
  if (mode === 'finalQuiz') return finalQuizQuestions
  if (mode === 'finalChampion') return finalChampionQuestions
  if (mode === 'finalBash') return finalBashChallenges
  if (mode === 'finalPython') return finalPythonChallenges
  return []
}

async function emitTeamBuzz() {
  const teamId = Number(sessionStorage.getItem(TEAM_ID_KEY))
  if (![0, 1, 2].includes(teamId)) return { ok: false, message: 'Reconnectez votre équipe.' }
  try {
    return await api('/api/team/buzz', { method: 'POST', body: { teamId } })
  } catch (error) {
    return { ok: false, message: error.message }
  }
}

async function emitAdminBuzz(teamId) {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  if (!token) return { ok: false, message: 'Connexion admin requise.' }
  try {
    return await api('/api/admin/buzz', { method: 'POST', token, body: { teamId } })
  } catch (error) {
    return { ok: false, message: error.message, teamId: error.data?.teamId }
  }
}

async function releaseAdminBuzz() {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  if (!token) return
  try { await api('/api/admin/buzz/release', { method: 'POST', token }) } catch {}
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [stage, setStage] = useState('qualification')
  const [teams, setTeams] = useState(emptyTeams)
  const [qualificationSnapshot, setQualificationSnapshot] = useState([])
  const [finalists, setFinalists] = useState([])
  const [activeMode, setActiveMode] = useState(null)
  const [questionSet, setQuestionSet] = useState([])
  const [index, setIndex] = useState(0)
  const [roundDone, setRoundDone] = useState(false)
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [teamSessionId, setTeamSessionId] = useState(null)

  const applyRemoteState = (remote) => {
    if (!remote) return
    if (Array.isArray(remote.teams) && remote.teams.length === 3) setTeams(remote.teams)
    if (Array.isArray(remote.finalists)) setFinalists(remote.finalists)
    if (Array.isArray(remote.qualificationSnapshot)) setQualificationSnapshot(remote.qualificationSnapshot)
    if (['home', 'lobby', 'finalists', 'winner', 'game'].includes(remote.screen)) setScreen(remote.screen)
    if (['qualification', 'final'].includes(remote.stage)) setStage(remote.stage)
    setActiveMode(remote.activeMode || null)
    setQuestionSet(remote.activeMode ? [...questionsForMode(remote.activeMode)] : [])
    if (Number.isInteger(remote.index)) setIndex(remote.index)
    if (typeof remote.roundDone === 'boolean') setRoundDone(remote.roundDone)
  }

  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      try {
        const data = await api('/api/state')
        if (!cancelled) applyRemoteState(data.state)
      } catch {}

      const adminToken = sessionStorage.getItem(ADMIN_TOKEN_KEY)
      const storedTeamIdRaw = sessionStorage.getItem(TEAM_ID_KEY)
      const storedTeamId = storedTeamIdRaw === null ? null : Number(storedTeamIdRaw)

      if (adminToken) {
        try {
          const me = await api('/api/auth/me', { token: adminToken })
          if (!cancelled && me.role === 'admin') {
            setAdminAuthenticated(true)
            setTeamSessionId(null)
          }
        } catch {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY)
        }
      } else if (storedTeamIdRaw !== null && [0, 1, 2].includes(storedTeamId)) {
        if (!cancelled) setTeamSessionId(storedTeamId)
      }
    }

    restore()

    let lastBuzzSignature = null
    let inFlight = false

    const refreshState = async () => {
      if (cancelled || inFlight) return
      inFlight = true
      try {
        const data = await api('/api/state')
        if (cancelled) return
        const remote = data.state
        applyRemoteState(remote)

        const locked = remote?.buzzLock !== null && remote?.buzzLock !== undefined
        const signature = locked ? `${remote?.buzzChallenge || 'unknown'}:${remote.buzzLock}` : null

        if (signature && signature !== lastBuzzSignature) {
          window.dispatchEvent(new CustomEvent('bootcamp-team-buzz', {
            detail: { teamId: remote.buzzLock, challenge: remote.buzzChallenge, at: Date.now() }
          }))
        } else if (!signature && lastBuzzSignature) {
          window.dispatchEvent(new CustomEvent('bootcamp-buzz-released', { detail: { at: Date.now() } }))
        }

        lastBuzzSignature = signature
      } catch {
        // Une coupure réseau temporaire ne doit pas casser l'interface.
      } finally {
        inFlight = false
      }
    }

    refreshState()
    const poller = window.setInterval(refreshState, 750)

    return () => {
      cancelled = true
      window.clearInterval(poller)
    }
  }, [])

  const activeTeamIds = stage === 'final' ? finalists : teams.map(t => t.id)
  const visibleTeams = teams.filter(t => activeTeamIds.includes(t.id))

  const addScore = async (id, points, reason = 'admin/game') => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
    if (!token) return { ok: false, message: 'Connexion admin requise.' }
    try {
      await api('/api/admin/score', { method: 'POST', token, body: { teamId: id, delta: Number(points || 0), reason } })
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message }
    }
  }

  const loginAdmin = async (password) => {
    try {
      const data = await api('/api/auth/admin', { method: 'POST', body: { password } })
      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      sessionStorage.removeItem(TEAM_ID_KEY)
      setTeamSessionId(null)
      setAdminAuthenticated(true)
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message }
    }
  }

  const logoutAdmin = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    setAdminAuthenticated(false)
  }

  const loginTeam = async (teamId) => {
    const id = Number(teamId)
    if (![0, 1, 2].includes(id)) return { ok: false, message: 'Sélectionnez une équipe.' }
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    setAdminAuthenticated(false)
    sessionStorage.setItem(TEAM_ID_KEY, String(id))
    setTeamSessionId(id)
    return { ok: true, teamId: id }
  }

  const logoutTeam = () => {
    sessionStorage.removeItem(TEAM_ID_KEY)
    setTeamSessionId(null)
  }

  const patchAdminState = async patch => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
    if (!token) return { ok: false, message: 'Connexion admin requise.' }
    try {
      const data = await api('/api/admin/state', { method: 'PATCH', token, body: patch })
      applyRemoteState(data.state)
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message }
    }
  }

  const startCompetition = async () => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
    if (!token) return false
    try {
      const data = await api('/api/admin/competition/start', { method: 'POST', token })
      applyRemoteState(data.state)
      return true
    } catch {
      return false
    }
  }

  const startMode = async (mode) => {
    await patchAdminState({ activeMode: mode, index: 0, roundDone: false, screen: 'game' })
  }

  const next = async () => {
    if (index + 1 >= questionSet.length) await patchAdminState({ roundDone: true })
    else await patchAdminState({ index: index + 1 })
  }

  const returnToLobby = async () => {
    await patchAdminState({ roundDone: false, screen: 'lobby', activeMode: null, index: 0 })
  }

  const closeQualifications = async () => {
    const ordered = [...teams].sort((a, b) => b.score - a.score)
    const snapshot = ordered.map(t => ({ id: t.id, name: t.name, score: t.score }))
    const selected = [ordered[0].id, ordered[1].id]
    setQualificationSnapshot(snapshot)
    setFinalists(selected)
    await patchAdminState({ qualificationSnapshot: snapshot, finalists: selected, screen: 'finalists' })
  }

  const confirmFinalists = async () => {
    if (finalists.length !== 2) return
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
    if (!token) return
    try {
      const data = await api('/api/admin/final/start', { method: 'POST', token, body: { finalists } })
      applyRemoteState(data.state)
    } catch {}
  }

  const goWinner = async () => {
    await patchAdminState({ screen: 'winner', activeMode: null, roundDone: false })
  }

  const backToLobby = async () => {
    await patchAdminState({ screen: 'lobby' })
  }

  const resetAll = async () => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
    if (!token) return
    try {
      const data = await api('/api/admin/reset', { method: 'POST', token })
      sessionStorage.removeItem(TEAM_ID_KEY)
      setTeamSessionId(null)
      applyRemoteState(data.state)
    } catch {}
  }



  if (teamSessionId !== null && !adminAuthenticated) {
    const team = teams.find(t => t.id === teamSessionId)
    if (team) {
      return (
        <div className="app-shell">
          <Background />
          <TeamPortal team={team} screen={screen} stage={stage} activeMode={activeMode} index={index} isActive={stage !== 'final' || finalists.includes(team.id)} logoutTeam={logoutTeam} />
        </div>
      )
    }
  }

  if (screen !== 'home' && !adminAuthenticated) {
    return (
      <div className="app-shell">
        <Background />
        <Header stage={stage} screen={screen} resetAll={resetAll} adminAuthenticated={false} logoutAdmin={logoutAdmin} />
        <AccessGate loginAdmin={loginAdmin} loginTeam={loginTeam} teams={teams} screen={screen} stage={stage} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Background />
      <Header stage={stage} screen={screen} resetAll={resetAll} adminAuthenticated={adminAuthenticated} logoutAdmin={logoutAdmin} />

      {screen === 'home' && (
        <Home teams={teams} startCompetition={startCompetition} adminAuthenticated={adminAuthenticated} loginAdmin={loginAdmin} loginTeam={loginTeam} />
      )}

      {screen === 'lobby' && (
        <Lobby
          stage={stage}
          teams={visibleTeams}
          modes={stage === 'qualification' ? QUAL_MODES : FINAL_MODES}
          startMode={startMode}
          closeQualifications={closeQualifications}
          finishFinal={goWinner}
          qualificationSnapshot={qualificationSnapshot}
          addScore={addScore}
        />
      )}

      {screen === 'finalists' && (
        <FinalistSelection
          teams={teams}
          finalists={finalists}
          setFinalists={setFinalists}
          confirm={confirmFinalists}
          back={backToLobby}
        />
      )}

      {screen === 'game' && (
        <GameShell
          mode={activeMode}
          question={questionSet[index]}
          index={index}
          total={questionSet.length}
          teams={visibleTeams}
          addScore={addScore}
          next={next}
          roundDone={roundDone}
          returnToLobby={returnToLobby}
          adminAuthenticated={adminAuthenticated}
        />
      )}

      {screen === 'winner' && (
        <WinnerScreen teams={visibleTeams} qualificationSnapshot={qualificationSnapshot} resetAll={resetAll} />
      )}
    </div>
  )
}


function TeamChoices({ teams, loginTeam, onChosen }) {
  const [error, setError] = useState('')
  const [loadingId, setLoadingId] = useState(null)

  const enter = async (teamId) => {
    setLoadingId(teamId)
    setError('')
    const result = await loginTeam(teamId)
    setLoadingId(null)
    if (!result.ok) { setError(result.message); return }
    onChosen?.()
  }

  return (
    <div className="direct-team-choices">
      {teams.map(team => (
        <button key={team.id} type="button" className={`participant-team-choice team-direct team-${team.id}`} onClick={() => enter(team.id)} disabled={loadingId !== null}>
          <span className={`mini-team-dot team-${team.id}`}/>
          <span><strong>{team.name}</strong><small>Buzzer {KEY_LABELS[team.id]}</small></span>
          <ChevronRight size={18}/>
        </button>
      ))}
      {error && <div className="admin-login-error">{error}</div>}
    </div>
  )
}

function TeamPortal({ team, screen, stage, activeMode, index, isActive, logoutTeam }) {
  const canBuzz = screen === 'game' && isActive
  const [buzzStatus, setBuzzStatus] = useState('')
  const labels = {
    quiz: 'Quiz · choix multiple', champion: 'Question pour un champion', bash: 'Live Code · Bash', python: 'Live Code · Python système',
    finalQuiz: 'Quiz final', finalChampion: 'Champion final', finalBash: 'Bash final', finalPython: 'Python final'
  }

  const doBuzz = async () => {
    if (!canBuzz) return
    setBuzzStatus('Envoi du buzz…')
    const result = await emitTeamBuzz()
    setBuzzStatus(result.ok ? 'Buzz accepté — vous avez la main !' : result.message)
  }

  useEffect(() => { setBuzzStatus('') }, [activeMode, index, screen])

  useEffect(() => {
    const onKey = event => {
      if (!canBuzz || event.repeat || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
      if (event.key.toLowerCase() === KEYS[team.id]) doBuzz()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canBuzz, team.id, activeMode, index])
  return (
    <main className="team-portal-page">
      <section className="team-portal glass">
        <div className="team-portal-top">
          <div className="brand"><div className="brand-icon"><Network size={19}/></div><div><strong>BOOTCAMP</strong><span>CHAMPION</span></div></div>
          <div className="team-portal-top-actions">
            <button className="tiny-btn" onClick={logoutTeam}><LogOut size={14}/> Quitter</button>
          </div>
        </div>
        <div className={`team-portal-orb team-${team.id}`}><Users size={31}/></div>
        <span className="summary-label">ESPACE ÉQUIPE</span>
        <h1>{team.name}</h1>
        <p>Équipe fixe du challenge</p>
        <div className="team-portal-stats">
          <div><span>Score</span><strong>{team.score}</strong><small>pts</small></div>
          <div><span>Buzzer</span><strong>{KEY_LABELS[team.id]}</strong><small>touche</small></div>
          <div><span>Phase</span><strong>{stage === 'qualification' ? 'QUALIF' : 'FINALE'}</strong><small>{screen}</small></div>
        </div>
        <div className={`team-status-card ${canBuzz ? 'live' : ''}`}>
          {canBuzz ? <><Zap size={19}/><div><strong>{labels[activeMode] || 'Épreuve en cours'}</strong><span>Challenge {index + 1} · buzzez quand votre équipe souhaite répondre.</span></div></> : <><Clock3 size={19}/><div><strong>En attente de l’animateur</strong><span>{!isActive ? 'Votre équipe n’est pas qualifiée pour cette phase.' : screen === 'home' ? 'Le challenge n’a pas encore été lancé.' : 'Attendez le lancement de la prochaine épreuve.'}</span></div></>}
        </div>
        <button className={`team-buzz-big ${canBuzz ? 'ready' : ''}`} disabled={!canBuzz} onClick={doBuzz}>
          <Zap size={31}/><span>{canBuzz ? 'JE RÉPONDS / BUZZ' : 'BUZZER EN ATTENTE'}</span><kbd>{KEY_LABELS[team.id]}</kbd>
        </button>
        {buzzStatus && <div className="team-buzz-status">{buzzStatus}</div>}
        <small className="team-portal-note">Synchronisation Netlify active : les buzz et scores sont partagés entre les appareils.</small>
      </section>
    </main>
  )
}

function AdminLoginModal({ loginAdmin, onClose = null, onSuccess, canLaunch = false }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const result = await loginAdmin(password)
    if (!result.ok) { setError(result.message); return }
    onSuccess?.()
  }

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <form className="admin-modal glass" onSubmit={submit}>
        <div className="admin-modal-icon"><KeyRound size={24}/></div>
        <span className="summary-label">ACCÈS ADMINISTRATEUR</span>
        <h2>Console du challenge</h2>
        <p>Connexion requise pour lancer les manches et attribuer ou corriger les points.</p>
        <label><small>Mot de passe administrateur</small><input autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="Mot de passe"/></label>
        {error && <div className="admin-login-error">{error}</div>}
        <div className="admin-modal-actions">
          {onClose && <button className="secondary-btn" type="button" onClick={onClose}>Annuler</button>}
          <button className="primary-btn" type="submit"><LogIn size={17}/>{canLaunch ? 'Se connecter et lancer' : 'Se connecter'}</button>
        </div>
      </form>
    </div>
  )
}

function AccessGate({ loginAdmin, loginTeam, teams, screen, stage }) {
  const [showAdmin, setShowAdmin] = useState(false)
  return (
    <main className="access-gate-page">
      <section className="access-gate glass">
        <div className="brand access-brand"><div className="brand-icon"><Network size={19}/></div><div><strong>BOOTCAMP</strong><span>CHAMPION</span></div></div>
        <span className="summary-label">SESSION EN COURS</span>
        <h1>{stage === 'final' ? 'Grande finale' : 'Challenge en cours'}</h1>
        <p>Choisissez directement votre équipe pour rejoindre son buzzer. Aucun compte participant, aucun formulaire.</p>
        <TeamChoices teams={teams} loginTeam={loginTeam}/>
        <button className="secondary-btn admin-access-wide" onClick={() => setShowAdmin(true)}><KeyRound size={17}/> Accès administrateur</button>
        <small>État actuel : {screen} · {stage}</small>
      </section>
      {showAdmin && <AdminLoginModal loginAdmin={loginAdmin} onClose={() => setShowAdmin(false)} onSuccess={() => setShowAdmin(false)} />}
    </main>
  )
}

function AdminScorePanel({ teams, addScore, compact = false }) {
  const [custom, setCustom] = useState({})
  const applyCustom = (id) => {
    const value = Number(custom[id])
    if (!Number.isFinite(value) || value === 0) return
    addScore(id, value)
    setCustom(values => ({ ...values, [id]: '' }))
  }
  return (
    <details className={`admin-score-panel glass ${compact ? 'compact' : ''}`}>
      <summary><div><ShieldCheck size={16}/><span>Administration des points</span></div><small>Ajout / retrait manuel</small></summary>
      <div className="admin-score-grid">
        {teams.map(team => (
          <div className="admin-score-team" key={team.id}>
            <div className="admin-score-title"><span className={`mini-team-dot team-${team.id}`}/><strong>{team.name}</strong><b>{team.score} pts</b></div>
            <div className="admin-score-actions">
              <button onClick={() => addScore(team.id, -10)}><Minus size={13}/>10</button>
              <button onClick={() => addScore(team.id, -5)}><Minus size={13}/>5</button>
              <button onClick={() => addScore(team.id, 5)}><Plus size={13}/>5</button>
              <button onClick={() => addScore(team.id, 10)}><Plus size={13}/>10</button>
              <button onClick={() => addScore(team.id, 25)}><Plus size={13}/>25</button>
            </div>
            <div className="admin-score-custom">
              <input type="number" value={custom[team.id] ?? ''} onChange={e => setCustom(v => ({ ...v, [team.id]: e.target.value }))} placeholder="ex. 15 ou -5"/>
              <button onClick={() => applyCustom(team.id)}>Appliquer</button>
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}

function Background() {
  return <><div className="grid-bg"/><div className="glow glow-a"/><div className="glow glow-b"/></>
}

function Header({ stage, screen, resetAll, adminAuthenticated, logoutAdmin }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon"><Network size={19}/></div>
        <div><strong>BOOTCAMP</strong><span>CHAMPION</span></div>
      </div>
      <div className="header-actions">
        {screen !== 'home' && <div className="status-chip"><span className="live-dot"/>{stage === 'qualification' ? 'Qualifications · 3 équipes' : 'Finale · 2 équipes'}</div>}
        {adminAuthenticated && <div className="admin-chip"><ShieldCheck size={13}/> ADMIN</div>}
        {screen !== 'home' && adminAuthenticated && <button className="tiny-btn" onClick={resetAll}><RotateCcw size={14}/> Reset</button>}
        {adminAuthenticated && <button className="tiny-btn" onClick={logoutAdmin}><LogOut size={14}/> Déconnexion</button>}
      </div>
    </header>
  )
}

function Home({ teams, startCompetition, adminAuthenticated, loginAdmin, loginTeam }) {
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  const launch = async () => {
    if (!adminAuthenticated) { setShowAdminLogin(true); return }
    await startCompetition()
  }

  return (
    <main className="home-page home-self-service">
      <section className="hero-copy home-hero">
        <div className="eyebrow"><Activity size={14}/> CHALLENGE PRÊT</div>
        <h1>3 ÉQUIPES.<br/><span>2 PLACES EN FINALE.</span></h1>
        <p>Cookies, EVH et N4SC sont fixes. Chaque participant choisit directement son équipe et attend que l’administrateur lance la compétition.</p>
      </section>

      <section className="home-card glass">
        <div className="panel-heading">
          <div><span>01</span><h2>Choisir son équipe</h2></div>
          <Users size={23}/>
        </div>

        <TeamChoices teams={teams} loginTeam={loginTeam}/>

        <div className="home-note"><ShieldCheck size={17}/><span>Aucun compte participant à créer. Les scores vivent uniquement en mémoire du serveur pendant la session.</span></div>
        {!adminAuthenticated && <button className="secondary-btn admin-access-wide" type="button" onClick={() => setShowAdminLogin(true)}><KeyRound size={16}/> Accès administrateur</button>}
        {adminAuthenticated && <div className="admin-ready-panel">
          <div><ShieldCheck size={19}/><span><strong>Mode administrateur actif</strong><small>Mot de passe validé · la compétition peut démarrer</small></span></div>
          <button className="primary-btn launch-competition" onClick={launch}><Play size={17}/> Lancer les qualifications</button>
        </div>}
        {showAdminLogin && <AdminLoginModal loginAdmin={loginAdmin} onClose={() => setShowAdminLogin(false)} onSuccess={() => setShowAdminLogin(false)} canLaunch={false}/>}
      </section>
    </main>
  )
}

function Lobby({ stage, teams, modes, startMode, closeQualifications, finishFinal, qualificationSnapshot, addScore }) {
  const ordered = [...teams].sort((a, b) => b.score - a.score)
  return (
    <main className="lobby-page">
      <section className="lobby-heading">
        <div>
          <div className="eyebrow"><Sparkles size={14}/>{stage === 'qualification' ? 'PHASE 1' : 'PHASE 2'}</div>
          <h1>{stage === 'qualification' ? 'QUALIFICATIONS' : 'GRANDE FINALE'}</h1>
          <p>{stage === 'qualification' ? 'Les trois équipes accumulent des points. Quand vous le décidez, vous qualifiez exactement deux équipes.' : 'Les scores ont été remis à zéro pour le duel final.'}</p>
        </div>
        <div className="phase-badge">{stage === 'qualification' ? '3 → 2' : '2 → 1'}</div>
      </section>

      <Scoreboard teams={teams} compact={false}/>
      <AdminScorePanel teams={teams} addScore={addScore}/>

      <section className="mode-section glass">
        <div className="section-title"><div><span>02</span><h2>Épreuves dans l’ordre</h2></div><p>{stage === 'qualification' ? 'Quiz → Champion → Live Bash → Live Python' : 'Quiz final → Champion final → Bash → Python'}</p></div>
        <div className={`mode-grid ${modes.length === 2 ? 'two' : ''}`}>
          {modes.map((mode, idx) => {
            const Icon = mode.icon
            return (
              <button className={`mode-card ${mode.tone}`} key={mode.id} onClick={() => startMode(mode.id)}>
                <div className="mode-number">{mode.meta || `0${idx + 1}`}</div>
                <div className="mode-icon"><Icon size={27}/></div>
                <div className="mode-copy"><h3>{mode.title}</h3><p>{mode.subtitle}</p></div>
                <ChevronRight className="mode-arrow" size={22}/>
              </button>
            )
          })}
        </div>
      </section>

      <section className="lobby-footer glass">
        <div className="leader-mini">
          <span>{stage === 'qualification' ? 'Classement actuel' : 'Duel actuel'}</span>
          <strong>{ordered.map((t, i) => `${i + 1}. ${t.name} · ${t.score} pts`).join('  /  ')}</strong>
        </div>
        {stage === 'qualification' ? (
          <button className="primary-btn amber-btn" onClick={closeQualifications}><Crown size={18}/> Clôturer et choisir les 2 finalistes</button>
        ) : (
          <button className="primary-btn amber-btn" onClick={finishFinal}><Trophy size={18}/> Terminer la finale</button>
        )}
      </section>

      {stage === 'final' && qualificationSnapshot.length > 0 && (
        <div className="qualification-memory">Qualifications : {qualificationSnapshot.map((t, i) => `${i + 1}. ${t.name} (${t.score})`).join(' · ')}</div>
      )}
    </main>
  )
}

function Scoreboard({ teams, compact = true }) {
  const ordered = [...teams].sort((a, b) => b.score - a.score)
  return (
    <section className={`scoreboard glass ${compact ? 'compact' : ''}`}>
      {teams.map((team) => {
        const rank = ordered.findIndex(t => t.id === team.id) + 1
        return (
          <div className="score-team" key={team.id}>
            <div className={`team-orb team-${team.id}`}>{rank === 1 ? <Crown size={20}/> : <span>{rank}</span>}</div>
            <div className="score-copy"><span>{team.name}</span><strong>{team.score}</strong></div>
            <small>PTS</small>
          </div>
        )
      })}
    </section>
  )
}

function FinalistSelection({ teams, finalists, setFinalists, confirm, back }) {
  const ordered = [...teams].sort((a, b) => b.score - a.score)
  const toggle = id => {
    setFinalists(current => {
      if (current.includes(id)) return current.filter(x => x !== id)
      if (current.length >= 2) return current
      return [...current, id]
    })
  }
  return (
    <main className="selection-page">
      <section className="selection-card glass">
        <div className="selection-icon"><Crown size={36}/></div>
        <span className="summary-label">FIN DES QUALIFICATIONS</span>
        <h1>CHOISISSEZ LES 2 FINALISTES</h1>
        <p>Les deux meilleurs sont pré-sélectionnés automatiquement, mais l’animateur peut modifier ce choix en cas d’égalité ou selon le règlement.</p>
        <div className="finalist-list">
          {ordered.map((team, i) => (
            <button key={team.id} className={finalists.includes(team.id) ? 'selected' : ''} onClick={() => toggle(team.id)}>
              <div className="rank-pill">#{i + 1}</div>
              <div><strong>{team.name}</strong><span>{team.score} points</span></div>
              <div className="select-mark">{finalists.includes(team.id) ? <Check size={18}/> : <span/>}</div>
            </button>
          ))}
        </div>
        <div className="selection-actions">
          <button className="secondary-btn" onClick={back}>Retour</button>
          <button className="primary-btn" disabled={finalists.length !== 2} onClick={confirm}>Démarrer la finale <ChevronRight size={18}/></button>
        </div>
        <div className="reset-score-note"><RotateCcw size={15}/> Les deux finalistes repartent à 0 point en finale. Le classement des qualifications reste mémorisé.</div>
      </section>
    </main>
  )
}

function GameShell({ mode, question, index, total, teams, addScore, next, roundDone, returnToLobby, adminAuthenticated }) {
  if (roundDone) return <RoundSummary teams={teams} returnToLobby={returnToLobby}/>
  return (
    <main className="game-page">
      <div className="game-topline">
        <button className="ghost-btn" onClick={returnToLobby}>← Tableau de bord</button>
        <div className="progress-wrap"><span>Challenge {index + 1}/{total}</span><div className="progress"><i style={{ width: `${((index + 1) / total) * 100}%` }}/></div></div>
        <div className="difficulty"><Gauge size={16}/> Bootcamp</div>
      </div>
      <Scoreboard teams={teams}/>
      {adminAuthenticated && <AdminScorePanel teams={teams} addScore={addScore} compact/>}
      {(mode === 'champion' || mode === 'finalChampion') && <ChampionRound question={question} teams={teams} addScore={addScore} next={next} finalMode={mode === 'finalChampion'}/>}
      {(mode === 'quiz' || mode === 'finalQuiz') && <QcmRound question={question} teams={teams} addScore={addScore} next={next} seconds={mode === 'finalQuiz' ? 35 : 25} basePoints={mode === 'finalQuiz' ? 40 : 25} finalMode={mode === 'finalQuiz'}/>}
      {(['bash', 'python', 'finalBash', 'finalPython'].includes(mode)) && <LiveCodeRound challenge={question} teams={teams} addScore={addScore} next={next} finalMode={mode.startsWith('final')}/>} 
    </main>
  )
}

function ChampionRound({ question, teams, addScore, next, finalMode = false }) {
  const [clueCount, setClueCount] = useState(1)
  const [time, setTime] = useState(7)
  const [buzzed, setBuzzed] = useState(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)
  const points = [40, 30, 20, 10][Math.min(clueCount - 1, 3)]

  useEffect(() => {
    setClueCount(1); setTime(7); setBuzzed(null); setAnswer(''); setResult(null)
  }, [question])

  useEffect(() => {
    if (buzzed !== null || result) return
    const timer = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          if (clueCount < 4) setClueCount(c => c + 1)
          return 7
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [buzzed, result, clueCount])

  useEffect(() => {
    const onKey = e => {
      if (result || buzzed !== null || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
      const idx = KEYS.indexOf(e.key.toLowerCase())
      const team = teams.find(t => t.id === idx)
      if (team) claim(team.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const take = id => { const team = teams.find(t => t.id === Number(id)); if (team && buzzed === null && !result) acceptBuzz(team.id) }
    const onCustom = e => take(e.detail?.teamId)
    window.addEventListener('bootcamp-team-buzz', onCustom)
    return () => { window.removeEventListener('bootcamp-team-buzz', onCustom) }
  }, [buzzed, result, teams])

  const acceptBuzz = id => {
    if (buzzed !== null || result) return
    setBuzzed(id)
    beep(540 + id * 110, .12)
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const claim = async id => {
    if (buzzed !== null || result) return
    const response = await emitAdminBuzz(id)
    if (response.ok) acceptBuzz(id)
  }

  const validate = e => {
    e.preventDefault()
    const ok = question.accepted.some(a => normalize(a) === normalize(answer))
    setResult(ok ? 'correct' : 'wrong')
    addScore(buzzed, ok ? points : -10)
    beep(ok ? 860 : 180, .18)
  }

  const buzzedTeam = teams.find(t => t.id === buzzed)

  return (
    <section className="challenge-card glass champion-card">
      <div className="challenge-meta"><span className="category"><CircleHelp size={15}/>{question.category}</span><span className="points">{points} points en jeu</span></div>
      <div className="champion-title"><span>{finalMode ? 'QUESTION POUR UN CHAMPION · FINALE' : 'QUESTION POUR UN CHAMPION'}</span><h2>Qui suis-je ?</h2><small>{question.level}</small></div>
      <div className="clues">
        {question.clues.slice(0, clueCount).map((clue, i) => <div className="clue" key={i}><b>0{i + 1}</b><p>{clue}</p></div>)}
        {question.clues.slice(clueCount).map((_, i) => <div className="clue locked" key={`l${i}`}><b>0{clueCount + i + 1}</b><p>Indice verrouillé</p></div>)}
      </div>

      {!result && buzzed === null && <div className="buzzer-zone">
        <div className="countdown"><Clock3 size={20}/><strong>{time}s</strong><span>avant l’indice suivant</span></div>
        <div className={`buzz-buttons cols-${teams.length}`}>
          {teams.map(team => <button key={team.id} onClick={() => claim(team.id)}><kbd>{KEY_LABELS[team.id]}</kbd><span>{team.name}</span><b>BUZZ</b></button>)}
        </div>
      </div>}

      {!result && buzzed !== null && <form className="answer-panel" onSubmit={validate}>
        <div><span>Équipe au buzzer</span><strong>{buzzedTeam?.name}</strong></div>
        <input ref={inputRef} placeholder="Réponse de l’équipe…" value={answer} onChange={e => setAnswer(e.target.value)}/>
        <button type="submit" disabled={!answer.trim()}>Valider</button>
      </form>}

      {result && <Feedback result={result} answer={question.answer} explanation={question.explanation} onNext={next}/>} 
    </section>
  )
}

function QcmRound({ question, teams, addScore, next, seconds, basePoints, finalMode }) {
  const [time, setTime] = useState(seconds)
  const [buzzed, setBuzzed] = useState(null)
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => { setTime(seconds); setBuzzed(null); setSelected(null); setResult(null) }, [question, seconds])

  useEffect(() => {
    if (result) return
    const timer = setInterval(() => setTime(t => {
      if (t <= 1) { setResult('timeout'); return 0 }
      return t - 1
    }), 1000)
    return () => clearInterval(timer)
  }, [result])

  useEffect(() => {
    const onKey = e => {
      if (result || buzzed !== null || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
      const id = KEYS.indexOf(e.key.toLowerCase())
      if (teams.some(t => t.id === id)) claim(id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [buzzed, result, teams])

  useEffect(() => {
    const take = id => { id = Number(id); if (!result && buzzed === null && teams.some(t => t.id === id)) acceptBuzz(id) }
    const onCustom = e => take(e.detail?.teamId)
    window.addEventListener('bootcamp-team-buzz', onCustom)
    return () => { window.removeEventListener('bootcamp-team-buzz', onCustom) }
  }, [buzzed, result, teams])

  const acceptBuzz = id => {
    if (result || buzzed !== null) return
    setBuzzed(id)
    beep(560 + id * 110, .12)
  }

  const claim = async id => {
    if (result || buzzed !== null) return
    const response = await emitAdminBuzz(id)
    if (response.ok) acceptBuzz(id)
  }

  const validate = () => {
    if (selected === null || buzzed === null) return
    const ok = selected === question.correct
    setResult(ok ? 'correct' : 'wrong')
    addScore(buzzed, ok ? basePoints + Math.ceil(time / 4) : -5)
    beep(ok ? 850 : 200, .15)
  }

  const buzzedTeam = teams.find(t => t.id === buzzed)

  return (
    <section className={`challenge-card glass qcm-card ${finalMode ? 'final-card' : ''}`}>
      <div className="challenge-meta"><span className="category"><Binary size={15}/>{question.category}</span><span className="timer-pill"><Clock3 size={15}/>{time}s</span></div>
      <div className="qcm-head"><span>{finalMode ? 'QUIZ FINAL' : 'QUIZ · CHOIX MULTIPLE'}</span><h2>{question.question}</h2><small>{question.level}</small></div>
      {buzzed === null && !result && <div className="qcm-buzz-first"><span>BUZZ AVANT DE RÉPONDRE</span><div className={`buzz-buttons cols-${teams.length}`}>{teams.map(team => <button key={team.id} onClick={() => claim(team.id)}><kbd>{KEY_LABELS[team.id]}</kbd><span>{team.name}</span><b>BUZZ</b></button>)}</div></div>}
      {buzzed !== null && !result && <div className="qcm-lockline"><Zap size={16}/><span>{buzzedTeam?.name} a le buzzer — choisissez une réponse</span></div>}
      <div className="qcm-options">
        {question.options.map((opt, i) => (
          <button className={`${selected === i ? 'selected' : ''} ${result && i === question.correct ? 'is-correct' : ''} ${result && selected === i && i !== question.correct ? 'is-wrong' : ''}`} key={opt} onClick={() => !result && buzzed !== null && setSelected(i)} disabled={!!result || buzzed === null}>
            <b>{String.fromCharCode(65 + i)}</b><span>{opt}</span>
          </button>
        ))}
      </div>
      {!result && buzzed !== null && <div className="qcm-actionbar">
        <div className="team-selector"><span>Réponse de</span><strong>{buzzedTeam?.name}</strong></div>
        <button className="primary-btn" disabled={selected === null} onClick={validate}>Valider <ChevronRight size={18}/></button>
      </div>}
      {result === 'timeout' && <Feedback result="wrong" answer={question.options[question.correct]} explanation={`Temps écoulé. ${question.explanation}`} onNext={next}/>} 
      {(result === 'correct' || result === 'wrong') && <Feedback result={result} answer={question.options[question.correct]} explanation={question.explanation} onNext={next}/>} 
    </section>
  )
}

function LiveCodeRound({ challenge, teams, addScore, next, finalMode }) {
  const [buzzed, setBuzzed] = useState(null)
  const [showRubric, setShowRubric] = useState(false)
  const [custom, setCustom] = useState('')
  const [awarded, setAwarded] = useState(false)
  const [remaining, setRemaining] = useState(challenge.time)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    setBuzzed(null); setShowRubric(false); setCustom(''); setAwarded(false); setRemaining(challenge.time); setRunning(true)
  }, [challenge])

  useEffect(() => {
    if (!running || remaining <= 0 || awarded) return
    const timer = setInterval(() => setRemaining(v => Math.max(0, v - 1)), 1000)
    return () => clearInterval(timer)
  }, [running, remaining, awarded])

  useEffect(() => {
    const onKey = e => {
      if (buzzed !== null || awarded || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
      const id = KEYS.indexOf(e.key.toLowerCase())
      if (teams.some(t => t.id === id)) claim(id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const take = id => { id = Number(id); if (buzzed === null && !awarded && teams.some(t => t.id === id)) acceptBuzz(id) }
    const onCustom = e => take(e.detail?.teamId)
    window.addEventListener('bootcamp-team-buzz', onCustom)
    return () => { window.removeEventListener('bootcamp-team-buzz', onCustom) }
  }, [buzzed, awarded, teams])

  const acceptBuzz = id => {
    if (buzzed !== null || awarded) return
    setBuzzed(id)
    setRunning(false)
    beep(620 + id * 90, .14)
  }

  const claim = async id => {
    if (buzzed !== null || awarded) return
    const response = await emitAdminBuzz(id)
    if (response.ok) acceptBuzz(id)
  }

  const award = points => {
    if (buzzed === null || awarded) return
    addScore(buzzed, Number(points))
    setAwarded(true)
    beep(Number(points) > 0 ? 900 : 230, .16)
  }

  const buzzedTeam = teams.find(t => t.id === buzzed)
  const min = String(Math.floor(remaining / 60)).padStart(2, '0')
  const sec = String(remaining % 60).padStart(2, '0')
  const presets = [challenge.points, Math.ceil(challenge.points / 2), 10, 0]

  return (
    <section className={`challenge-card glass live-card ${finalMode ? 'final-card' : ''}`}>
      <div className="challenge-meta">
        <span className="category"><TerminalSquare size={15}/>{challenge.category}</span>
        <span className="points">Barème maximum : {challenge.points} pts</span>
      </div>

      <div className="live-layout">
        <div className="live-main">
          <div className="live-title"><span>{finalMode ? 'LIVE CODE · FINALE' : 'LIVE CODE · QUALIFICATIONS'}</span><h2>{challenge.title}</h2><small>{challenge.level} · chrono automatique</small></div>
          <div className="terminal-card">
            <div className="terminal-bar"><span/><span/><span/><b>challenge://bootcamp</b></div>
            <div className="terminal-content"><em>$ mission</em><p>{challenge.prompt}</p></div>
          </div>
          <div className="constraint-grid">
            {challenge.constraints.map((item, i) => <div key={item}><span>{String(i + 1).padStart(2, '0')}</span><p>{item}</p></div>)}
          </div>
        </div>

        <aside className="host-panel">
          <div className="host-head"><div><ShieldCheck size={17}/><span>Console administrateur</span></div><small>Évaluation manuelle</small></div>
          <div className="timer-control">
            <div><Clock3 size={19}/><strong>{min}:{sec}</strong></div>
            <div>
              <button onClick={() => setRunning(v => !v)} disabled={remaining === 0 || awarded}>{running ? <Pause size={15}/> : <Play size={15}/>}</button>
              <button onClick={() => { setRemaining(challenge.time); setRunning(false) }} disabled={awarded}><RotateCcw size={15}/></button>
            </div>
          </div>

          {buzzed === null && !awarded && <div className="claim-zone">
            <span>Une équipe clique seulement sur « Je réponds ».</span>
            <div className="claim-buttons">
              {teams.map(team => <button key={team.id} onClick={() => claim(team.id)}><kbd>{KEY_LABELS[team.id]}</kbd><strong>{team.name}</strong><small>JE RÉPONDS</small></button>)}
            </div>
          </div>}

          {buzzed !== null && !awarded && <div className="award-zone">
            <div className="buzz-lock"><Zap size={18}/><div><span>Réponse verrouillée</span><strong>{buzzedTeam?.name}</strong></div></div>
            <p>Écoutez ou observez le code dans le terminal, puis attribuez vous-même les points.</p>
            <div className="preset-grid">
              {presets.map((pts, i) => <button key={`${pts}-${i}`} onClick={() => award(pts)} className={pts === challenge.points ? 'max' : ''}>{pts > 0 ? `+${pts}` : '0'} pts</button>)}
            </div>
            <div className="custom-score"><input type="number" min="0" max={challenge.points} value={custom} onChange={e => setCustom(e.target.value)} placeholder="Points personnalisés"/><button onClick={() => award(custom)} disabled={custom === ''}>Attribuer</button></div>
            <button className="release-btn" onClick={async () => { await releaseAdminBuzz(); setBuzzed(null); setRunning(true) }}><RotateCcw size={14}/> Libérer le buzzer sans point</button>
          </div>}

          <button className="rubric-btn" onClick={() => setShowRubric(v => !v)}>{showRubric ? <X size={15}/> : <CircleHelp size={15}/>} {showRubric ? 'Masquer la grille' : 'Afficher la grille de correction'}</button>
          {showRubric && <div className="rubric"><span>Éléments attendus</span>{challenge.expected.map(item => <div key={item}><Check size={13}/><code>{item}</code></div>)}<p>{challenge.note}</p></div>}

          {awarded && <div className="award-confirm"><Award size={26}/><strong>Points enregistrés</strong><span>Le score a été mis à jour par l’animateur.</span><button className="primary-btn" onClick={next}>Challenge suivant <ChevronRight size={17}/></button></div>}
        </aside>
      </div>
    </section>
  )
}

function Feedback({ result, answer, explanation, onNext }) {
  return (
    <div className={`feedback ${result}`}>
      <div className="feedback-icon">{result === 'correct' ? <Award/> : <RotateCcw/>}</div>
      <div><span>{result === 'correct' ? 'Bonne réponse' : 'Réponse incorrecte'}</span><strong>{answer}</strong><p>{explanation}</p></div>
      <button onClick={onNext}>Suivante <ChevronRight size={18}/></button>
    </div>
  )
}

function RoundSummary({ teams, returnToLobby }) {
  const ordered = [...teams].sort((a, b) => b.score - a.score)
  return (
    <main className="summary-page">
      <section className="summary-card glass">
        <div className="trophy-wrap"><Medal size={48}/></div>
        <span className="summary-label">MANCHE TERMINÉE</span>
        <h1>{ordered[0]?.name} est en tête</h1>
        <p>Les scores restent cumulés jusqu’à ce que l’animateur clôture la phase.</p>
        <div className={`summary-scores count-${teams.length}`}>
          {ordered.map((team, i) => <div className={i === 0 ? 'winner' : ''} key={team.id}><div className="rank-pill">#{i + 1}</div><span>{team.name}</span><strong>{team.score}</strong><small>points</small></div>)}
        </div>
        <button className="primary-btn" onClick={returnToLobby}>Retour au tableau de bord <ChevronRight size={18}/></button>
      </section>
    </main>
  )
}

function WinnerScreen({ teams, qualificationSnapshot, resetAll }) {
  const ordered = [...teams].sort((a, b) => b.score - a.score)
  const winner = ordered[0]
  return (
    <main className="winner-page">
      <section className="winner-card glass">
        <div className="winner-crown"><Trophy size={64}/></div>
        <span className="summary-label">BOOTCAMP CHAMPION</span>
        <h1>{winner?.name}</h1>
        <div className="winner-score">{winner?.score}<span>PTS</span></div>
        <div className="final-duel">
          {ordered.map((team, i) => <div key={team.id}><span>#{i + 1}</span><strong>{team.name}</strong><b>{team.score} pts</b></div>)}
        </div>
        {qualificationSnapshot.length > 0 && <p className="winner-memory">Qualifications : {qualificationSnapshot.map((t, i) => `${i + 1}. ${t.name} — ${t.score} pts`).join(' · ')}</p>}
        <button className="primary-btn" onClick={resetAll}>Nouvelle compétition</button>
      </section>
    </main>
  )
}
