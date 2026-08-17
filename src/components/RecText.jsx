import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { formatRecommendationText } from '../lib/algorithm'

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlightHtml(text) {
  let h = esc(text)
  h = h.replace(
    /(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?(?:\s*(?:ккал|г|кг|%|раз|нед\.?|мес\.?|ч|тыс\.?|мин|×))?)/gi,
    '<mark class="rec-hl">$1</mark>'
  )
  const keys = [
    'Первый месяц',
    'первый месяц',
    'Правило прогрессии',
    'Дневник обязателен',
    'Белок',
    'белок',
    'Калории',
    'Шаги',
    'Сон',
    'Критерий успеха',
    'Фокус месяца',
  ]
  for (const k of keys) {
    h = h.replace(
      new RegExp(`(?!<mark[^>]*>)(${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*</mark>)`, 'g'),
      '<mark class="rec-hl-soft">$1</mark>'
    )
  }
  return h
}

const MIN_H = 56
const DEFAULT_H = 160
const STORAGE_PREFIX = 'metasystem_rec_h_'

/**
 * Recommendation text with drag handle to resize height (content clips).
 */
export default function RecText({ value, onChange, rows = 8, storageKey }) {
  const formatted = formatRecommendationText(value || '')
  const paragraphs = formatted
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const reactId = useId()
  const key = storageKey || reactId
  const proseRef = useRef(null)
  const dragRef = useRef(null)

  const [height, setHeight] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key)
      if (raw) {
        const n = Number(raw)
        if (n >= MIN_H) return n
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_H
  })
  const [fullH, setFullH] = useState(null)
  const [dragging, setDragging] = useState(false)

  const measureFull = useCallback(() => {
    const el = proseRef.current
    if (!el) return
    // scrollHeight when unrestricted
    const prev = el.style.maxHeight
    el.style.maxHeight = 'none'
    const h = el.scrollHeight
    el.style.maxHeight = prev
    setFullH(h)
  }, [])

  useEffect(() => {
    measureFull()
  }, [formatted, measureFull])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, String(height))
    } catch {
      /* ignore */
    }
  }, [height, key])

  const onPointerDown = (e) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = height
    setDragging(true)
    dragRef.current = { startY, startH }

    const onMove = (ev) => {
      if (!dragRef.current) return
      const dy = ev.clientY - dragRef.current.startY
      const maxH = fullH != null ? Math.max(fullH, MIN_H) : 800
      const next = Math.min(maxH, Math.max(MIN_H, dragRef.current.startH + dy))
      setHeight(next)
    }
    const onUp = () => {
      setDragging(false)
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const expandFull = () => {
    measureFull()
    const el = proseRef.current
    if (el) {
      el.style.maxHeight = 'none'
      const h = el.scrollHeight
      setFullH(h)
      setHeight(Math.max(h, MIN_H))
    }
  }

  const collapsed = fullH != null && height < fullH - 4

  return (
    <div className={`rec-text ${dragging ? 'is-dragging' : ''}`}>
      <div
        className={`rec-prose-clip ${collapsed ? 'is-clipped' : ''}`}
        style={{ maxHeight: height }}
      >
        <div className="rec-prose" ref={proseRef}>
          {paragraphs.length === 0 ? (
            <p className="rec-p muted">Текст появится после расчёта.</p>
          ) : (
            paragraphs.map((p, i) => (
              <p key={i} className="rec-p" dangerouslySetInnerHTML={{ __html: highlightHtml(p) }} />
            ))
          )}
        </div>
        {collapsed && <div className="rec-fade" aria-hidden />}
      </div>

      <div
        className="rec-resize-handle"
        onPointerDown={onPointerDown}
        onDoubleClick={expandFull}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Потяни, чтобы изменить высоту блока"
        title="Потяни вверх или вниз. Двойной клик. развернуть весь текст"
      >
        <span className="rec-resize-grip" />
      </div>

      <details className="rec-edit">
        <summary>Править</summary>
        <textarea
          className="rec-textarea"
          value={formatted}
          rows={rows}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={(e) => {
            const next = formatRecommendationText(e.target.value)
            if (next !== e.target.value) onChange?.(next)
          }}
        />
      </details>
    </div>
  )
}
