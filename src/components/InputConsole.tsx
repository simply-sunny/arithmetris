import React, { useState, useEffect, useRef } from 'react'
import { Delete, CornerDownLeft } from 'lucide-react'

interface InputConsoleProps {
  onSubmitGuess: (guess: number) => void
  onKeyPressSound: () => void
  disabled?: boolean
  lastGuessFeedback: {
    guess: number
    proximity: number
    targetVal: number
    targetExp: string
  } | null
}

export const InputConsole: React.FC<InputConsoleProps> = ({
  onSubmitGuess,
  onKeyPressSound,
  disabled = false,
  lastGuessFeedback,
}) => {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep focus on input for seamless arcade typing
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
    if (disabled) return
    const focus = () => inputRef.current?.focus({ preventScroll: true })
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return
      if (document.activeElement === inputRef.current) return
      if (/^[0-9-]$/.test(event.key)) {
        event.preventDefault()
        setInputValue((current) => event.key === '-' ? (current.startsWith('-') ? current.slice(1) : '-' + current) : current.length < 12 ? current + event.key : current)
        onKeyPressSound()
        focus()
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        setInputValue((current) => current.slice(0, -1))
        focus()
      }
    }
    const pointer = (event: PointerEvent) => {
      const button = (event.target as Element)?.closest('button, a')
      if (!button) focus()
    }
    window.addEventListener('keydown', key)
    window.addEventListener('focus', focus)
    window.addEventListener('pointerup', pointer)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('focus', focus)
      window.removeEventListener('pointerup', pointer)
    }
  }, [disabled, onKeyPressSound])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim() || disabled) return

    const num = Number(inputValue.trim())
    if (Number.isSafeInteger(num)) {
      onSubmitGuess(num)
      setInputValue('')
      inputRef.current?.focus({ preventScroll: true })
    }
  }

  const handleKeypadPress = (val: string) => {
    if (disabled) return
    inputRef.current?.focus({ preventScroll: true })
    onKeyPressSound()

    if (val === 'CLEAR') {
      setInputValue('')
      inputRef.current?.focus({ preventScroll: true })
    } else if (val === 'DEL') {
      setInputValue((prev) => prev.slice(0, -1))
    } else if (val === 'ENTER') {
      handleSubmit()
    } else if (val === '-') {
      setInputValue((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev))
    } else {
      // Keep enough digits for higher-order calculus and boss answers.
      if (inputValue.length < 12) {
        setInputValue((prev) => prev + val)
      }
    }
  }

  return (
    <div className="input-console w-full max-w-4xl mx-auto px-4 py-3 flex flex-col gap-2">
      <div className="guess-feedback" role="status">
        {lastGuessFeedback ? `${lastGuessFeedback.guess} → ${lastGuessFeedback.proximity === 100 ? 'exact · cleared' : lastGuessFeedback.proximity > 0 ? `${lastGuessFeedback.proximity}% proximity` : 'too far · try again'}` : 'Estimate the integrals. Keep the stack below the limit.'}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            autoComplete="off"
            spellCheck={false}
            onBlur={() => { if (!disabled) requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true })) }}
            aria-label="Answer to falling equations"
            type="text"
            inputMode="numeric"
            pattern="[0-9-]*"
            value={inputValue}
            disabled={disabled}
            onChange={(e) => {
              const val = e.target.value
              // Allow numbers and leading minus
              if (/^-?\d*$/.test(val)) {
                setInputValue(val)
                onKeyPressSound()
              }
            }}
            placeholder="answer >"
            className="w-full bg-slate-900/90 border-2 border-cyan-500/70 focus:border-cyan-400 rounded-xl px-4 py-3 text-cyan-200 placeholder-slate-500 text-lg sm:text-2xl font-mono tracking-wider shadow-lg shadow-cyan-950/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-500 font-mono hidden sm:flex">
            <span>ENTER</span>
            <CornerDownLeft className="w-3 h-3 text-cyan-500" />
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled || !inputValue.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
        >
          <span>Submit ↵</span>
        </button>
      </form>

      {/* Optional Compact Virtual Keypad (great for mobile touch and fast clicking) */}
      <div className="virtual-keypad grid grid-cols-6 gap-1.5 sm:gap-2 pt-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', 'DEL'].map((btn) => (
          <button
            key={btn}
            aria-label={btn === 'DEL' ? 'Delete last digit' : btn}
            type="button"
            onClick={() => handleKeypadPress(btn)}
            disabled={disabled}
            className="py-1.5 sm:py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-800 text-slate-300 hover:text-cyan-300 font-mono font-bold text-sm sm:text-base transition active:scale-95 disabled:opacity-40"
          >
            {btn === 'DEL' ? <Delete className="w-4 h-4 mx-auto" /> : btn}
          </button>
        ))}
      </div>
    </div>
  )
}
