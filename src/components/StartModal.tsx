import { MathExpression } from './MathExpression'
import React, { useEffect, useRef, useState } from 'react'
import type { GameTitle } from '../types'
import { sounds } from '../audio'

interface StartModalProps {
  currentTitle: GameTitle
  highScore: number
  oneShotBadge: boolean
  isMuted: boolean
  onToggleMute: () => void
  onStart: () => void
  onOpenHelp: () => void
}

export const StartModal: React.FC<StartModalProps> = ({
  currentTitle,
  highScore,
  oneShotBadge,
  isMuted,
  onToggleMute,
  onStart,
  onOpenHelp,
}) => {
  const [selected, setSelected] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    buttons.current[0]?.focus({ preventScroll: true })
  }, [])

  const actions = [onStart, onOpenHelp, () => setSettingsOpen((value) => !value)]
  const labels = ['start run', 'how to play', 'settings']

  return (
    <main className="terminal-home">
      <header className="home-topline">
        <span><span className="status-dot" /> arithmetris / arithmetic system</span>
        <span>local terminal <span className="version">v.01</span></span>
      </header>
      <div className="home-content">
        <section className="home-copy">
          {/* Hero Branding */}
          <p className="eyebrow">01 / speedy arcade</p>
          <h1>{currentTitle.toLowerCase()}<span className="title-period">.</span></h1>
          <p className="home-description">Calculus under pressure.<br />Estimate. Clear. Outlast the boss.</p>

          {/* Terminal Navigation */}
          <div ref={menuRef} className="terminal-menu" aria-label="Main menu" onKeyDown={(event) => {
            if (['ArrowDown', 'ArrowUp', 'j', 'k', 'h', 'l', 'g', 'G'].includes(event.key)) {
              event.preventDefault()
              const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('button, a[href]') ?? [])
              const index = items.indexOf(document.activeElement as HTMLElement)
              const next = event.key === 'g' ? 0 : event.key === 'G' ? items.length - 1 : (index + (['ArrowDown', 'j', 'l'].includes(event.key) ? 1 : -1) + items.length) % items.length
              sounds.playMenu()
              items[next]?.focus()
            }
          }}>
            <p className="menu-path">guest@arithmetris:~ / home</p>
            {labels.map((label, index) => (
              <button key={label} ref={(node) => { buttons.current[index] = node }} className={selected === index ? 'menu-row selected' : 'menu-row'} onFocus={() => setSelected(index)} onClick={() => { sounds.playMenu(); actions[index]() }} aria-expanded={index === 2 ? settingsOpen : undefined}>
                <span className="menu-marker">{selected === index ? '>' : '·'}</span>
                <span>{label}</span>
                <span className="menu-shortcut">{index === 0 ? '[enter]' : `0${index + 1}`}</span>
              </button>
            ))}
            {settingsOpen && <div className="home-settings"><span>audio output</span><button onClick={onToggleMute}>[{isMuted ? 'off' : 'on'}] toggle</button><a href="/audio/CREDITS.md" target="_blank" rel="noreferrer">audio credits</a></div>}
          </div>
          <p className="nav-hint">j / k or ↑ ↓ to navigate <span>/</span> enter to select</p>
          <div className="personal-best"><span>personal best</span><strong>{String(highScore).padStart(6, '0')}</strong></div>
          {oneShotBadge && <div className="saved-badge">◎ ONE SHOT <span>boss exact-answer badge</span></div>}
        </section>
        <aside className="home-preview" aria-label="Preview of falling equations">
          <div className="preview-caption"><span>process / live preview</span><span>● standby</span></div>
          <div className="preview-arena">
            <span className="arena-coordinate">calculus / live stack</span>
            <div className="preview-equation equation-one"><span>01</span><MathExpression expression="∫[0,3] 24x³ dx" /><span>↓</span></div>
            <div className="preview-equation equation-two"><span>02</span><MathExpression expression="∫[1,2] 35x⁴ dx" /><span>↓</span></div>
            <div className="preview-equation equation-three"><span>03</span><MathExpression expression="∫[0,2] 18x⁵ dx" /><span>↓</span></div>
            <div className="preview-equation equation-target"><span>▸</span><MathExpression expression="∫[1,3] 12x² dx" /><span>⌖</span></div>
            <div className="preview-breach"><span>stack floor</span></div>
          </div>
          <div className="preview-prompt"><span>answer &gt;</span><span>104<span className="terminal-cursor">_</span></span><span>↵</span></div>
          <p className="preview-note">estimation is king. bosses every 5 waves.</p>
        </aside>
      </div>
      <footer className="home-footer"><span>one mode. endless waves.</span><span>numbers in / noise out</span><span>keyboard recommended</span></footer>
    </main>
  )
}
