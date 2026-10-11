import { useState, useEffect, useRef, useCallback } from 'react'
import { HeaderHUD } from './components/HeaderHUD'
import { GameBoard } from './components/GameBoard'
import { InputConsole } from './components/InputConsole'
import { StartModal } from './components/StartModal'
import { BootTerminal } from './components/BootTerminal'
import { PauseModal } from './components/PauseModal'
import { GameOverModal } from './components/GameOverModal'
import { HelpModal } from './components/HelpModal'
import { sounds } from './audio'
import { generateEquation, calculateProximity, generateBoss, generateMinion, transformBoss, type BossState, type Equation } from './mathEngine'
import { stepStack, resolveGuess, type ArenaMetrics } from './stackEngine'
import type { GameStatus, GameTitle, PlayerStats, FloatingText } from './types'

const LOCAL_STORAGE_HIGH_SCORE = 'quantris_high_score_v1'

export function App() {
  // Title & Mode configuration
  const activeTitle: GameTitle = 'Arithmetris'
  const [booting, setBooting] = useState(true)
  const finishBoot = useCallback(() => setBooting(false), [])
  const [gameStatus, setGameStatus] = useState<GameStatus>('start')

  // Modals
  const [showHelp, setShowHelp] = useState<boolean>(false)
  const resumeAfterHelp = useRef(false)
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // Stats
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_HIGH_SCORE)
    const highScore = saved ? parseInt(saved, 10) : 0
    return {
      score: 0,
      highScore: isNaN(highScore) ? 0 : highScore,
      wave: 1,
      maxWave: 1,
      combo: 1,
      maxCombo: 1,
      perfectGuesses: 0,
      totalGuesses: 0,
      equationsCleared: 0,
    }
  })

  // Equations state
  const [equations, setEquations] = useState<Equation[]>([])
  const equationsRef = useRef<Equation[]>([])
  const [boss, setBoss] = useState<BossState | null>(null)
  const bossRef = useRef<BossState | null>(null)
  const [badgeVisible, setBadgeVisible] = useState(false)
  const [oneShotBadge, setOneShotBadge] = useState(() => localStorage.getItem('arithmetris_one_shot') === 'earned')
  const badgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const waveRef = useRef(1)
  const spawnClockRef = useRef(0)
  const spawnedRef = useRef(0)
  const arenaMetrics = useRef<ArenaMetrics>({ height: 420, cardHeights: {} })
  const handleArenaMetrics = useCallback((metrics: ArenaMetrics) => { arenaMetrics.current = metrics }, [])
  const playKeySound = useCallback(() => sounds.playKey(), [])
  const [targetEquation, setTargetEquation] = useState<Equation | null>(null)
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [missedEquations, setMissedEquations] = useState<Equation[]>([])
  const [lastGuessFeedback, setLastGuessFeedback] = useState<{
    guess: number
    proximity: number
    targetVal: number
    targetExp: string
  } | null>(null)

  // Wave progress tracker (equations cleared in current wave)
  const waveClearsRef = useRef<number>(0)
  const [waveProgress, setWaveProgress] = useState(0)
  const lastTimeRef = useRef<number>(0)

  // Sound mute sync
  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute()
    setIsMuted(nextMuted)
  }

  const commitEquations = useCallback((next: Equation[]) => {
    equationsRef.current = next
    setEquations(next)
    setTargetEquation(next.reduce<Equation | null>((target, eq) => !target || eq.y > target.y ? eq : target, null))
  }, [])

  const commitBoss = useCallback((next: BossState | null) => {
    bossRef.current = next
    setBoss(next)
  }, [])

  // Initialize a fresh wave
  const initWave = useCallback((waveNum: number) => {
    waveRef.current = waveNum
    waveClearsRef.current = 0
    setWaveProgress(0)
    spawnClockRef.current = 0
    const nextBoss = waveNum % 5 === 0 ? generateBoss(waveNum) : null
    commitBoss(nextBoss)
    spawnedRef.current = nextBoss ? 0 : 2
    const initialEquations = nextBoss ? [] : Array.from({ length: 2 }, (_, index) => ({
      ...generateEquation(waveNum, index === 0), y: -8 - index * 22,
    }))
    commitEquations(initialEquations)
    if (nextBoss) sounds.playProcessing()
  }, [commitBoss, commitEquations])

  // Start / Restart Game
  const startGame = () => {
    setStats((prev) => ({
      ...prev,
      score: 0,
      wave: 1,
      maxWave: 1,
      combo: 1,
      maxCombo: 1,
      perfectGuesses: 0,
      totalGuesses: 0,
      equationsCleared: 0,
    }))
    sounds.playMenu()
    setBadgeVisible(false)
    setFloatingTexts([])
    setMissedEquations([])
    setLastGuessFeedback(null)
    initWave(1)
    setGameStatus('playing')
    lastTimeRef.current = performance.now()
  }

  // Trigger floating text
  const addFloatingText = (text: string, x: number, y: number, color: string, isCrit = false) => {
    const id = Math.random().toString(36).substring(2, 9)
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color, isCritical: isCrit }])
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id))
    }, 900)
  }

  // End Game
  const triggerGameOver = useCallback((currentEqs: Equation[]) => {
    sounds.playGameOver()
    setMissedEquations(currentEqs)
    setGameStatus('gameover')
    setStats((prev) => {
      const isNewHigh = prev.score > prev.highScore
      if (isNewHigh) {
        localStorage.setItem(LOCAL_STORAGE_HIGH_SCORE, prev.score.toString())
      }
      return {
        ...prev,
        highScore: Math.max(prev.score, prev.highScore),
        maxWave: Math.max(prev.wave, prev.maxWave),
        maxCombo: Math.max(prev.combo, prev.maxCombo),
      }
    })
  }, [])

  // Advance to next wave
  const advanceWave = useCallback(() => {
    const nextWave = waveRef.current + 1
    sounds.playWaveAdvance()
    setStats((prev) => ({ ...prev, wave: nextWave, score: prev.score + prev.wave * 1500 }))
    initWave(nextWave)
  }, [initWave])

  const handleGuessSubmit = (guess: number) => {
    if (gameStatus !== 'playing') return
    const activeBoss = bossRef.current
    setStats((prev) => ({ ...prev, totalGuesses: prev.totalGuesses + 1 }))

    if (activeBoss && guess === activeBoss.targetValue) {
      setStats((prev) => ({ ...prev, score: prev.score + activeBoss.wave * 15000, perfectGuesses: prev.perfectGuesses + 1, combo: prev.combo + 1, maxCombo: Math.max(prev.maxCombo, prev.combo + 1) }))
      setLastGuessFeedback({ guess, proximity: 100, targetVal: activeBoss.targetValue, targetExp: 'complete boss equation' })
      localStorage.setItem('arithmetris_one_shot', 'earned')
      setOneShotBadge(true)
      setBadgeVisible(true)
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current)
      badgeTimerRef.current = setTimeout(() => setBadgeVisible(false), 6500)
      sounds.playAchievement()
      addFloatingText('ONE SHOT / BOSS DELETED', 50, 35, '#c5d8b0', true)
      advanceWave()
      return
    }

    const result = resolveGuess(equationsRef.current, guess, calculateProximity)
    if (!result.bestMatch) {
      setLastGuessFeedback({ guess, proximity: 0, targetVal: activeBoss?.targetValue ?? 0, targetExp: activeBoss ? 'boss: estimate its incoming fragments' : 'waiting for equations' })
      sounds.playResonance(0)
      return
    }
    const { cleared, bestMatch, bestProximity } = result
    sounds.playResonance(bestProximity)
    if (cleared.length) sounds.playShatter()
    setLastGuessFeedback({ guess, proximity: bestProximity, targetVal: bestMatch.targetValue, targetExp: bestMatch.expression })
    const exact = bestProximity === 100
    setStats((prev) => {
      const combo = bestProximity >= 30 ? prev.combo + (cleared.length > 0 ? 1 : 0) : 1
      return {
        ...prev,
        score: prev.score + Math.round(bestProximity * 8 * prev.wave * combo),
        combo,
        maxCombo: Math.max(prev.maxCombo, combo),
        perfectGuesses: prev.perfectGuesses + (exact ? 1 : 0),
        equationsCleared: prev.equationsCleared + cleared.length,
      }
    })
    if (cleared.length) addFloatingText(exact ? 'EXACT / STACK REPELLED' : `${cleared.length} CLEARED / ${bestProximity}%`, 50, 45, '#b2c6a9', exact)
    else if (bestProximity >= 30) addFloatingText(`${bestProximity}% / FRAGMENT DAMAGED`, 50, 45, '#94b1a3')
    else addFloatingText('TOO FAR / TRY ANOTHER ESTIMATE', 50, 45, '#a1aea7')
    const survivors = exact ? result.survivors.map((eq) => ({ ...eq, y: eq.y - 8, settled: false })) : result.survivors
    commitEquations(survivors)

    if (activeBoss) {
      const defeated = activeBoss.defeated + cleared.filter((eq) => eq.minionOf === activeBoss.id).length
      if (defeated >= activeBoss.totalMinions) {
        addFloatingText('BOSS COLLAPSED', 50, 30, '#c5d8b0', true)
        advanceWave()
      } else if (activeBoss.phase === 1 && defeated >= activeBoss.totalMinions / 2) {
        commitBoss(transformBoss({ ...activeBoss, defeated }))
        spawnClockRef.current = 0
        sounds.playProcessing()
        addFloatingText('PHASE II / FOURTH DERIVATIVE', 50, 25, '#c5d8b0', true)
      } else commitBoss({ ...activeBoss, defeated })
    } else {
      waveClearsRef.current += cleared.length
      setWaveProgress(Math.min(1, waveClearsRef.current / (6 + Math.floor(waveRef.current / 2) * 2)))
      if (waveClearsRef.current >= 6 + Math.floor(waveRef.current / 2) * 2) advanceWave()
    }
  }

  useEffect(() => () => {
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current)
  }, [])

  // Main game animation loop: falling blocks land on the floor and on each other.
  useEffect(() => {
    if (gameStatus !== 'playing') return
    let animationFrameId: number
    const tick = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, .1)
      lastTimeRef.current = currentTime
      spawnClockRef.current += dt
      const activeBoss = bossRef.current
      let next = equationsRef.current
      const interval = activeBoss ? 2.2 : Math.max(1.8, 3.8 - waveRef.current * .12)
      if (spawnClockRef.current >= interval) {
        spawnClockRef.current = 0
        if (activeBoss) {
          next = [...next, generateMinion(activeBoss)]
          commitBoss({ ...activeBoss, spawned: activeBoss.spawned + 1 })
          sounds.playMenu()
        } else {
          next = [...next, generateEquation(waveRef.current)]
          spawnedRef.current++
        }
      }
      const result = stepStack(next, dt, arenaMetrics.current)
      if (result.equations.some((eq) => eq.settled && !next.find((old) => old.id === eq.id)?.settled)) sounds.playLand()
      commitEquations(result.equations)
      if (result.overflow) {
        triggerGameOver(result.equations)
        return
      }
      animationFrameId = requestAnimationFrame(tick)
    }
    lastTimeRef.current = performance.now()
    animationFrameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameId)
  }, [gameStatus, triggerGameOver, commitBoss, commitEquations])

  // Pause / Resume toggle
  const togglePause = useCallback(() => {
    if (gameStatus === 'playing') {
      setGameStatus('paused')
    } else if (gameStatus === 'paused') {
      lastTimeRef.current = performance.now()
      setGameStatus('playing')
    }
  }, [gameStatus])

  // Keyboard shortcut for Escape (Pause)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (gameStatus === 'playing' && !showHelp && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '?') {
          e.preventDefault()
          resumeAfterHelp.current = true
          setGameStatus('paused')
          setShowHelp(true)
        } else if (e.key === 'm') {
          e.preventDefault()
          setIsMuted(sounds.toggleMute())
        }
      }
      if (e.key === 'Escape' && !showHelp) {
        if (gameStatus === 'playing' || gameStatus === 'paused') {
          togglePause()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [gameStatus, togglePause, showHelp])

  const openHelp = () => {
    resumeAfterHelp.current = gameStatus === 'playing'
    if (resumeAfterHelp.current) setGameStatus('paused')
    setShowHelp(true)
  }

  const closeHelp = () => {
    setShowHelp(false)
    if (resumeAfterHelp.current) {
      lastTimeRef.current = performance.now()
      setGameStatus('playing')
    }
  }

  if (booting) return <BootTerminal onReady={finishBoot} />

  return (
    <div className={`${gameStatus !== 'start' ? 'game-stage' : ''} min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans relative`}>
      {badgeVisible && <div className="achievement-toast" role="status"><span className="achievement-emblem">◎</span><div><strong>ONE SHOT</strong><p>Solved the whole boss in one hit.</p><span>badge permanently unlocked</span></div></div>}
      {gameStatus !== 'start' && <>
      {/* HUD Header */}
      <HeaderHUD
        stats={stats}
        currentTitle={activeTitle}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenHelp={openHelp}
        isPaused={gameStatus === 'paused'}
        onTogglePause={togglePause}
        isPlaying={gameStatus === 'playing'}
      />

      {/* Main Board Arena */}
      <main className="game-playfield flex-1 flex flex-col items-center justify-center p-2 sm:p-4 z-10 w-full">
        <GameBoard
          equations={equations}
          floatingTexts={floatingTexts}
          targetEquation={targetEquation}
          isPlaying={gameStatus === 'playing'}
          boss={boss}
          onArenaMetrics={handleArenaMetrics}
          waveProgress={boss ? boss.defeated / boss.totalMinions : waveProgress}
        />

        {/* Input Console */}
        <InputConsole
          onSubmitGuess={handleGuessSubmit}
          onKeyPressSound={playKeySound}
          disabled={gameStatus !== 'playing'}
          lastGuessFeedback={lastGuessFeedback}
        />
      </main>

      {/* Footer Info */}
      <footer className="w-full text-center py-2 text-[11px] font-mono text-slate-500 border-t border-slate-900 bg-slate-950/60">
        <span>{activeTitle}</span> • estimate + enter / esc normal / ? help
      </footer>

      </>}

      {/* Start Modal */}
      {gameStatus === 'start' && (
        <StartModal
          currentTitle={activeTitle}
          highScore={stats.highScore}
          oneShotBadge={oneShotBadge}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStart={startGame}
          onOpenHelp={openHelp}
        />
      )}

      {gameStatus === 'paused' && !showHelp && (
        <PauseModal onResume={togglePause} onRestart={startGame} onHome={() => setGameStatus('start')} />
      )}

      {/* Game Over Modal */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          stats={stats}
          activeTitle={activeTitle}
          missedEquations={missedEquations}
          onRestart={startGame}
        />
      )}

      {/* Help / Rules Modal */}
      {showHelp && <HelpModal onClose={closeHelp} currentTitle={activeTitle} />}
    </div>
  )
}

export default App
