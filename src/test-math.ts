import assert from 'node:assert'
import { calculateProximity, generateEquation } from './mathEngine.ts'

console.log('Testing mathEngine...')

// 1. Exact match test
assert.strictEqual(calculateProximity(42, 42), 100, 'Exact guess should be 100%')

// 2. Proximity ordering
const close = calculateProximity(43, 42)
const farther = calculateProximity(45, 42)
const far = calculateProximity(100, 42)
assert.ok(close > farther, 'Closer value should have higher score')
assert.ok(close >= 80, '1 away should have high proximity score')
assert.strictEqual(far, 0, 'Far away should have 0 score')

// 3. Test equation generator across waves 1 to 20
for (let wave = 1; wave <= 20; wave++) {
  for (let rep = 0; rep < 25; rep++) {
    const eq = generateEquation(wave, rep === 0)
    assert.ok(eq.id, 'Must have id')
    assert.ok(eq.expression.length > 0, 'Expression must not be empty')
    assert.ok(Number.isFinite(eq.targetValue), `Wave ${wave}: targetValue must be finite number, got ${eq.targetValue}`)
    assert.ok(Number.isInteger(eq.targetValue), `Wave ${wave}: targetValue must be integer, got ${eq.targetValue} for ${eq.expression}`)
    assert.ok(eq.speed > 0, 'Speed must be positive')
  }
}

console.log('All mathEngine tests passed cleanly!')

// Numerically integrate the generated calculus, independently of its closed-form answers.
const { generateBoss, generateMinion, transformBoss, fourthDerivative, termValue } = await import('./mathEngine.ts')
const { stepStack, resolveGuess } = await import('./stackEngine.ts')
for (let wave = 1; wave <= 20; wave++) {
  const eq = generateEquation(wave)
  assert.ok(eq.expression.includes('∫'), 'Every wave must start at calculus level')
  let numeric = 0
  for (const term of eq.terms!) {
    const steps = 2000
    const h = (term.upper - term.lower) / steps
    let sum = 0
    for (let index = 0; index <= steps; index++) {
      const x = term.lower + index * h
      sum += (index === 0 || index === steps ? 1 : index % 2 ? 4 : 2) * term.coefficient * x ** term.power
    }
    numeric += sum * h / 3
  }
  assert.ok(Math.abs(numeric - eq.targetValue) < .001, 'Stored calculus answers must agree with numerical integration')
}

const metric = { height: 500, cardHeights: {} }
const block = (id: string, y: number) => ({ ...generateEquation(1), id, y, speed: 20 })
let stack = [block('upper', 15), block('lower', 50)]
for (let tick = 0; tick < 200; tick++) stack = stepStack(stack, .05, metric).equations
const lower = stack.find((eq) => eq.id === 'lower')!
const upper = stack.find((eq) => eq.id === 'upper')!
assert.ok(lower.settled && upper.settled, 'Blocks must land and stack')
assert.ok(upper.y + 69 / 500 * 100 <= lower.y + .001, 'Stacked blocks must not overlap')
const released = stepStack([upper], .1, metric)
assert.ok(released.equations[0].y > upper.y, 'Removing support must let blocks above fall')
assert.ok(!stepStack([block('a', -10), block('b', -24)], .1, metric).overflow, 'Midair contacts above the screen must not end a run')
assert.ok(stepStack(Array.from({ length: 9 }, (_, index) => block(String(index), 90 - index * 13.8)), .1, metric).overflow, 'A grounded stack reaching the top must end a run')
const resized = stepStack(stack, 0, { height: 260, cardHeights: { lower: 72, upper: 86 } }).equations
assert.ok(resized[0].y + (86 + 5) / 260 * 100 <= resized[1].y + .001, 'Resize and mixed card heights must remain collision safe')

const estimateBlock = { ...block('estimate', 0), targetValue: 1000 }
let damaged = resolveGuess([estimateBlock], 700, calculateProximity)
assert.ok(damaged.survivors[0].health < 100, 'Useful rough estimates must deal damage')
damaged = resolveGuess(damaged.survivors, 700, calculateProximity)
assert.strictEqual(damaged.cleared.length, 1, 'Repeated estimates must finish a block')
assert.strictEqual(resolveGuess([estimateBlock], 1000, calculateProximity).cleared.length, 1, 'Exact answers must still clear immediately')

assert.strictEqual(fourthDerivative({ coefficient: 2, power: 5, lower: 0, upper: 2 }).coefficient, 240, 'Fourth derivative of 2x⁵ is 240x')
assert.strictEqual(termValue(fourthDerivative({ coefficient: 2, power: 5, lower: 0, upper: 2 })), 480)
assert.strictEqual(fourthDerivative({ coefficient: 20, power: 3, lower: 0, upper: 2 }).coefficient, 0, 'Cubic fragments vanish under the fourth derivative')
for (const wave of [5, 10, 15, 20]) {
  const boss = generateBoss(wave)
  assert.ok(boss.expression.length > 100, 'Boss equation must be long')
  assert.ok(Number.isSafeInteger(boss.targetValue))
  const minion = generateMinion(boss)
  assert.strictEqual(minion.targetValue, termValue(boss.fragments[0]), 'Minions must clone actual boss fragments')
  const phaseTwo = transformBoss({ ...boss, defeated: 6, spawned: 6 })
  assert.strictEqual(phaseTwo.phase, 2)
  assert.strictEqual(phaseTwo.defeated, 6, 'Transformation must preserve half health')
  assert.strictEqual(phaseTwo.spawned, 0, 'Phase two must restart its fragment attack sequence')
  assert.ok(Number.isSafeInteger(phaseTwo.targetValue))
  assert.notStrictEqual(phaseTwo.expression, boss.expression)
}
console.log('Calculus, stacking, estimate damage, and boss transformation checks passed.')
