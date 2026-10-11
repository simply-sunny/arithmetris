import { useDialogFocus } from '../useDialogFocus'

interface PauseModalProps {
  onResume: () => void
  onRestart: () => void
  onHome: () => void
}

export function PauseModal({ onResume, onRestart, onHome }: PauseModalProps) {
  const ref = useDialogFocus(onResume)
  return (
    <div className="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div ref={ref} className="pause-panel">
        <p className="eyebrow">process suspended</p>
        <h2 id="pause-title">take a breath.</h2>
        <p>your equations can wait.</p>
        <button onClick={onResume}>&gt; resume [esc]</button>
        <button onClick={onRestart}>restart run</button>
        <button onClick={onHome}>return home</button>
      </div>
    </div>
  )
}
