import { MathExpression } from './MathExpression'
import React, { useEffect } from 'react'
import { RotateCcw, Trophy, Flame, Zap, Award } from 'lucide-react'
import type { PlayerStats, GameTitle } from '../types'
import type { Equation } from '../mathEngine'
import { useDialogFocus } from '../useDialogFocus'

interface GameOverModalProps {
  stats: PlayerStats
  activeTitle: GameTitle
  missedEquations: Equation[]
  onRestart: () => void
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  activeTitle,
  missedEquations,
  onRestart,
}) => {
  const ref = useDialogFocus()

  // Listen for Enter or Space to restart quickly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onRestart()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRestart])

  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Run ended" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-800/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/80 flex flex-col gap-5 text-center">
        {/* Title Badge */}
        <div>
          <span className="text-xs uppercase font-mono font-extrabold tracking-widest text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1 rounded-full">
            Danger Threshold Breached
          </span>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-slate-100 mt-2">
            Game Over
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Equations overwhelmed the matrix in {activeTitle}.
          </p>
        </div>

        {/* Big Score Block */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs font-mono uppercase text-slate-400">Final Score</span>
          <span className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight my-1">
            {stats.score.toLocaleString()}
          </span>
          {isNewHighScore && (
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-600/40 animate-pulse">
              <Trophy className="w-3.5 h-3.5" /> NEW HIGH SCORE!
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-left">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
              <Award className="w-3 h-3 text-cyan-400" /> Max Wave
            </div>
            <div className="text-lg font-black text-cyan-300 font-mono mt-0.5">
              {stats.wave}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
              <Zap className="w-3 h-3 text-amber-400" /> 100% Perfects
            </div>
            <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
              {stats.perfectGuesses}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
              <Flame className="w-3 h-3 text-fuchsia-400" /> Max Combo
            </div>
            <div className="text-lg font-black text-fuchsia-300 font-mono mt-0.5">
              x{stats.maxCombo}
            </div>
          </div>
        </div>

        {/* Missed Equations Review (Educational & rewarding closure) */}
        {missedEquations.length > 0 && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-left">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
              Unsolved Equations & True Solutions:
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {missedEquations.slice(0, 5).map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center justify-between text-xs font-mono bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800"
                >
                  <span className="text-slate-300 font-bold"><MathExpression expression={eq.expression} /></span>
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <span className="text-slate-500">=</span>
                    <span>{eq.targetValue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 cursor-pointer active:scale-98 transition"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Play Again (Enter)</span>
        </button>
      </div>
    </div>
  )
}
