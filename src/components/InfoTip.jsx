import { useEffect, useId, useRef, useState } from 'react'

/**
 * Click / hover tip for explanations on consultation slides.
 */
export default function InfoTip({ text, label = 'Подробнее', wide = false }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!text) return null

  return (
    <span className={`info-tip ${wide ? 'wide' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`info-tip-btn ${open ? 'open' : ''}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        title={label}
      >
        <span className="info-tip-i">i</span>
        <span className="info-tip-label">{label}</span>
      </button>
      {open && (
        <div id={id} className="info-tip-panel" role="tooltip">
          {text}
        </div>
      )}
    </span>
  )
}
