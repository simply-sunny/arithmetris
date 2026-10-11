import type { Equation } from './mathEngine'

export interface ArenaMetrics {
  height: number
  cardHeights: Record<string, number>
}

export function stepStack(equations: Equation[], dt: number, metrics: ArenaMetrics) {
  let support = 96
  let supportIsGrounded = true
  let overflow = false
  const sorted = [...equations].sort((a, b) => b.y - a.y)
  const updated = new Map<string, Equation>()
  for (const eq of sorted) {
    const height = ((metrics.cardHeights[eq.id] ?? 64) + 5) / Math.max(metrics.height, 120) * 100
    const limit = support - height
    const desired = eq.y + eq.speed * dt
    const y = Math.min(desired, limit)
    const settled: boolean = desired >= limit - .001 && supportIsGrounded
    if (settled && y <= 0) overflow = true
    support = y
    supportIsGrounded = settled
    updated.set(eq.id, { ...eq, y, settled })
  }
  return { equations: equations.map((eq) => updated.get(eq.id)!), overflow }
}

export function resolveGuess(equations: Equation[], guess: number, proximity: (guess: number, target: number) => number) {
  const cleared: Equation[] = []
  let bestMatch: Equation | null = null
  let bestProximity = 0
  const survivors: Equation[] = []
  for (const eq of equations) {
    const match = proximity(guess, eq.targetValue)
    if (match > bestProximity || bestMatch === null) {
      bestProximity = match
      bestMatch = eq
    }
    const health = match === 100 ? 0 : match >= 30 ? Math.max(0, eq.health - match * 1.25) : eq.health
    const updated = { ...eq, health, lastProximity: match }
    if (health <= 0) cleared.push(updated)
    else survivors.push(updated)
  }
  return { cleared, survivors, bestMatch, bestProximity }
}
