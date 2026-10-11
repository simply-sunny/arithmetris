import { useLayoutEffect, useRef, type ReactNode } from 'react'

interface EquationMotionProps {
  y: number
  isPlaying: boolean
  children: ReactNode
}

export function EquationMotion({ y, isPlaying, children }: EquationMotionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const destination = useRef(y)
  const position = useRef(y)

  useLayoutEffect(() => {
    destination.current = y
  }, [y])

  useLayoutEffect(() => {
    const node = ref.current
    const arena = node?.parentElement
    if (!node || !arena) return
    let height = arena.clientHeight
    const paint = () => {
      node.style.transform = `translate3d(-50%, ${position.current * height / 100}px, 0)`
    }
    const resize = new ResizeObserver(() => {
      height = arena.clientHeight
      paint()
    })
    resize.observe(arena)
    paint()
    let frame = 0
    let previousTime = performance.now()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const tick = (time: number) => {
      const delta = Math.min(time - previousTime, 100)
      previousTime = time
      // Track continuous descent closely; soften larger jumps such as exact-hit pushback.
      const follow = reducedMotion.matches ? 1 : 1 - Math.exp(-delta / 65)
      position.current += (destination.current - position.current) * follow
      paint()
      frame = requestAnimationFrame(tick)
    }
    if (isPlaying) frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
    }
  }, [isPlaying])

  return <div ref={ref} className="equation-position absolute top-0 left-1/2 w-[92%] sm:w-[80%] max-w-lg">{children}</div>
}
