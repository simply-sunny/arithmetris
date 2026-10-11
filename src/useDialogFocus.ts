import { useEffect, useRef } from 'react'

export function useDialogFocus(onClose?: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const panel = ref.current
    if (!panel) return
    const controls = () => Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]'))
    controls()[0]?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
      if (['j', 'k', 'h', 'l', 'ArrowDown', 'ArrowUp', 'g', 'G'].includes(event.key)) {
        const items = controls()
        const index = items.indexOf(document.activeElement as HTMLElement)
        const next = event.key === 'g' ? 0 : event.key === 'G' ? items.length - 1 : (index + (['j', 'l', 'ArrowDown'].includes(event.key) ? 1 : -1) + items.length) % items.length
        event.preventDefault()
        items[next]?.focus()
      }
      if (event.key === 'Tab') {
        const items = controls()
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    panel.addEventListener('keydown', handleKey)
    return () => {
      panel.removeEventListener('keydown', handleKey)
      if (previous?.isConnected) previous.focus()
    }
  }, [onClose])
  return ref
}
