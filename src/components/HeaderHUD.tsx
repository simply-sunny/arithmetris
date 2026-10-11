import React from 'react'
import { Volume2, VolumeX, HelpCircle, Pause, Play, ArrowLeft } from 'lucide-react'
import type { GameTitle, PlayerStats } from '../types'

interface HeaderHUDProps {
  stats: PlayerStats
  currentTitle: GameTitle
  isMuted: boolean
  onToggleMute: () => void
  onOpenHelp: () => void
  isPaused: boolean
  onTogglePause: () => void
  isPlaying: boolean
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  stats,
  currentTitle,
  isMuted,
  onToggleMute,
  onOpenHelp,
  isPaused,
  onTogglePause,
  isPlaying,
}) => {

  return (
    <header className="game-hud w-full max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between border-b border-cyan-900/40 bg-slate-950/80 backdrop-blur-md rounded-b-xl z-20">
      <button className="game-back" onClick={onTogglePause} title="Pause / back"><ArrowLeft /><span>{currentTitle}</span></button>
      <div className="score-display">
        <span className="score-number">{stats.score.toLocaleString()}</span>
        <div className="score-meta">wave {String(stats.wave).padStart(2, '0')} <span>·</span> {stats.combo > 1 ? `combo ×${stats.combo}` : 'speedy arcade'}</div>
      </div>

      {/* Controls: Mute, Pause, Help */}
      <div className="game-controls flex items-center gap-2">
        {(isPlaying || isPaused) && (
          <button
            onClick={onTogglePause}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition"
            title={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenHelp}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition"
          title="How to Play"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
