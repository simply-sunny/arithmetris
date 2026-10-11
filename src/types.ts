export type GameStatus = 'start' | 'playing' | 'paused' | 'gameover'

export type GameMode = 'arcade'

export type GameTitle = 'Arithmetris'

export interface FloatingText {
  id: string
  text: string
  x: number // percentage
  y: number // percentage
  color: string
  isCritical?: boolean
}

export interface EquationRecord {
  expression: string
  targetValue: number
  playerGuess?: number
  matchProximity?: number
  solved: boolean
}

export interface PlayerStats {
  score: number
  highScore: number
  wave: number
  maxWave: number
  combo: number
  maxCombo: number
  perfectGuesses: number
  totalGuesses: number
  equationsCleared: number
}
