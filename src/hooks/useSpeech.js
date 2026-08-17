import { useCallback, useEffect, useRef, useState } from 'react'

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

/**
 * Web Speech API dictation hook.
 * Snapshots base text at start, then writes base + live transcript.
 */
export function useSpeech({ lang = 'ru-RU' } = {}) {
  const [supported] = useState(() => Boolean(getSpeechRecognition()))
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const [interim, setInterim] = useState('')

  const recRef = useRef(null)
  const baseTextRef = useRef('')
  const finalSessionRef = useRef('')
  const onUpdateRef = useRef(null)
  const intentionalStopRef = useRef(false)
  const restartTimerRef = useRef(null)

  const stop = useCallback(() => {
    intentionalStopRef.current = true
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    try {
      recRef.current?.abort()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
    setInterim('')
  }, [])

  const emit = useCallback((sessionFinal, sessionInterim) => {
    const base = baseTextRef.current
    const piece = `${sessionFinal}${sessionInterim}`.trim()
    let next
    if (!base) next = piece
    else if (!piece) next = base
    else {
      const sep = /[\s\n]$/.test(base) || /^[.,!?;:]/.test(piece) ? '' : ' '
      next = `${base}${sep}${piece}`
    }
    onUpdateRef.current?.(next, !sessionInterim)
  }, [])

  const start = useCallback(
    ({ baseText = '', onUpdate } = {}) => {
      const SR = getSpeechRecognition()
      if (!SR) {
        setError('Браузер не поддерживает голосовой ввод. Откройте Chrome или Edge.')
        return
      }

      // Toggle off if already listening
      if (recRef.current || listening) {
        stop()
        return
      }

      setError(null)
      intentionalStopRef.current = false
      baseTextRef.current = baseText || ''
      finalSessionRef.current = ''
      onUpdateRef.current = onUpdate
      setInterim('')

      const createRec = () => {
        const rec = new SR()
        rec.lang = lang
        rec.interimResults = true
        rec.continuous = true
        rec.maxAlternatives = 1

        rec.onstart = () => {
          setListening(true)
          setError(null)
        }

        rec.onresult = (event) => {
          let interimText = ''
          let newlyFinal = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcript = (result[0]?.transcript || '').trim()
            if (!transcript) continue
            if (result.isFinal) newlyFinal += (newlyFinal ? ' ' : '') + transcript
            else interimText += (interimText ? ' ' : '') + transcript
          }
          if (newlyFinal) {
            finalSessionRef.current = finalSessionRef.current
              ? `${finalSessionRef.current} ${newlyFinal}`
              : newlyFinal
          }
          setInterim(interimText)
          emit(finalSessionRef.current, interimText)
        }

        rec.onerror = (event) => {
          const code = event.error || 'unknown'
          // benign: keep session for continuous restart
          if (code === 'no-speech') {
            if (!finalSessionRef.current) {
              setError('Речь не распознана. Говорите после нажатия на микрофон.')
            }
            return
          }
          if (code === 'aborted') return

          const messages = {
            'not-allowed': 'Нет доступа к микрофону. Разрешите микрофон для этого сайта (замок у адреса → Микрофон).',
            'service-not-allowed': 'Голосовой сервис недоступен. Проверьте разрешения и сеть.',
            network: 'Нужен интернет: Chrome отправляет речь на сервер Google.',
            'audio-capture': 'Микрофон не найден. Подключите микрофон и повторите.',
            'language-not-supported': 'Язык ru-RU не поддерживается в этом браузере.',
            'bad-grammar': 'Ошибка распознавания.',
          }
          // fatal: do not auto-restart
          intentionalStopRef.current = true
          setError(messages[code] || `Ошибка голосового ввода: ${code}`)
          setListening(false)
        }

        rec.onend = () => {
          // Chrome often ends continuous sessions; auto-restart while user wants dictation
          if (!intentionalStopRef.current && recRef.current === rec) {
            restartTimerRef.current = setTimeout(() => {
              if (intentionalStopRef.current) return
              try {
                const next = createRec()
                recRef.current = next
                next.start()
              } catch {
                intentionalStopRef.current = true
                setListening(false)
                setError('Не удалось продолжить диктовку. Нажмите микрофон ещё раз.')
                recRef.current = null
              }
            }, 280)
            return
          }
          setListening(false)
          setInterim('')
          recRef.current = null
        }

        return rec
      }

      try {
        const rec = createRec()
        recRef.current = rec
        rec.start()
        setListening(true)
      } catch (e) {
        setListening(false)
        setError(
          e?.message?.includes('already')
            ? 'Распознавание уже запущено. Подождите секунду и нажмите снова.'
            : 'Не удалось запустить микрофон. Разрешите доступ и откройте сайт в Chrome/Edge.'
        )
      }
    },
    [emit, lang, listening, stop]
  )

  useEffect(() => () => stop(), [stop])

  return { supported, listening, error, interim, start, stop, clearError: () => setError(null) }
}
