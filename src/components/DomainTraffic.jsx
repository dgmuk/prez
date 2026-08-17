const NAMES = {
  activity: 'Активность',
  training: 'Тренировки',
  nutrition: 'Питание',
  recovery: 'Восстановление',
  stress: 'Стресс',
}

const LEVEL_HINT = {
  red: 'Фокус внимания',
  yellow: 'Требует поддержки',
  green: 'сильно',
}

/** Score is always out of 5 (domain average from lifestyle scales). */
export default function DomainTraffic({ domains = {}, highlight, showLegend = true }) {
  const entries = Object.entries(NAMES)

  return (
    <div className="domain-list-wrap">
      {showLegend && (
        <div className="domain-legend">
          <div className="domain-legend-title">Анализ ключевых сфер (Шкала 1–5)</div>
          <p className="domain-legend-text">
            Средняя оценка по ответам в блоке Образ жизни. Чем выше балл, тем устойчивее зона.
          </p>
          <div className="domain-legend-scale">
            <span className="domain-legend-item">
              <span className="domain-dot red" />
              <span>
                <strong>0-2.4</strong> приоритет
              </span>
            </span>
            <span className="domain-legend-item">
              <span className="domain-dot yellow" />
              <span>
                <strong>2.5-3.7</strong> средний
              </span>
            </span>
            <span className="domain-legend-item">
              <span className="domain-dot green" />
              <span>
                <strong>3.8-5</strong> сильный
              </span>
            </span>
          </div>
        </div>
      )}

      <div className="domain-list">
        {entries.map(([key, name]) => {
          const d = domains[key] || {}
          const color = d.color || 'yellow'
          const score = d.score
          const level = d.label || ''
          const isFocus = highlight?.includes?.(key)
          const scoreLabel = score == null || score === '—' ? '—' : `${score} / 5`

          return (
            <div
              key={key}
              className="domain-row"
              style={isFocus ? { borderColor: 'var(--border-accent)', background: 'var(--accent-dim)' } : undefined}
            >
              <span className={`domain-dot ${color}`} />
              <div className="domain-name-block">
                <span className="domain-name">{name}</span>
                {isFocus && <span className="domain-focus-tag">фокус месяца</span>}
              </div>
              <div className="domain-score-block">
                <span className={`domain-score ${color}`}>{scoreLabel}</span>
                <span className={`domain-level ${color}`}>
                  {level}
                  {LEVEL_HINT[color] ? ` · ${LEVEL_HINT[color]}` : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
