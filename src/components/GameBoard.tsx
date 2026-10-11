import { MathExpression } from './MathExpression'
import React, { useLayoutEffect, useEffect, useRef, useState } from 'react'
import { EquationMotion } from './EquationMotion'
import type { Equation, BossState } from '../mathEngine'
import type { ArenaMetrics } from '../stackEngine'
import type { FloatingText } from '../types'
import { Zap } from 'lucide-react'

interface GameBoardProps {
  equations: Equation[]
  floatingTexts: FloatingText[]
  targetEquation: Equation | null
  isPlaying: boolean
  boss: BossState | null
  onArenaMetrics: (metrics: ArenaMetrics) => void
  waveProgress: number
}

export const GameBoard: React.FC<GameBoardProps> = ({
  equations,
  floatingTexts,
  targetEquation,
  isPlaying,
  boss,
  onArenaMetrics,
  waveProgress,
}) => {
  const arenaRef = useRef<HTMLDivElement>(null)
  const previousEquations = useRef<Equation[]>([])
  const [clearingEquations, setClearingEquations] = useState<Equation[]>([])
  const clearTimers = useRef(new Set<ReturnType<typeof setTimeout>>())

  useLayoutEffect(() => {
    const activeIds = new Set(equations.map((eq) => eq.id))
    const removed = previousEquations.current.filter((eq) => !activeIds.has(eq.id))
    previousEquations.current = equations
    if (removed.length === 0) return
    setClearingEquations((current) => [...current, ...removed])
    const removedIds = new Set(removed.map((eq) => eq.id))
    const timer = setTimeout(() => {
      setClearingEquations((current) => current.filter((eq) => !removedIds.has(eq.id)))
      clearTimers.current.delete(timer)
    }, 240)
    clearTimers.current.add(timer)
  }, [equations])

  useLayoutEffect(() => {
    const arena = arenaRef.current
    if (!arena) return
    const measure = () => {
      const cardHeights: Record<string, number> = {}
      arena.querySelectorAll<HTMLElement>('[data-equation-id]').forEach((node) => {
        cardHeights[node.dataset.equationId!] = node.offsetHeight
      })
      onArenaMetrics({ height: arena.clientHeight, cardHeights })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(arena)
    return () => observer.disconnect()
  }, [equations, boss, onArenaMetrics])

  useEffect(() => {
    const timers = clearTimers.current
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className={`game-board ${boss ? 'boss-board' : ''} relative w-full max-w-4xl h-[520px] md:h-[600px] mx-auto bg-slate-950/90 rounded-2xl border border-cyan-900/50 overflow-hidden shadow-2xl shadow-cyan-950/30 flex flex-col`}>
      {/* Background Matrix / Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {boss && <section className={`boss-panel phase-${boss.phase}`} aria-label="Boss encounter">
        <div className="boss-heading"><strong>WAVE {boss.wave} / THE INTEGRATOR</strong><span>PHASE {boss.phase === 1 ? 'I' : 'II · d⁴/dx⁴'}</span></div>
        <p key={boss.phase} className="boss-equation"><MathExpression expression={boss.expression} /></p>
        <div className="boss-health"><div style={{ width: `${(1 - boss.defeated / boss.totalMinions) * 100}%` }} /></div>
        <div className="boss-caption"><span>{boss.totalMinions - boss.defeated} / {boss.totalMinions} fragment health</span><span>estimate clones · exact whole = ONE SHOT</span></div>
      </section>}

      {/* Falling Well Arena */}
      <div ref={arenaRef} className="falling-arena relative flex-1 w-full overflow-hidden">
        {/* Equations Container */}
        {[...equations, ...clearingEquations].map((eq) => {
          const isClearing = clearingEquations.some((clearing) => clearing.id === eq.id)
          const isTarget = targetEquation?.id === eq.id
          const hasProximity = eq.lastProximity !== undefined && eq.lastProximity > 0

          // Color scheme based on last proximity score
          let borderColor = 'border-slate-800'
          let bgColor = 'bg-slate-900/80'
          let textColor = 'text-slate-100'

          if (isTarget) {
            borderColor = 'border-cyan-400 ring-2 ring-cyan-500/50'
            bgColor = 'bg-slate-900/95'
          }

          if (hasProximity) {
            if (eq.lastProximity! === 100) {
              borderColor = 'border-amber-400 ring-2 ring-amber-400/80'
              bgColor = 'bg-amber-950/60'
              textColor = 'text-amber-200'
            } else if (eq.lastProximity! >= 75) {
              borderColor = 'border-fuchsia-400 ring-2 ring-fuchsia-500/60'
              bgColor = 'bg-fuchsia-950/50'
              textColor = 'text-fuchsia-200'
            } else if (eq.lastProximity! >= 40) {
              borderColor = 'border-teal-400'
              bgColor = 'bg-teal-950/40'
              textColor = 'text-teal-200'
            }
          }

          // Danger coloring if near bottom threshold (> 72%)
          const inDangerZone = eq.y >= 72
          if (inDangerZone && !isTarget) {
            borderColor = 'border-rose-500/80'
          }

          return (
            <EquationMotion key={eq.id} y={eq.y} isPlaying={isPlaying && !isClearing}>
            <div
              data-equation-id={eq.id}
              aria-hidden={isClearing || undefined}
              className={`equation-card ${isClearing ? 'equation-clearing' : ''} ${eq.settled ? 'equation-settled' : ''} w-full rounded-xl border ${borderColor} ${bgColor} p-3 shadow-lg backdrop-blur-md flex items-center justify-between transition-colors duration-200 ${
                isTarget ? 'glow-target' : ''
              }`}
            >
              {/* Left: Target Indicator or Equation Index */}
              <div className="flex items-center gap-2">
                {isTarget ? (
                  <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase bg-cyan-500 text-slate-950 px-2 py-0.5 rounded shadow">
                    <span aria-label="Target">▸</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                    {eq.minionOf ? 'CLONE' : `W${eq.difficulty}`}
                  </span>
                )}

                {/* Equation Expression */}
                <span className={`equation-expression text-base sm:text-xl font-bold font-mono tracking-wide ${textColor}`}>
                  <MathExpression expression={eq.expression} />
                </span>
              </div>

              {/* Right: Resonance / Proximity Meter */}
              <div className="flex items-center gap-2">
                {eq.lastProximity !== undefined && eq.lastProximity > 0 ? (
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-xs font-black font-mono flex items-center gap-1 ${
                        eq.lastProximity === 100
                          ? 'text-amber-300'
                          : eq.lastProximity >= 75
                          ? 'text-fuchsia-300'
                          : 'text-teal-300'
                      }`}
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      {eq.lastProximity}% MATCH
                    </span>
                    {/* Mini bar gauge */}
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          eq.lastProximity === 100
                            ? 'bg-amber-400'
                            : eq.lastProximity >= 75
                            ? 'bg-fuchsia-400'
                            : 'bg-teal-400'
                        }`}
                        style={{ width: `${eq.lastProximity}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 font-mono italic">
                    {eq.settled ? 'stacked' : 'estimate'}
                  </div>
                )}
              </div>
            </div>
            </EquationMotion>
          )
        })}

        <div className="stack-ceiling">STACK LIMIT / KEEP THIS CLEAR</div>
        {/* Stack floor */}
        <div className="stack-floor" aria-label={`Wave ${Math.round(waveProgress * 100)}% complete`}><span className="wave-progress" style={{ width: `${waveProgress * 100}%` }} />

        </div>

        {/* Floating Text Score Popups */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            style={{
              top: `${ft.y}%`,
              left: `${ft.x}%`,
              color: ft.color,
            }}
            className="absolute -translate-x-1/2 pointer-events-none font-black text-sm sm:text-base font-mono z-30 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] animate-float-up"
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* Subtle CRT Scanline overlay effect */}
      <div className="scanlines absolute inset-0 pointer-events-none opacity-20" />
    </div>
  )
}
