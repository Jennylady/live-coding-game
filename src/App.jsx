import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, Award, Binary, BrainCircuit, Check, ChevronRight, CircleHelp,
  Clock3, Code2, Crown, Gauge, Medal, Network, Pause, Play, RotateCcw,
  Settings2, ShieldCheck, Sparkles, Swords, TerminalSquare, Trophy, Users,
  UserPlus, Trash2, X, Zap, KeyRound, LogIn, LogOut, Plus, Minus
} from 'lucide-react'
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
const DEFAULT_ADMIN = { username: 'admin', password: 'admin12' }
const STATE_KEY = 'bootcamp-champion-state-v6'
const ADMIN_KEY = 'bootcamp-champion-admin-v6'
const TEAM_KEY = 'bootcamp-champion-team-v6'
const BUZZ_KEY = 'bootcamp-champion-buzz-v6'

const emptyTeams = () => [
  { id: 0, name: '', members: [], score: 0, registered: false, accessCode: '' },
  { id: 1, name: '', members: [], score: 0, registered: false, accessCode: '' },
  { id: 2, name: '', members: [], score: 0, registered: false, accessCode: '' },
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

function emitTeamBuzz(teamId) {
  const payload = { teamId, at: Date.now(), nonce: Math.random().toString(36).slice(2) }
  try { localStorage.setItem(BUZZ_KEY, JSON.stringify(payload)) } catch {}
  window.dispatchEvent(new CustomEvent('bootcamp-team-buzz', { detail: payload }))
}

export default function App() {
  const [screen, setScreen] = useState('registration')
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

  useEffect(() => {
    setAdminAuthenticated(sessionStorage.getItem(ADMIN_KEY) === '1')
    const rawTeam = sessionStorage.getItem(TEAM_KEY)
    if (rawTeam !== null && rawTeam !== '') setTeamSessionId(Number(rawTeam))
    const saved = localStorage.getItem(STATE_KEY)
    if (!saved) return
    try {
      const state = JSON.parse(saved)
      if (state?.teams?.length === 3) setTeams(state.teams.map(t => ({ accessCode: '', ...t })))
      if (Array.isArray(state?.finalists)) setFinalists(state.finalists)
      if (Array.isArray(state?.qualificationSnapshot)) setQualificationSnapshot(state.qualificationSnapshot)
      if (['registration', 'lobby', 'finalists', 'winner', 'game'].includes(state?.screen)) setScreen(state.screen)
      if (['qualification', 'final'].includes(state?.stage)) setStage(state.stage)
      if (state?.activeMode) { setActiveMode(state.activeMode); setQuestionSet([...questionsForMode(state.activeMode)]) }
      if (Number.isInteger(state?.index)) setIndex(state.index)
      if (typeof state?.roundDone === 'boolean') setRoundDone(state.roundDone)
    } catch {}
  }, [])

  useEffect(() => {
    const serialized = JSON.stringify({ teams, finalists, qualificationSnapshot, screen, stage, activeMode, index, roundDone })
    if (localStorage.getItem(STATE_KEY) !== serialized) localStorage.setItem(STATE_KEY, serialized)
  }, [teams, finalists, qualificationSnapshot, screen, stage, activeMode, index, roundDone])

  useEffect(() => {
    const sync = event => {
      if (event.key !== STATE_KEY || !event.newValue) return
      try {
        const state = JSON.parse(event.newValue)
        if (state?.teams?.length === 3) setTeams(state.teams.map(t => ({ accessCode: '', ...t })))
        if (Array.isArray(state?.finalists)) setFinalists(state.finalists)
        if (Array.isArray(state?.qualificationSnapshot)) setQualificationSnapshot(state.qualificationSnapshot)
        if (['registration', 'lobby', 'finalists', 'winner', 'game'].includes(state?.screen)) setScreen(state.screen)
        if (['qualification', 'final'].includes(state?.stage)) setStage(state.stage)
        if (state?.activeMode) { setActiveMode(state.activeMode); setQuestionSet([...questionsForMode(state.activeMode)]) }
        if (Number.isInteger(state?.index)) setIndex(state.index)
        if (typeof state?.roundDone === 'boolean') setRoundDone(state.roundDone)
      } catch {}
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const activeTeamIds = stage === 'final' ? finalists : teams.map(t => t.id)
  const visibleTeams = teams.filter(t => activeTeamIds.includes(t.id))

  const registerTeam = ({ name, members, accessCode }) => {
    const cleanName = name.trim()
    const cleanMembers = members.map(member => member.trim()).filter(Boolean)
    const cleanCode = accessCode.trim()
    if (!cleanName) return { ok: false, message: "Entrez le nom de l'équipe." }
    if (!cleanMembers.length) return { ok: false, message: 'Ajoutez au moins un membre.' }
    if (cleanCode.length < 4) return { ok: false, message: 'Choisissez un code équipe d’au moins 4 caractères.' }
    if (teams.some(team => team.registered && normalize(team.name) === normalize(cleanName))) {
      return { ok: false, message: 'Ce nom d’équipe est déjà inscrit.' }
    }
    const slot = teams.find(team => !team.registered)
    if (!slot) return { ok: false, message: 'Les 3 places sont déjà occupées.' }
    setTeams(list => list.map(team => team.id === slot.id ? { ...team, name: cleanName, members: cleanMembers, registered: true, score: 0, accessCode: cleanCode } : team))
    return { ok: true, teamId: slot.id }
  }

  const unregisterTeam = (id) => {
    setTeams(list => list.map(team => team.id === id ? { id: team.id, name: '', members: [], score: 0, registered: false, accessCode: '' } : team))
  }

  const addScore = (id, points) => setTeams(list => list.map(team => team.id === id ? { ...team, score: Math.max(0, team.score + Number(points || 0)) } : team))

  const loginAdmin = (username, password) => {
    if (username.trim() !== DEFAULT_ADMIN.username || password !== DEFAULT_ADMIN.password) {
      return { ok: false, message: 'Identifiant ou mot de passe incorrect.' }
    }
    sessionStorage.setItem(ADMIN_KEY, '1')
    sessionStorage.removeItem(TEAM_KEY)
    setTeamSessionId(null)
    setAdminAuthenticated(true)
    return { ok: true }
  }

  const logoutAdmin = () => {
    sessionStorage.removeItem(ADMIN_KEY)
    setAdminAuthenticated(false)
  }

  const loginTeam = (name, accessCode) => {
    const found = teams.find(team => team.registered && normalize(team.name) === normalize(name) && team.accessCode === accessCode)
    if (!found) return { ok: false, message: 'Nom d’équipe ou code de connexion incorrect.' }
    sessionStorage.removeItem(ADMIN_KEY)
    setAdminAuthenticated(false)
    sessionStorage.setItem(TEAM_KEY, String(found.id))
    setTeamSessionId(found.id)
    return { ok: true, teamId: found.id }
  }

  const logoutTeam = () => {
    sessionStorage.removeItem(TEAM_KEY)
    setTeamSessionId(null)
  }

  const startCompetition = (forceAdmin = false) => {
    if (!adminAuthenticated && !forceAdmin) return false
    if (teams.filter(team => team.registered).length !== 3) return false
    setTeams(list => list.map(team => ({ ...team, score: 0 })))
    setFinalists([])
    setQualificationSnapshot([])
    setStage('qualification')
    setScreen('lobby')
    return true
  }

  const startMode = (mode) => {
    const set = questionsForMode(mode)
    // Ordre pédagogique conservé : du plus accessible au plus technique.
    setQuestionSet([...set])
    setIndex(0)
    setRoundDone(false)
    setActiveMode(mode)
    setScreen('game')
  }

  const next = () => {
    if (index + 1 >= questionSet.length) setRoundDone(true)
    else setIndex(i => i + 1)
  }

  const returnToLobby = () => {
    setRoundDone(false)
    setScreen('lobby')
  }

  const closeQualifications = () => {
    const ordered = [...teams].sort((a, b) => b.score - a.score)
    setQualificationSnapshot(ordered.map(t => ({ ...t })))
    setFinalists([ordered[0].id, ordered[1].id])
    setScreen('finalists')
  }

  const confirmFinalists = () => {
    if (finalists.length !== 2) return
    setTeams(list => list.map(team => ({ ...team, score: finalists.includes(team.id) ? 0 : team.score })))
    setStage('final')
    setScreen('lobby')
  }

  const resetAll = () => {
    localStorage.removeItem(STATE_KEY)
    localStorage.removeItem(BUZZ_KEY)
    sessionStorage.removeItem(TEAM_KEY)
    setTeamSessionId(null)
    setTeams(emptyTeams())
    setFinalists([])
    setQualificationSnapshot([])
    setStage('qualification')
    setScreen('registration')
    setActiveMode(null)
    setQuestionSet([])
    setIndex(0)
    setRoundDone(false)
  }

  if (teamSessionId !== null && !adminAuthenticated) {
    const team = teams.find(t => t.id === teamSessionId && t.registered)
    if (team) {
      return (
        <div className="app-shell">
          <Background />
          <TeamPortal team={team} screen={screen} stage={stage} activeMode={activeMode} index={index} logoutTeam={logoutTeam} />
        </div>
      )
    }
  }

  if (screen !== 'registration' && !adminAuthenticated) {
    return (
      <div className="app-shell">
        <Background />
        <Header stage={stage} screen={screen} resetAll={resetAll} adminAuthenticated={false} logoutAdmin={logoutAdmin} />
        <AdminLock loginAdmin={loginAdmin} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Background />
      <Header stage={stage} screen={screen} resetAll={resetAll} adminAuthenticated={adminAuthenticated} logoutAdmin={logoutAdmin} />

      {screen === 'registration' && (
        <Registration teams={teams} registerTeam={registerTeam} unregisterTeam={unregisterTeam} startCompetition={startCompetition} adminAuthenticated={adminAuthenticated} loginAdmin={loginAdmin} loginTeam={loginTeam} />
      )}

      {screen === 'lobby' && (
        <Lobby
          stage={stage}
          teams={visibleTeams}
          modes={stage === 'qualification' ? QUAL_MODES : FINAL_MODES}
          startMode={startMode}
          closeQualifications={closeQualifications}
          finishFinal={() => setScreen('winner')}
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
          back={() => setScreen('lobby')}
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


function TeamLoginModal({ loginTeam, onClose }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const submit = e => {
    e.preventDefault()
    const result = loginTeam(name, code)
    if (!result.ok) { setError(result.message); return }
    onClose?.()
  }
  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <form className="admin-modal team-login-modal glass" onSubmit={submit}>
        <div className="admin-modal-icon team-icon"><Users size={24}/></div>
        <span className="summary-label">CONNEXION ÉQUIPE</span>
        <h2>Entrer dans le challenge</h2>
        <p>Utilisez le nom exact de votre équipe et le code choisi lors de l’inscription.</p>
        <label><small>Nom de l’équipe</small><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Root Force"/></label>
        <label><small>Code équipe</small><input type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="Votre code"/></label>
        {error && <div className="admin-login-error">{error}</div>}
        <div className="admin-modal-actions">
          <button className="secondary-btn" type="button" onClick={onClose}>Annuler</button>
          <button className="primary-btn" type="submit"><LogIn size={17}/> Connexion équipe</button>
        </div>
      </form>
    </div>
  )
}

function TeamPortal({ team, screen, stage, activeMode, index, logoutTeam }) {
  const canBuzz = screen === 'game'
  const labels = {
    quiz: 'Quiz · choix multiple', champion: 'Question pour un champion', bash: 'Live Code · Bash', python: 'Live Code · Python système',
    finalQuiz: 'Quiz final', finalChampion: 'Champion final', finalBash: 'Bash final', finalPython: 'Python final'
  }
  return (
    <main className="team-portal-page">
      <section className="team-portal glass">
        <div className="team-portal-top">
          <div className="brand"><div className="brand-icon"><Network size={19}/></div><div><strong>BOOTCAMP</strong><span>CHAMPION</span></div></div>
          <button className="tiny-btn" onClick={logoutTeam}><LogOut size={14}/> Quitter</button>
        </div>
        <div className={`team-portal-orb team-${team.id}`}><Users size={31}/></div>
        <span className="summary-label">ESPACE ÉQUIPE</span>
        <h1>{team.name}</h1>
        <p>{team.members.join(' · ')}</p>
        <div className="team-portal-stats">
          <div><span>Score</span><strong>{team.score}</strong><small>pts</small></div>
          <div><span>Buzzer</span><strong>{KEY_LABELS[team.id]}</strong><small>touche</small></div>
          <div><span>Phase</span><strong>{stage === 'qualification' ? 'QUALIF' : 'FINALE'}</strong><small>{screen}</small></div>
        </div>
        <div className={`team-status-card ${canBuzz ? 'live' : ''}`}>
          {canBuzz ? <><Zap size={19}/><div><strong>{labels[activeMode] || 'Épreuve en cours'}</strong><span>Challenge {index + 1} · buzzez quand votre équipe souhaite répondre.</span></div></> : <><Clock3 size={19}/><div><strong>En attente de l’animateur</strong><span>{screen === 'registration' ? 'Les inscriptions sont encore ouvertes.' : 'Attendez le lancement de la prochaine épreuve.'}</span></div></>}
        </div>
        <button className={`team-buzz-big ${canBuzz ? 'ready' : ''}`} disabled={!canBuzz} onClick={() => emitTeamBuzz(team.id)}>
          <Zap size={31}/><span>{canBuzz ? 'JE RÉPONDS / BUZZ' : 'BUZZER EN ATTENTE'}</span><kbd>{KEY_LABELS[team.id]}</kbd>
        </button>
        <small className="team-portal-note">Cette version synchronise les onglets ouverts sur le même navigateur/origine. Pour plusieurs téléphones/PC indépendants, utilisez ensuite la version serveur temps réel.</small>
      </section>
    </main>
  )
}

function AdminLoginModal({ loginAdmin, onClose = null, onSuccess, canLaunch = false }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin12')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const result = loginAdmin(username, password)
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
        <label><small>Identifiant</small><input autoFocus value={username} onChange={e => setUsername(e.target.value)} autoComplete="username"/></label>
        <label><small>Mot de passe</small><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="Mot de passe"/></label>
        {error && <div className="admin-login-error">{error}</div>}
        <div className="admin-modal-actions">
          {onClose && <button className="secondary-btn" type="button" onClick={onClose}>Annuler</button>}
          <button className="primary-btn" type="submit"><LogIn size={17}/>{canLaunch ? 'Se connecter et lancer' : 'Se connecter'}</button>
        </div>
      </form>
    </div>
  )
}

function AdminLock({ loginAdmin }) {
  return <AdminLoginModal loginAdmin={loginAdmin} onSuccess={() => {}} />
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
        {screen !== 'registration' && <div className="status-chip"><span className="live-dot"/>{stage === 'qualification' ? 'Qualifications · 3 équipes' : 'Finale · 2 équipes'}</div>}
        {adminAuthenticated && <div className="admin-chip"><ShieldCheck size={13}/> ADMIN</div>}
        {screen !== 'registration' && adminAuthenticated && <button className="tiny-btn" onClick={resetAll}><RotateCcw size={14}/> Reset</button>}
        {adminAuthenticated && <button className="tiny-btn" onClick={logoutAdmin}><LogOut size={14}/> Déconnexion</button>}
      </div>
    </header>
  )
}

function Registration({ teams, registerTeam, unregisterTeam, startCompetition, adminAuthenticated, loginAdmin, loginTeam }) {
  const [teamName, setTeamName] = useState('')
  const [membersText, setMembersText] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [message, setMessage] = useState('')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showTeamLogin, setShowTeamLogin] = useState(false)
  const registered = teams.filter(team => team.registered)
  const isFull = registered.length === 3

  const submit = (event) => {
    event.preventDefault()
    const members = membersText.split(/[,;\n]/).map(member => member.trim()).filter(Boolean)
    const result = registerTeam({ name: teamName, members, accessCode })
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setTeamName('')
    setMembersText('')
    setAccessCode('')
    setMessage(`Équipe inscrite. Buzzer attribué : ${KEY_LABELS[result.teamId]}.`)
  }

  const remove = (id) => {
    unregisterTeam(id)
    setMessage('Place libérée. Une nouvelle équipe peut maintenant s’inscrire.')
  }

  const launch = () => {
    if (!isFull) return
    if (!adminAuthenticated) { setShowAdminLogin(true); return }
    startCompetition()
  }

  return (
    <main className="registration-page registration-self-service">
      <section className="hero-copy registration-hero">
        <div className="eyebrow"><Activity size={14}/> INSCRIPTIONS OUVERTES</div>
        <h1>3 ÉQUIPES.<br/><span>2 PLACES EN FINALE.</span></h1>
        <p>Chaque équipe s’inscrit elle-même avant le début du challenge. Dès que les trois places sont prises, l’animateur peut lancer les qualifications.</p>
        <div className="registration-progress">
          <div className="registration-progress-copy"><span>Équipes inscrites</span><strong>{registered.length}/3</strong></div>
          <div className="registration-progress-bar"><i style={{ width: `${(registered.length / 3) * 100}%` }}/></div>
        </div>
      </section>

      <section className="registration-card glass">
        <div className="panel-heading">
          <div><span>01</span><h2>Inscrire mon équipe</h2></div>
          <UserPlus size={23}/>
        </div>

        {!isFull ? (
          <form className="self-register-form" onSubmit={submit}>
            <label>
              <small>Nom de l’équipe</small>
              <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Ex. Root Force" maxLength={32}/>
            </label>
            <label>
              <small>Membres de l’équipe</small>
              <textarea value={membersText} onChange={e => setMembersText(e.target.value)} placeholder="Alice, Bob, Charlie" rows={3}/>
              <em>Séparez les prénoms par des virgules.</em>
            </label>
            <label>
              <small>Code de connexion équipe</small>
              <input type="password" value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Minimum 4 caractères" minLength={4}/>
              <em>Ce code servira au bouton « Connexion équipe ».</em>
            </label>
            <button className="primary-btn wide" type="submit">Inscrire mon équipe <ChevronRight size={18}/></button>
          </form>
        ) : (
          <div className="registration-complete">
            <div className="registration-complete-icon"><Check size={22}/></div>
            <div><strong>Inscriptions complètes</strong><span>Les trois équipes sont enregistrées. Les qualifications peuvent commencer.</span></div>
          </div>
        )}

        {message && <div className="registration-message">{message}</div>}

        <div className="registered-teams">
          {teams.map((team, i) => (
            <div className={`registered-team ${team.registered ? 'filled' : 'empty'}`} key={team.id}>
              <div className={`team-avatar team-${i}`}><span>{i + 1}</span></div>
              <div className="registered-team-copy">
                <small>Place {i + 1} · buzzer {KEY_LABELS[i]}</small>
                {team.registered ? <><strong>{team.name}</strong><span>{team.members.join(' · ')}</span></> : <><strong>Place disponible</strong><span>En attente d’une équipe</span></>}
              </div>
              {team.registered ? <button className="remove-team" type="button" onClick={() => remove(team.id)} title="Annuler cette inscription"><Trash2 size={15}/></button> : <kbd>{KEY_LABELS[i]}</kbd>}
            </div>
          ))}
        </div>

        <div className="registration-note"><ShieldCheck size={17}/><span>Les équipes se connectent avec leur nom + code. L’administrateur lance les manches et reste le seul à attribuer/corriger les points.</span></div>
        <div className="entry-actions">
          <button className="secondary-btn team-entry-btn" type="button" onClick={() => setShowTeamLogin(true)}><Users size={17}/> Connexion équipe</button>
          {!adminAuthenticated && <button className="secondary-btn admin-entry-btn" type="button" onClick={() => setShowAdminLogin(true)}><KeyRound size={16}/> Connexion admin</button>}
        </div>
        {adminAuthenticated && <div className="admin-ready-panel">
          <div><ShieldCheck size={19}/><span><strong>Mode administrateur actif</strong><small>admin · prêt à lancer le challenge</small></span></div>
          <button className="primary-btn launch-competition" onClick={() => startCompetition()} disabled={!isFull}><Play size={17}/> {isFull ? 'Lancer les qualifications' : `En attente des équipes (${registered.length}/3)`}</button>
        </div>}
        {!adminAuthenticated && isFull && <button className="primary-btn wide launch-competition" onClick={launch}><LogIn size={17}/> Connexion admin puis lancement</button>}
        {showTeamLogin && <TeamLoginModal loginTeam={loginTeam} onClose={() => setShowTeamLogin(false)}/>} 
        {showAdminLogin && <AdminLoginModal loginAdmin={loginAdmin} onClose={() => setShowAdminLogin(false)} onSuccess={() => { setShowAdminLogin(false); if (isFull) setTimeout(() => startCompetition(true), 0) }} canLaunch={isFull}/>}
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
      if (team) buzz(team.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const take = id => { const team = teams.find(t => t.id === Number(id)); if (team && buzzed === null && !result) buzz(team.id) }
    const onCustom = e => take(e.detail?.teamId)
    const onStorage = e => { if (e.key === BUZZ_KEY && e.newValue) { try { take(JSON.parse(e.newValue).teamId) } catch {} } }
    window.addEventListener('bootcamp-team-buzz', onCustom)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('bootcamp-team-buzz', onCustom); window.removeEventListener('storage', onStorage) }
  }, [buzzed, result, teams])

  const buzz = id => {
    if (buzzed !== null) return
    setBuzzed(id)
    beep(540 + id * 110, .12)
    setTimeout(() => inputRef.current?.focus(), 80)
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
          {teams.map(team => <button key={team.id} onClick={() => buzz(team.id)}><kbd>{KEY_LABELS[team.id]}</kbd><span>{team.name}</span><b>BUZZ</b></button>)}
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
      if (teams.some(t => t.id === id)) { setBuzzed(id); beep(560 + id * 110, .12) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [buzzed, result, teams])

  useEffect(() => {
    const take = id => { id = Number(id); if (!result && buzzed === null && teams.some(t => t.id === id)) claim(id) }
    const onCustom = e => take(e.detail?.teamId)
    const onStorage = e => { if (e.key === BUZZ_KEY && e.newValue) { try { take(JSON.parse(e.newValue).teamId) } catch {} } }
    window.addEventListener('bootcamp-team-buzz', onCustom)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('bootcamp-team-buzz', onCustom); window.removeEventListener('storage', onStorage) }
  }, [buzzed, result, teams])

  const claim = id => {
    if (result || buzzed !== null) return
    setBuzzed(id)
    beep(560 + id * 110, .12)
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
    const take = id => { id = Number(id); if (buzzed === null && !awarded && teams.some(t => t.id === id)) claim(id) }
    const onCustom = e => take(e.detail?.teamId)
    const onStorage = e => { if (e.key === BUZZ_KEY && e.newValue) { try { take(JSON.parse(e.newValue).teamId) } catch {} } }
    window.addEventListener('bootcamp-team-buzz', onCustom)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('bootcamp-team-buzz', onCustom); window.removeEventListener('storage', onStorage) }
  }, [buzzed, awarded, teams])

  const claim = id => {
    if (buzzed !== null || awarded) return
    setBuzzed(id)
    setRunning(false)
    beep(620 + id * 90, .14)
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
            <button className="release-btn" onClick={() => { setBuzzed(null); setRunning(true) }}><RotateCcw size={14}/> Libérer le buzzer sans point</button>
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
