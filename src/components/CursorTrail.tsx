import { useEffect, useRef } from 'react'

export function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    if (!canvas || !context) return
    let frame = 0
    let lastMove = 0
    let cursor: { x: number; y: number } | null = null
    let points: { x: number; y: number; time: number }[] = []
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()
    const crosshair = (x: number, y: number) => {
      context.beginPath()
      context.moveTo(x - 10, y)
      context.lineTo(x - 3, y)
      context.moveTo(x + 3, y)
      context.lineTo(x + 10, y)
      context.moveTo(x, y - 10)
      context.lineTo(x, y - 3)
      context.moveTo(x, y + 3)
      context.lineTo(x, y + 10)
      context.stroke()
      context.fillRect(x - 1, y - 1, 2, 2)
    }
    const draw = (time: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      points = points.filter((point) => time - point.time < 75)
      context.strokeStyle = '#a8bdae'
      context.fillStyle = '#a8bdae'
      context.lineWidth = 1.5
      if (!reduced.matches && fine.matches && cursor) {
        // Blurred cursor silhouettes form a short exposure, without joining positions.
        for (const point of points) {
          const age = (time - point.time) / 75
          if (Math.hypot(point.x - cursor.x, point.y - cursor.y) < 2) continue
          context.globalAlpha = .18 * (1 - age)
          context.filter = `blur(${1 + age * 2}px)`
          crosshair(point.x, point.y)
        }
      }
      context.filter = 'none'
      context.globalAlpha = 1
      if (cursor) {
        context.strokeStyle = '#101713'
        context.lineWidth = 3
        crosshair(cursor.x, cursor.y)
        context.strokeStyle = '#c2d2c5'
        context.fillStyle = '#c2d2c5'
        context.lineWidth = 1.5
        crosshair(cursor.x, cursor.y)
      }
      frame = time - lastMove < 90 ? requestAnimationFrame(draw) : 0
    }
    const move = (event: MouseEvent | PointerEvent) => {
      if (('pointerType' in event && event.pointerType !== 'mouse') || !fine.matches) return
      document.documentElement.classList.add('custom-cursor-active')
      cursor = { x: event.clientX, y: event.clientY }
      lastMove = performance.now()
      const previous = points[points.length - 1]
      if (!previous || previous.x !== event.clientX || previous.y !== event.clientY) {
        points.push({ x: event.clientX, y: event.clientY, time: lastMove })
      }
      if (!frame) frame = requestAnimationFrame(draw)
    }
    const hide = () => {
      cursor = null
      points = []
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      document.documentElement.classList.remove('custom-cursor-active')
    }
    document.addEventListener('pointerleave', hide)
    window.addEventListener('blur', hide)
    window.addEventListener('pointermove', move)
    window.addEventListener('mousemove', move)
    window.addEventListener('resize', resize)
    return () => {
      hide()
      document.removeEventListener('pointerleave', hide)
      window.removeEventListener('blur', hide)
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={ref} className="cursor-trail" aria-hidden="true" />
}
