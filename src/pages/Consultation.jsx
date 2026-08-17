import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Logo from '../components/Logo'
import SlideRenderer from '../components/SlideRenderer'
import { BLOCKS, SLIDES, slidesInBlock } from '../data/slides'
import { getLead, getLeadAsync, saveLead, patchAnswers } from '../lib/storage'
import { runAlgorithm, calcBMI } from '../lib/algorithm'
import { downloadPdf, generateRecommendationsPdf } from '../lib/pdf'

function SlideChrome({
  slide,
  answers,
  setAnswer,
  setAnswers,
  algorithm,
  recommendations,
  setRecommendation,
  lead,
  onStatus,
  onTariff,
  onNutrition,
  onPdf,
  interactive = true,
}) {
  // Frame slides render their own full title layout
  if (slide.type === 'frame') {
    return (
      <div className={`slide-chrome slide-chrome-frame ${interactive ? '' : 'is-frozen'}`}>
        <SlideRenderer
          slide={slide}
          answers={answers}
          setAnswer={interactive ? setAnswer : () => {}}
          setAnswers={interactive ? setAnswers : () => {}}
          algorithm={algorithm}
          recommendations={recommendations}
          setRecommendation={interactive ? setRecommendation : () => {}}
          lead={lead}
          onStatus={interactive ? onStatus : undefined}
          onTariff={interactive ? onTariff : undefined}
          onNutrition={interactive ? onNutrition : undefined}
          onPdf={interactive ? onPdf : undefined}
        />
      </div>
    )
  }

  return (
    <div className={`slide-chrome ${interactive ? '' : 'is-frozen'}`}>
      {slide.kicker && <div className="slide-kicker">{slide.kicker}</div>}
      <h1 className="slide-title">{slide.title}</h1>
      {slide.description && <p className="slide-desc">{slide.description}</p>}
      <div className="slide-content">
        <SlideRenderer
          slide={slide}
          answers={answers}
          setAnswer={interactive ? setAnswer : () => {}}
          setAnswers={interactive ? setAnswers : () => {}}
          algorithm={algorithm}
          recommendations={recommendations}
          setRecommendation={interactive ? setRecommendation : () => {}}
          lead={lead}
          onStatus={interactive ? onStatus : undefined}
          onTariff={interactive ? onTariff : undefined}
          onNutrition={interactive ? onNutrition : undefined}
          onPdf={interactive ? onPdf : undefined}
        />
      </div>
    </div>
  )
}

