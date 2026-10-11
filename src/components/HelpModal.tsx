import React from 'react'
import { X, Zap, Target, Flame, Lightbulb } from 'lucide-react'
import type { GameTitle } from '../types'
import { useDialogFocus } from '../useDialogFocus'

interface HelpModalProps {
  onClose: () => void
  currentTitle: GameTitle
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, currentTitle }) => {
  const ref = useDialogFocus(onClose)
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="How to play" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-800/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/80 flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-black text-slate-100 uppercase tracking-wide">
              How to Play {currentTitle}
            </h3>
          </div>
          <button
            aria-label="Close instructions"
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Concept */}
        <div className="text-sm text-slate-300 space-y-3 font-sans leading-relaxed">
          <p>
            <strong>Estimate definite integrals while the stack grows.</strong>{' '}
            ∫[a,b] f(x) dx means the signed area between a and b. Integer answers exist, but estimation is the fastest way to survive.
          </p>

          {/* Cards for mechanics */}
          <div className="space-y-2.5">
            <div className="bg-slate-950/70 border border-cyan-950 p-3 rounded-xl flex gap-3">
              <Target className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-300 block text-xs uppercase tracking-wider mb-0.5">
                  1. Collisions & the Stack
                </strong>
                <p className="text-xs text-slate-400">
                  Blocks descend and land on the floor or other blocks. Clearing support lets the blocks above fall into the gap. Keep the stack below the top limit.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-amber-950 p-3 rounded-xl flex gap-3">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 block text-xs uppercase tracking-wider mb-0.5">
                  2. 100% Perfect Resonance
                </strong>
                <p className="text-xs text-slate-400">
                  Every equation has a guaranteed exact integer answer. Guessing the exact value
                  clears the matching blocks, boosts your combo, and pushes the survivors upward.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-fuchsia-950 p-3 rounded-xl flex gap-3">
              <Flame className="w-5 h-5 text-fuchsia-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-fuchsia-300 block text-xs uppercase tracking-wider mb-0.5">
                  3. Near-Miss Proximity Waves
                </strong>
                <p className="text-xs text-slate-400">
                  Estimates with at least 30% proximity damage every matching block. Good estimates can clear blocks outright; repeated approximations finish the rest.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-emerald-950 p-3 rounded-xl flex gap-3">
              <Lightbulb className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300 block text-xs uppercase tracking-wider mb-0.5">
                  4. Bosses & Vim Controls
                </strong>
                <p className="text-xs text-slate-400">
                  Every fifth wave brings a boss that clones its integral fragments. Defeat six of twelve clones to trigger a fourth-derivative transformation. Solve the entire current boss exactly for the One Shot badge. Use j/k (h/l also work), g/G, and Enter in menus. Gameplay starts in insert mode: type an estimate and Enter. Escape pauses; ? opens help; m toggles sound.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 mt-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition cursor-pointer"
        >
          Got it, Let's Play
        </button>
      </div>
    </div>
  )
}
