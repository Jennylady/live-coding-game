import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, Award, Bolt, BrainCircuit, ChevronRight, CircleHelp, Clock3,
  Cpu, Gauge, Medal, Network, Play, RotateCcw, ShieldCheck, Swords,
  TerminalSquare, Trophy, Users, Wifi
} from 'lucide-react'
import { championQuestions, sprintQuestions, finalQuestions } from './data/questions'

const normalize = (value) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const shuffled = (items) => [...items].sort(() => Math.random() - 0.5)

function beep(freq = 520, duration = 0.09) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

const MODES = [
  { id: 'champion', title: 'Qui suis-je ?', subtitle: 'Indices progressifs + buzzer', icon: BrainCircuit, tone: 'violet' },
  { id: 'sprint', title: 'Sprint réseau', subtitle: 'QCM chronométré', icon: Bolt, tone: 'cyan' },
  { id: 'final', title: 'Finale technique', subtitle: 'Scénarios & subnetting', icon: Trophy, tone: 'amber' },
]

export default function App() {
  const [screen, setScreen] = useState('home')
  const [teamNames, setTeamNames] = useState(['Équipe Alpha', 'Équipe Beta'])
  const [scores, setScores] = useState([0, 0])
  const [activeMode, setActiveMode] = useState(null)
  const [questionSet, setQuestionSet] = useState([])
  const [index, setIndex] = useState(0)
  const [roundDone, setRoundDone] = useState(false)

  const startMode = (mode) => {
    let set = mode === 'champion' ? championQuestions : mode === 'sprint' ? sprintQuestions : finalQuestions
    setQuestionSet(shuffled(set))
    setIndex(0)
    setRoundDone(false)
    setActiveMode(mode)
    setScreen('game')
  }

  const next = () => {
    if (index + 1 >= questionSet.length) setRoundDone(true)
    else setIndex(v => v + 1)
  }

  const resetGame = () => {
    setScores([0, 0])
    setScreen('home')
    setActiveMode(null)
    setIndex(0)
    setRoundDone(false)
  }

  const addScore = (team, points) => setScores(s => s.map((v, i) => i === team ? Math.max(0, v + points) : v))

  return (
    <div className="app-shell">
      <BackgroundGrid />
      <header className="topbar">
        <div className="brand" onClick={() => setScreen('home')}>
          <div className="brand-icon"><Network size={20}/></div>
          <div><strong>NETWORK</strong><span>CHAMPION</span></div>
        </div>
        <div className="status-chip"><span className="live-dot"/> Atelier Réseaux</div>
      </header>

      {screen === 'home' ? (
        <Home teamNames={teamNames} setTeamNames={setTeamNames} scores={scores} startMode={startMode} />
      ) : (
        <GameShell
          mode={activeMode}
          question={questionSet[index]}
          index={index}
          total={questionSet.length}
          teamNames={teamNames}
          scores={scores}
          addScore={addScore}
          next={next}
          roundDone={roundDone}
          resetGame={resetGame}
          goHome={() => setScreen('home')}
        />
      )}
    </div>
  )
}

function BackgroundGrid() {
  return <><div className="grid-bg"/><div className="glow glow-a"/><div className="glow glow-b"/></>
}

