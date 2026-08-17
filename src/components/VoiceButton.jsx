import { useSpeech } from '../hooks/useSpeech'

/**
 * Mic control next to a text field.
 * Snapshots current value on start and appends recognized speech.
 */
export default function VoiceButton({ onText, currentValue = '', label = 'Голосовой ввод' }) {
  const { supported, listening, error, start, stop, clearError } = useSpeech({ lang: 'ru-RU' })

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    clearError()

    if (listening) {
      stop()
      return
    }

    const base = String(currentValue ?? '')
    start({
      baseText: base,
      onUpdate: (next) => {
        onText(next)
      },
    })
  }

  if (!supported) {
    return (
      <div className="voice-wrap">
        <button
          type="button"
          className="btn-icon"
          title="Голосовой ввод недоступен. Нужен Chrome или Edge."
          disabled
          style={{ opacity: 0.4 }}
        >
          <MicIcon />
        </button>
        <span className="voice-hint">Нужен Chrome / Edge</span>
      </div>
    )
  }

  return (
    <div className="voice-wrap">
      <button
        type="button"
        className={`btn-icon ${listening ? 'recording' : ''}`}
        onClick={handleClick}
        title={listening ? 'Остановить диктовку' : label}
        aria-label={listening ? 'Остановить диктовку' : label}
        aria-pressed={listening}
      >
        <MicIcon />
      </button>
      {listening && <span className="voice-hint listening">Слушаю… говорите</span>}
      {error && (
        <span className="voice-hint error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
