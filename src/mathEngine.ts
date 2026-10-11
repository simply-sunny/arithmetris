export interface Equation {
  id: string
  expression: string
  targetValue: number
  displayHint?: string
  difficulty: number
  // Visual position & state
  y: number // percentage 0 (top) to 100 (bottom danger line)
  speed: number // descent rate per second
  isTarget: boolean
  lastProximity?: number // 0 to 100%
  health: number // 100 (destroyed at <= 0)
  terms?: CalculusTerm[]
  minionOf?: string
  settled?: boolean
}

export type OperatorType = 'add' | 'sub' | 'mul' | 'div' | 'power' | 'sqrt' | 'factorial' | 'mod' | 'algebra'

// Random integer between min and max inclusive
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export interface CalculusTerm {
  coefficient: number
  power: number
  lower: number
  upper: number
}

const superscript = (number: number) => String(number).replace(/\d/g, (digit) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(digit)])

export function termValue(term: CalculusTerm): number {
  return term.coefficient * (term.upper ** (term.power + 1) - term.lower ** (term.power + 1)) / (term.power + 1)
}

export function termExpression(term: CalculusTerm): string {
  const power = term.power === 0 ? '' : term.power === 1 ? 'x' : `x${superscript(term.power)}`
  return `∫[${term.lower},${term.upper}] ${term.coefficient}${power} dx`
}

// TeX is generated from our calculus notation, never interpreted as HTML.
export function expressionLatex(expression: string): string {
  return expression.replace(/∫\[(-?\d+),(-?\d+)\] (\d+)(x[⁰¹²³⁴⁵⁶⁷⁸⁹]*)? dx/g, (_, lower, upper, coefficient, variable = '') => {
    const exponent = variable.slice(1).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (digit: string) => String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(digit)))
    return `\\int_{${lower}}^{${upper}} ${coefficient}${variable ? `x${exponent ? `^{${exponent}}` : ''}` : ''}\\,\\mathrm{d}x`
  })
}

export function fourthDerivative(term: CalculusTerm): CalculusTerm {
  let coefficient = term.coefficient
  for (let order = 0; order < 4; order++) coefficient *= Math.max(0, term.power - order)
  return { ...term, coefficient, power: Math.max(0, term.power - 4) }
}

function generateTerm(wave: number, power?: number): CalculusTerm {
  const degree = power ?? randInt(2, Math.min(6, 3 + Math.floor(wave / 3)))
  return {
    coefficient: randInt(3, 11 + Math.min(wave, 12)) * (degree + 1),
    power: degree,
    lower: randInt(0, 1),
    upper: randInt(2, 3),
  }
}

// Every wave starts at calculus level; exact integer answers still exist.
export function generateEquation(wave: number, isTarget: boolean = false): Equation {
  const terms = [generateTerm(wave), generateTerm(wave)]
  return {
    id: Math.random().toString(36).substring(2, 9),
    expression: terms.map(termExpression).join(' + '),
    targetValue: terms.reduce((value, term) => value + termValue(term), 0),
    terms,
    difficulty: wave,
    y: -20,
    speed: 8 + Math.min(wave * .6, 10),
    isTarget,
    health: 100,
  }
}

export interface BossState {
  id: string
  wave: number
  phase: 1 | 2
  fragments: CalculusTerm[]
  expression: string
  targetValue: number
  defeated: number
  spawned: number
  totalMinions: number
}

export function generateBoss(wave: number): BossState {
  const fragments = [5, 4, 6, 3, 7, 5, 6, 4].map((power) => generateTerm(wave, power))
  return {
    id: `boss-${wave}`,
    wave,
    phase: 1,
    fragments,
    expression: fragments.map(termExpression).join(' + '),
    targetValue: fragments.reduce((value, term) => value + termValue(term), 0),
    defeated: 0,
    spawned: 0,
    totalMinions: 12,
  }
}

export function transformBoss(boss: BossState): BossState {
  const fragments = boss.fragments.map(fourthDerivative).filter((term) => term.coefficient !== 0)
  return {
    ...boss,
    phase: 2,
    fragments,
    expression: fragments.map(termExpression).join(' + '),
    targetValue: fragments.reduce((value, term) => value + termValue(term), 0),
    spawned: 0,
  }
}

export function generateMinion(boss: BossState): Equation {
  const term = boss.fragments[boss.spawned % boss.fragments.length]
  return {
    ...generateEquation(boss.wave),
    expression: termExpression(term),
    targetValue: termValue(term),
    terms: [term],
    minionOf: boss.id,
    speed: 11 + boss.phase * 2,
    y: -18,
  }
}

/**
 * Proximity calculation:
 * Returns a score from 0 to 100:
 * - 100: Exact match! (guess === targetValue)
 * - Proximity drops off based on relative distance.
 * Scale is adaptive: for smaller numbers, error margin is tight;
 * for larger numbers, percentage error determines proximity.
 */
export function calculateProximity(guess: number, target: number): number {
  if (guess === target) return 100

  const diff = Math.abs(guess - target)
  
  // Tolerance window: depends on scale of target value
  // Minimum tolerance band is 6 units, or 80% of the target magnitude
  const tolerance = Math.max(6, Math.abs(target) * 0.8)

  if (diff >= tolerance) {
    return 0
  }

  // Linear decay within tolerance band
  const ratio = diff / tolerance
  const score = Math.round((1 - ratio) * 98) // max near-miss is 98%
  return Math.max(1, score)
}