function Home({ teamNames, setTeamNames, scores, startMode }) {
  return (
    <main className="home-page">
      <section className="hero-copy">
        <div className="eyebrow"><Activity size={14}/> MODE ATELIER INTERACTIF</div>
        <h1>LE RÉSEAU,<br/><span>MAIS EN MODE CHAMPION.</span></h1>
        <p>Un challenge en équipes pour réviser le cours autrement : logique réseau, diagnostic, commandes, services, switching, routage et subnetting.</p>
      </section>

      <section className="setup-panel glass">
        <div className="panel-heading">
          <div><span>01</span><h2>Équipes</h2></div>
          <Users size={22}/>
        </div>
        <div className="teams-grid">
          {[0,1].map(i => (
            <label className="team-field" key={i}>
              <span>Équipe {i + 1}</span>
              <input value={teamNames[i]} onChange={e => setTeamNames(names => names.map((n, idx) => idx === i ? e.target.value : n))}/>
              <b>{scores[i]} pts</b>
            </label>
          ))}
        </div>
      </section>

      <section className="mode-section">
        <div className="section-title"><div><span>02</span><h2>Choisissez une manche</h2></div><p>3 formats · difficulté progressive</p></div>
        <div className="mode-grid">
          {MODES.map((mode, idx) => {
            const Icon = mode.icon
            return (
              <button className={`mode-card ${mode.tone}`} key={mode.id} onClick={() => startMode(mode.id)}>
                <div className="mode-number">0{idx + 1}</div>
                <div className="mode-icon"><Icon size={26}/></div>
                <div className="mode-copy"><h3>{mode.title}</h3><p>{mode.subtitle}</p></div>
                <ChevronRight className="mode-arrow" size={22}/>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rules-strip">
        <div><KeyboardKey text="A"/><span>buzzer équipe 1</span></div>
        <div><KeyboardKey text="L"/><span>buzzer équipe 2</span></div>
        <div><Clock3 size={18}/><span>chronos automatiques</span></div>
        <div><ShieldCheck size={18}/><span>correction immédiate</span></div>
      </section>
    </main>
  )
}

function KeyboardKey({ text }) { return <kbd>{text}</kbd> }

function GameShell(props) {
  if (props.roundDone) return <RoundSummary {...props}/>
  return (
    <main className="game-page">
      <div className="game-topline">
        <button className="ghost-btn" onClick={props.goHome}>← Menu</button>
        <div className="progress-wrap"><span>Question {props.index + 1}/{props.total}</span><div className="progress"><i style={{width: `${((props.index + 1) / props.total) * 100}%`}}/></div></div>
        <div className="difficulty"><Gauge size={16}/> Atelier</div>
      </div>
      <Scoreboard teamNames={props.teamNames} scores={props.scores}/>
      {props.mode === 'champion' && <ChampionRound {...props}/>} 
      {props.mode === 'sprint' && <QcmRound {...props} seconds={18} basePoints={20}/>} 
      {props.mode === 'final' && <QcmRound {...props} seconds={30} basePoints={35} finalMode/>}
    </main>
  )
}

function Scoreboard({ teamNames, scores }) {
  return (
    <section className="scoreboard glass">
      {[0,1].map(i => <div className="score-team" key={i}><div className={`team-orb t${i}`}>{i === 0 ? <Cpu/> : <Wifi/>}</div><div><span>{teamNames[i]}</span><strong>{scores[i]}</strong></div><small>PTS</small></div>)}
      <div className="versus"><Swords size={20}/><span>VS</span></div>
    </section>
  )
}

function ChampionRound({ question, teamNames, addScore, next }) {
  const [clueCount, setClueCount] = useState(1)
  const [time, setTime] = useState(6)
  const [buzzed, setBuzzed] = useState(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)
  const points = [40, 30, 20, 10][Math.min(clueCount - 1, 3)]

  useEffect(() => {
    setClueCount(1); setTime(6); setBuzzed(null); setAnswer(''); setResult(null)
  }, [question])

  useEffect(() => {
    if (buzzed !== null || result) return
    const timer = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          if (clueCount < 4) setClueCount(c => c + 1)
          return 6
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [buzzed, result, clueCount])

  useEffect(() => {
    const onKey = e => {
      if (result || buzzed !== null) return
      if (e.key.toLowerCase() === 'a') buzz(0)
      if (e.key.toLowerCase() === 'l') buzz(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const buzz = team => {
    setBuzzed(team); beep(team === 0 ? 540 : 720, .12)
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const validate = e => {
    e.preventDefault()
    const ok = question.accepted.some(a => normalize(a) === normalize(answer))
    setResult(ok ? 'correct' : 'wrong')
    beep(ok ? 860 : 180, .18)
    addScore(buzzed, ok ? points : -10)
  }

  return (
    <section className="challenge-card glass champion-card">
      <div className="challenge-meta"><span className="category"><CircleHelp size={15}/>{question.category}</span><span className="points">{points} points en jeu</span></div>
      <div className="champion-title"><span>QUI SUIS-JE ?</span><h2>Identifiez l’élément réseau</h2></div>
      <div className="clues">
        {question.clues.slice(0, clueCount).map((clue, i) => <div className="clue" key={i}><b>0{i+1}</b><p>{clue}</p></div>)}
        {question.clues.slice(clueCount).map((_, i) => <div className="clue locked" key={`l${i}`}><b>0{clueCount+i+1}</b><p>Indice verrouillé</p></div>)}
      </div>

      {!result && buzzed === null && <div className="buzzer-zone">
        <div className="countdown"><Clock3 size={20}/><strong>{time}s</strong><span>avant l’indice suivant</span></div>
        <div className="buzz-buttons">
          <button onClick={() => buzz(0)}><kbd>A</kbd><span>{teamNames[0]}</span><b>BUZZ</b></button>
          <button onClick={() => buzz(1)}><kbd>L</kbd><span>{teamNames[1]}</span><b>BUZZ</b></button>
        </div>
      </div>}

      {!result && buzzed !== null && <form className="answer-panel" onSubmit={validate}>
        <div><span>Buzzer</span><strong>{teamNames[buzzed]}</strong></div>
        <input ref={inputRef} placeholder="Votre réponse…" value={answer} onChange={e => setAnswer(e.target.value)}/>
        <button type="submit" disabled={!answer.trim()}>Valider</button>
      </form>}

      {result && <Feedback result={result} answer={question.answer} explanation={question.explanation} onNext={next}/>} 
    </section>
  )
}

function QcmRound({ question, teamNames, addScore, next, seconds, basePoints, finalMode }) {
  const [time, setTime] = useState(seconds)
  const [team, setTeam] = useState(null)
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => { setTime(seconds); setTeam(null); setSelected(null); setResult(null) }, [question, seconds])

  useEffect(() => {
    if (result) return
    const timer = setInterval(() => setTime(t => {
      if (t <= 1) { setResult('timeout'); return 0 }
      return t - 1
    }), 1000)
    return () => clearInterval(timer)
  }, [result])

  const choose = idx => { if (!result) setSelected(idx) }
  const validate = () => {
    if (selected === null || team === null) return
    const ok = selected === question.correct
    setResult(ok ? 'correct' : 'wrong')
    addScore(team, ok ? basePoints + Math.ceil(time/3) : -5)
    beep(ok ? 850 : 200, .15)
  }

  return (
    <section className={`challenge-card glass qcm-card ${finalMode ? 'final-card' : ''}`}>
      <div className="challenge-meta"><span className="category"><TerminalSquare size={15}/>{question.category}</span><span className="timer-pill"><Clock3 size={15}/>{time}s</span></div>
      <div className="qcm-head"><span>{finalMode ? 'FINALE TECHNIQUE' : 'SPRINT RÉSEAU'}</span><h2>{question.question}</h2></div>
      <div className="qcm-options">
        {question.options.map((opt, i) => (
          <button className={`${selected === i ? 'selected' : ''} ${result && i === question.correct ? 'is-correct' : ''} ${result && selected === i && i !== question.correct ? 'is-wrong' : ''}`} key={opt} onClick={() => choose(i)} disabled={!!result}>
            <b>{String.fromCharCode(65+i)}</b><span>{opt}</span>
          </button>
        ))}
      </div>
      {!result && <div className="qcm-actionbar">
        <div className="team-selector"><span>Qui répond ?</span>{teamNames.map((name, i) => <button className={team === i ? 'active' : ''} key={name} onClick={() => setTeam(i)}>{name}</button>)}</div>
        <button className="primary-btn" disabled={selected === null || team === null} onClick={validate}>Valider la réponse <ChevronRight size={18}/></button>
      </div>}
      {result === 'timeout' && <Feedback result="wrong" answer={question.options[question.correct]} explanation={`Temps écoulé. ${question.explanation}`} onNext={next}/>} 
      {(result === 'correct' || result === 'wrong') && <Feedback result={result} answer={question.options[question.correct]} explanation={question.explanation} onNext={next}/>} 
    </section>
  )
}

function Feedback({ result, answer, explanation, onNext }) {
  return (
    <div className={`feedback ${result}`}>
      <div className="feedback-icon">{result === 'correct' ? <Award/> : <RotateCcw/>}</div>
      <div><span>{result === 'correct' ? 'Bonne réponse' : 'Réponse incorrecte'}</span><strong>{answer}</strong><p>{explanation}</p></div>
      <button onClick={onNext}>Question suivante <ChevronRight size={18}/></button>
    </div>
  )
}

function RoundSummary({ teamNames, scores, resetGame, goHome }) {
  const winner = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1
  return (
    <main className="summary-page">
      <section className="summary-card glass">
        <div className="trophy-wrap"><Trophy size={52}/></div>
        <span className="summary-label">FIN DE LA MANCHE</span>
        <h1>{winner === null ? 'ÉGALITÉ PARFAITE' : `${teamNames[winner]} PREND LA TÊTE`}</h1>
        <p>Les scores restent conservés pour enchaîner une autre manche.</p>
        <div className="summary-scores">
          {teamNames.map((name, i) => <div className={winner === i ? 'winner' : ''} key={name}><Medal size={22}/><span>{name}</span><strong>{scores[i]}</strong><small>points</small></div>)}
        </div>
        <div className="summary-actions"><button className="secondary-btn" onClick={goHome}>Choisir une autre manche</button><button className="primary-btn" onClick={resetGame}>Nouvelle partie</button></div>
      </section>
    </main>
  )
}
