import VoiceButton from './VoiceButton'

export function TextField({ label, value, onChange, placeholder, type = 'text', min, max, step, voice = false }) {
  // Voice only for text (not numbers)
  const allowVoice = voice && type !== 'number'

  const input = (
    <input
      className="field-input"
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
    />
  )

  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      {allowVoice ? (
        <div className="input-with-voice">
          {input}
          <VoiceButton currentValue={String(value ?? '')} onText={(t) => onChange(t)} />
        </div>
      ) : (
        input
      )}
    </div>
  )
}

export function TextArea({ label, value, onChange, placeholder, tags = [], rows = 4 }) {
  const appendTag = (tag) => {
    const cur = value || ''
    const sep = !cur ? '' : cur.endsWith(' ') || cur.endsWith(',') || cur.endsWith('\n') ? '' : ', '
    onChange(`${cur}${sep}${tag}`)
  }

  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="input-with-voice">
        <textarea
          className="field-textarea"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
        <VoiceButton currentValue={value || ''} onText={onChange} />
      </div>
      {tags.length > 0 && (
        <div className="tags">
          {tags.map((t) => (
            <button key={t} type="button" className="tag" onClick={() => appendTag(t)}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ScaleField({ label, value, onChange, lowHint = '1', highHint = '5' }) {
  return (
    <div className="scale-row">
      <div className="scale-header">
        <span className="scale-label">{label}</span>
        <span className="scale-value">{value ?? '—'}</span>
      </div>
      <div className="scale-buttons">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={`scale-btn ${value === n ? 'active' : ''}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="scale-hints">
        <span>{lowHint}</span>
        <span>{highHint}</span>
      </div>
    </div>
  )
}

export function ChoiceField({ label, value, onChange, options, cols = 2, multi = false }) {
  const selected = multi ? value || [] : value

  const toggle = (v) => {
    if (!multi) {
      onChange(v)
      return
    }
    const set = new Set(selected)
    if (set.has(v)) set.delete(v)
    else set.add(v)
    // exclusive "Нет болей"
    if (v === 'Нет болей') onChange(['Нет болей'])
    else onChange([...set].filter((x) => x !== 'Нет болей'))
  }

  const isSel = (v) => (multi ? selected.includes(v) : selected === v)

  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className={`choice-grid cols-${cols}`}>
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value
          const lab = typeof opt === 'string' ? opt : opt.label
          const desc = typeof opt === 'string' ? null : opt.desc
          return (
            <button key={val} type="button" className={`choice-card ${isSel(val) ? 'selected' : ''}`} onClick={() => toggle(val)}>
              <div className="choice-title">{lab}</div>
              {desc && <div className="choice-desc">{desc}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
