import { useEffect, useState } from 'react'

interface BootTerminalProps {
  onReady: () => void
}

const BOOT_TEXT = '> arithmetris\n  loading arithmetic engine ... ok\n  mounting speedy arcade ... ok\n\n> open home_'

export function BootTerminal({ onReady }: BootTerminalProps) {
  const [characters, setCharacters] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onReady()
      return
    }
    let interval: ReturnType<typeof setInterval>
    let finish: ReturnType<typeof setTimeout>
    const start = setTimeout(() => {
      let count = 0
      interval = setInterval(() => {
        count += 2
        setCharacters(Math.min(count, BOOT_TEXT.length))
        if (count >= BOOT_TEXT.length) {
          clearInterval(interval)
          finish = setTimeout(onReady, 400)
        }
      }, 24)
    }, 500)
    const skip = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Escape') onReady()
    }
    window.addEventListener('keydown', skip)
    return () => {
      clearTimeout(start)
      clearInterval(interval)
      clearTimeout(finish)
      window.removeEventListener('keydown', skip)
    }
  }, [onReady])

  return (
    <main className="boot-terminal" aria-label="Starting Arithmetris">
      <pre aria-hidden="true">{BOOT_TEXT.slice(0, characters)}<span className="terminal-cursor">▌</span></pre>
      <button className="boot-skip" onClick={onReady}>skip intro [enter]</button>
    </main>
  )
}