export default function Consultation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [globalIdx, setGlobalIdx] = useState(0)
  const [answers, setAnswersState] = useState({})
  const [recommendations, setRecs] = useState(null)
  const [algorithm, setAlgorithm] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const saveTimer = useRef(null)
  /** Book page flip: leaf covers old content, base already shows the new slide */
  const [pageFlip, setPageFlip] = useState(null) // { fromIdx, dir: 'next'|'prev' } | null
  const [isAnimating, setIsAnimating] = useState(false)
  const animBusy = useRef(false)
  const animTimer = useRef(null)

  const ANIM_MS = 680

  const slide = SLIDES[globalIdx]
  const total = SLIDES.length
  const progress = ((globalIdx + 1) / total) * 100

  // Load lead (local cache, then cloud if needed)
  useEffect(() => {
    let cancelled = false
    getLeadAsync(id).then((l) => {
      if (cancelled) return
      if (!l) {
        navigate('/')
        return
      }
      setLead(l)
      setAnswersState({ ...l.answers, name: l.name || l.answers?.name, sex: l.sex || l.answers?.sex })
      setAlgorithm(l.algorithm)
      setRecs(l.recommendations || l.algorithm?.recommendations || null)

      const bi = l.consultProgress?.blockIndex ?? 0
      const si = l.consultProgress?.slideIndex ?? 0
      let g = 0
      for (let b = 0; b < bi; b++) g += slidesInBlock(b).length
      g += si
      setGlobalIdx(Math.min(g, SLIDES.length - 1))
    })
    return () => {
      cancelled = true
    }
  }, [id, navigate])

  const flashSaved = () => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }

  const persist = useCallback(
    (nextAnswers, extras = {}) => {
      if (!lead) return
      const bmi = calcBMI(Number(nextAnswers.weight ?? lead.weight), Number(nextAnswers.height ?? lead.height))
      const withBmi = bmi != null ? { ...nextAnswers, bmi } : nextAnswers

      // progress indices
      let blockIndex = 0
      let slideIndex = globalIdx
      let acc = 0
      for (let b = 0; b < BLOCKS.length; b++) {
        const n = slidesInBlock(b).length
        if (globalIdx < acc + n) {
          blockIndex = b
          slideIndex = globalIdx - acc
          break
        }
        acc += n
      }

      const updated = patchAnswers(lead.id, withBmi, {
        consultProgress: { blockIndex, slideIndex },
        bmi: bmi ?? lead.bmi,
        ...extras,
      })
      if (updated) {
        setLead(updated)
        flashSaved()
      }
    },
    [lead, globalIdx]
  )

  const setAnswer = (key, value) => {
    setAnswersState((prev) => {
      const next = { ...prev, [key]: value }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => persist(next), 350)
      return next
    })
  }

  const setAnswers = (patch) => {
    setAnswersState((prev) => {
      const next = { ...prev, ...patch }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => persist(next), 350)
      return next
    })
  }

  const setRecommendation = (key, value) => {
    setRecs((prev) => {
      const next = { ...(prev || algorithm?.recommendations || {}), [key]: value }
      if (lead) {
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
          const u = saveLead({ ...getLead(lead.id), recommendations: next })
          setLead(u)
          flashSaved()
        }, 400)
      }
      return next
    })
  }

  // Entering assessment slides: (re)run algorithm so domain keys / flags stay correct
  useEffect(() => {
    if (!lead || !slide) return
    const isAlgoSlide = slide.block === 2 && slide.type === 'algo'
    const isSmartGoal = slide.type === 'smart_goal'
    if (!isAlgoSlide && !isSmartGoal) return
    // Always refresh numbers on picture + loss (fixes old broken focusKeys in cache)
    if (isAlgoSlide && slide.id !== 'b3-picture' && slide.id !== 'b3-loss') return

    const current = { ...getLead(lead.id), answers }
    const algo = runAlgorithm(current)
    // Fresh algo text uses paragraphs. Replace old wall-of-text without line breaks.
    const existing = current.recommendations || recommendations
    const fresh = algo.recommendations || {}
    const isWall =
      existing &&
      Object.values(existing).some((t) => t && String(t).length > 80 && !String(t).includes('\n'))
    const recs = !existing || isWall ? fresh : existing

    setAlgorithm(algo)
    setRecs(recs)
    const hist = current.history || []
    const alreadyLogged = hist.some((h) => h.event === 'algo')
    const u = saveLead({
      ...current,
      algorithm: algo,
      domainScores: algo.domains,
      recommendations: recs,
      bmi: algo.bmi,
      status: current.status === 'new' ? 'consulted' : current.status,
      history: alreadyLogged
        ? hist
        : [...hist, { at: new Date().toISOString(), event: 'algo', text: 'Рассчитана оценка и рекомендации' }],
    })
    setLead(u)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide?.id])

  const go = (delta) => {
    if (animBusy.current) return
    persist(answers)
    const next = globalIdx + delta
    if (next < 0) return
    if (next >= total) {
      navigate(`/lead/${lead.id}`)
      return
    }

    const dir = delta > 0 ? 'next' : 'prev'
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      setGlobalIdx(next)
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    // 1) Leaf = current page (turns away)
    // 2) Base switches to next immediately under the leaf. no enter anim, no snap at end
    animBusy.current = true
    setIsAnimating(true)
    setPageFlip({ fromIdx: globalIdx, dir })
    setGlobalIdx(next)
    window.scrollTo({ top: 0, behavior: 'auto' })

    // Safety if animationend doesn't fire
    if (animTimer.current) clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => {
      setPageFlip(null)
      animBusy.current = false
      setIsAnimating(false)
    }, ANIM_MS + 80)
  }

  const finishPageFlip = () => {
    if (animTimer.current) {
      clearTimeout(animTimer.current)
      animTimer.current = null
    }
    setPageFlip(null)
    animBusy.current = false
    setIsAnimating(false)
  }

  useEffect(
    () => () => {
      if (animTimer.current) clearTimeout(animTimer.current)
    },
    []
  )

  const onTariff = (tariffId) => {
    const u = saveLead({ ...getLead(lead.id), selectedTariff: tariffId, nutritionAddon: tariffId === 'transform' ? true : lead.nutritionAddon })
    setLead(u)
  }

  const onNutrition = (val) => {
    const u = saveLead({ ...getLead(lead.id), nutritionAddon: val })
    setLead(u)
  }

  const onStatus = (status, nextContactAt) => {
    const patch = { status }
    if (nextContactAt !== undefined) patch.nextContactAt = nextContactAt
    const cur = getLead(lead.id)
    const u = saveLead({
      ...cur,
      ...patch,
      history: [
        ...(cur.history || []),
        {
          at: new Date().toISOString(),
          event: 'status',
          text: `Статус: ${status}${nextContactAt ? `, касание ${nextContactAt}` : ''}`,
        },
      ],
    })
    setLead(u)
  }

  const onPdf = async () => {
    const cur = getLead(lead.id)
    const algo = algorithm || cur.algorithm || runAlgorithm({ ...cur, answers })
    const recs = recommendations || cur.recommendations || algo.recommendations
    try {
      const generated = await generateRecommendationsPdf({ ...cur, recommendations: recs }, algo)
      const { dataUrl } = generated
      await downloadPdf({ ...cur, recommendations: recs }, algo, generated)
      const u = saveLead({
        ...cur,
        algorithm: algo,
        recommendations: recs,
        pdfDataUrl: dataUrl,
        history: [...(cur.history || []), { at: new Date().toISOString(), event: 'pdf', text: 'Сформирован PDF' }],
      })
      setLead(u)
      setAlgorithm(algo)
      setRecs(recs)
    } catch (e) {
      console.error(e)
      window.alert('Не удалось сформировать PDF. Попробуйте ещё раз.')
    }
  }

  const blockMeta = BLOCKS[slide?.block ?? 0]
  const slideInBlock = useMemo(() => {
    if (!slide) return 0
    return slidesInBlock(slide.block).findIndex((s) => s.id === slide.id) + 1
  }, [slide])
  const slidesCount = slide ? slidesInBlock(slide.block).length : 0

  if (!lead || !slide) {
    return (
      <div className="consult">
        <div className="consult-body">
          <p className="muted">Загрузка...</p>
        </div>
      </div>
    )
  }

  const isLast = globalIdx === total - 1

  return (
    <div className="consult">
      <div className="consult-top">
        <div className="consult-top-inner">
          <div className="consult-meta">
            <Link to="/" className="consult-home-link" title="На главную, к списку лидов">
              <Logo size={36} />
            </Link>
            <div style={{ minWidth: 0 }}>
              <div className="consult-block-label">
                {blockMeta.title} · {slideInBlock}/{slidesCount}
              </div>
              <div className="consult-slide-title">{lead.name || 'Новый лид'}</div>
            </div>
          </div>
          <div className="consult-top-actions">
            <div className="save-label">
              <span className={`save-dot ${savedFlash ? 'visible' : ''}`} />
              {savedFlash ? 'Сохранено' : `${globalIdx + 1} / ${total}`}
            </div>
            <Link to={`/lead/${lead.id}`} className="btn-ghost btn-sm" onClick={() => persist(answers)}>
              Карточка
            </Link>
            <Link to="/" className="btn-outline btn-sm" onClick={() => persist(answers)}>
              На главную
            </Link>
          </div>
        </div>
        <div className="consult-progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <main
        className={`consult-body ${
          slide.type === 'tariff' ||
          slide.type === 'frame' ||
          slide.type === 'smart_goal' ||
          ['roads', 'faster', 'step', 'features', 'cabinet', 'objections', 'includes', 'guarantee', 'pay', 'goal_term'].includes(
            slide.view
          ) ||
          slide.id === 'b4-roads' ||
          slide.id === 'b4-faster'
            ? 'wide'
            : ''
        }`}
      >
        <div className={`book-stage ${pageFlip ? `is-flipping flip-${pageFlip.dir}` : ''}`} aria-live="polite">
          <div className="book-base">
            <SlideChrome
              slide={slide}
              answers={answers}
              setAnswer={setAnswer}
              setAnswers={setAnswers}
              algorithm={algorithm}
              recommendations={recommendations}
              setRecommendation={setRecommendation}
              lead={lead}
              onStatus={onStatus}
              onTariff={onTariff}
              onNutrition={onNutrition}
              onPdf={onPdf}
              interactive={!pageFlip}
            />
          </div>

          {pageFlip && SLIDES[pageFlip.fromIdx] && (
            <div
              className={`book-leaf flip-${pageFlip.dir}`}
              aria-hidden="true"
              onAnimationEnd={(e) => {
                // only the leaf transform animation, not shade child
                if (e.target !== e.currentTarget) return
                finishPageFlip()
              }}
            >
              <div className="book-leaf-front">
                <SlideChrome
                  slide={SLIDES[pageFlip.fromIdx]}
                  answers={answers}
                  setAnswer={() => {}}
                  setAnswers={() => {}}
                  algorithm={algorithm}
                  recommendations={recommendations}
                  setRecommendation={() => {}}
                  lead={lead}
                  interactive={false}
                />
              </div>
              <div className="book-leaf-back" />
              <div className="book-leaf-shade" />
            </div>
          )}
        </div>
      </main>

      <nav className="consult-nav">
        <div className="consult-nav-inner">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => go(-1)}
            disabled={globalIdx === 0 || isAnimating}
          >
            Назад
          </button>
          {isLast ? (
            <>
              <button
                type="button"
                className="btn-outline"
                disabled={isAnimating}
                onClick={() => {
                  persist(answers)
                  navigate(`/lead/${lead.id}`)
                }}
              >
                Карточка лида
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={isAnimating}
                onClick={() => {
                  persist(answers)
                  navigate('/')
                }}
              >
                На главную
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={() => go(1)} disabled={isAnimating}>
              Далее
            </button>
          )}
        </div>
      </nav>
    </div>
  )
}
