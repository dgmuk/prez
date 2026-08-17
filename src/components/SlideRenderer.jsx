import { useState } from 'react'
import { TextField, TextArea, ScaleField, ChoiceField } from './Field'
import DomainTraffic from './DomainTraffic'
import InfoTip from './InfoTip'
import { ProductShotRow } from './ProductShot'
import RecText from './RecText'
import { BLOCKS } from '../data/slides'
import { SLIDE_SCREENS } from '../data/productScreens'
import { calcBMI, bmiCategory, formatPrice, TARIFFS, NUTRITION_ADDON, suggestedTariff, buildSmartGoal } from '../lib/algorithm'

const DOMAIN_NAMES = {
  activity: 'Активность',
  training: 'Тренировки',
  nutrition: 'Питание',
  recovery: 'Восстановление',
  stress: 'Стресс',
}

export default function SlideRenderer({
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
}) {
  if (!slide) return null

  switch (slide.type) {
    case 'frame':
      return <FrameSlide slide={slide} />
    case 'fields':
      return <FieldsSlide slide={slide} answers={answers} setAnswer={setAnswer} setAnswers={setAnswers} />
    case 'textarea':
      return (
        <TextArea
          value={answers[slide.key] || ''}
          onChange={(v) => setAnswer(slide.key, v)}
          placeholder={slide.placeholder}
          tags={slide.tags}
        />
      )
    case 'choice':
      return (
        <ChoiceField
          value={answers[slide.key]}
          onChange={(v) => setAnswer(slide.key, v)}
          options={slide.options}
          cols={slide.cols || 2}
        />
      )
    case 'multi':
      return (
        <ChoiceField
          value={answers[slide.key] || []}
          onChange={(v) => setAnswer(slide.key, v)}
          options={slide.options}
          cols={2}
          multi
        />
      )
    case 'composite':
      return <CompositeSlide slide={slide} answers={answers} setAnswer={setAnswer} />
    case 'hormones':
      return <HormonesSlide answers={answers} setAnswer={setAnswer} sex={answers.sex || lead?.sex} />
    case 'algo':
      return (
        <AlgoSlide
          slide={slide}
          algorithm={algorithm}
          recommendations={recommendations}
          setRecommendation={setRecommendation}
          answers={answers}
          onPdf={onPdf}
        />
      )
    case 'content':
      return <ContentSlide slide={slide} algorithm={algorithm} answers={answers} />
    case 'smart_goal':
      return <SmartGoalSlide answers={answers} algorithm={algorithm} />
    case 'route':
      return <RouteGoal slide={slide} algorithm={algorithm} answers={answers} />
    case 'decision':
      return <DecisionSlide algorithm={algorithm} answers={answers} onPdf={onPdf} />
    case 'tariff':
      return (
        <TariffSlide
          slide={slide}
          algorithm={algorithm}
          answers={answers}
          selected={lead?.selectedTariff}
          nutrition={lead?.nutritionAddon}
          onTariff={onTariff}
          onNutrition={onNutrition}
        />
      )
    case 'crm_close':
      return <CrmClose onStatus={onStatus} onPdf={onPdf} lead={lead} />
    default:
      return <p className="muted">Неизвестный тип слайда</p>
  }
}

function FrameSlide({ slide }) {
  const n = (slide.block ?? 0) + 1
  const total = BLOCKS.length
  const num = String(n).padStart(2, '0')

  return (
    <div className="chapter-open">
      <div className="chapter-mark" aria-hidden="true">
        <span className="chapter-ring chapter-ring-a" />
        <span className="chapter-ring chapter-ring-b" />
        <span className="chapter-ring chapter-ring-c" />
        <span className="chapter-num">{num}</span>
      </div>

      <div className="chapter-meta anim-rise">
        <span className="chapter-badge">Блок {n} из {total}</span>
        {BLOCKS[slide.block]?.short && (
          <span className="chapter-short">{BLOCKS[slide.block].short}</span>
        )}
      </div>

      <h1 className="slide-title chapter-title anim-rise" style={{ animationDelay: '60ms' }}>
        {slide.title}
      </h1>
      {slide.description && (
        <p className="slide-desc chapter-desc anim-rise" style={{ animationDelay: '120ms' }}>
          {slide.description}
        </p>
      )}

      <div className="chapter-track" role="list" aria-label="Этапы консультации">
        {BLOCKS.map((b, i) => {
          const state = i < slide.block ? 'done' : i === slide.block ? 'active' : 'todo'
          return (
            <div key={b.id} className={`chapter-pill chapter-pill-${state} ${b.id === 'tariffs' ? 'chapter-pill-faded' : ''} anim-stagger`} style={{ '--stagger': i }} role="listitem">
              <span className="chapter-pill-num">{b.icon}</span>
              <span className="chapter-pill-label">{b.short}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FieldsSlide({ slide, answers, setAnswer, setAnswers }) {
  const bmi = slide.showBmi ? calcBMI(Number(answers.weight), Number(answers.height)) : null
  const cat = bmiCategory(bmi)

  const setField = (key, value) => {
    if (slide.showBmi && (key === 'weight' || key === 'height')) {
      const next = { ...answers, [key]: value }
      const nextBmi = calcBMI(Number(next.weight), Number(next.height))
      if (setAnswers) setAnswers({ [key]: value, bmi: nextBmi })
      else setAnswer(key, value)
      return
    }
    setAnswer(key, value)
  }

  return (
    <>
      <div className={`fields-grid ${slide.fields.length > 2 ? 'two' : ''}`}>
        {slide.fields.map((f) => {
          if (f.type === 'choice') {
            return (
              <div key={f.key} style={{ gridColumn: '1 / -1' }}>
                <ChoiceField
                  label={f.label}
                  value={answers[f.key]}
                  onChange={(v) => setField(f.key, v)}
                  options={f.options}
                  cols={2}
                />
              </div>
            )
          }
          if (f.type === 'textarea') {
            return (
              <div key={f.key} style={{ gridColumn: '1 / -1' }}>
                <TextArea
                  label={f.label}
                  value={answers[f.key] || ''}
                  onChange={(v) => setField(f.key, v)}
                  placeholder={f.placeholder}
                />
              </div>
            )
          }
          return (
            <TextField
              key={f.key}
              label={f.label}
              type={f.type || 'text'}
              value={answers[f.key] ?? ''}
              onChange={(v) => setField(f.key, v)}
              placeholder={f.placeholder}
              min={f.min}
              max={f.max}
              step={f.step}
              voice={f.voice || f.type === 'text' || !f.type}
            />
          )
        })}
      </div>
      {slide.showBmi && bmi != null && (
        <div className="bmi-display mt-16">
          <div>
            <div className="bmi-value">{bmi}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>ИМТ</div>
            <div className="bmi-label">{cat?.label || ''}</div>
          </div>
        </div>
      )}
    </>
  )
}

function CompositeSlide({ slide, answers, setAnswer }) {
  return (
    <div className="slide-content">
      {slide.fields.map((f) => {
        if (f.type === 'scale') {
          return (
            <ScaleField
              key={f.key}
              label={f.label}
              value={answers[f.key]}
              onChange={(v) => setAnswer(f.key, v)}
              lowHint={f.lowHint}
              highHint={f.highHint}
            />
          )
        }
        if (f.type === 'choice') {
          return (
            <ChoiceField
              key={f.key}
              label={f.label}
              value={answers[f.key]}
              onChange={(v) => setAnswer(f.key, v)}
              options={f.options}
              cols={f.cols || 2}
            />
          )
        }
        if (f.type === 'textarea') {
          return (
            <TextArea
              key={f.key}
              label={f.label}
              value={answers[f.key] || ''}
              onChange={(v) => setAnswer(f.key, v)}
              placeholder={f.placeholder}
              tags={f.tags}
            />
          )
        }
        if (f.type === 'number') {
          return (
            <TextField
              key={f.key}
              label={f.label}
              type="number"
              value={answers[f.key] ?? ''}
              onChange={(v) => setAnswer(f.key, v)}
              placeholder={f.placeholder}
              min={f.min}
              max={f.max}
              step={f.step}
            />
          )
        }
        return null
      })}
    </div>
  )
}

function HormonesSlide({ answers, setAnswer, sex }) {
  const isFemale = sex === 'female'
  if (isFemale) {
    return (
      <div className="slide-content">
        <ChoiceField
          label="Отметь, если замечаешь у себя в последнее время:"
          value={answers.femaleContext}
          onChange={(v) => setAnswer('femaleContext', v)}
          options={[
            { value: 'cycle', label: 'Сбои цикла / выраженный ПМС' },
            { value: 'edema', label: 'Отечность / задержка воды' },
            { value: 'mood', label: 'Резкие перепады настроения' },
            { value: 'energy', label: 'Спад энергии' },
            { value: 'ok', label: 'Всё отлично / В норме' },
          ]}
          cols={2}
        />
        <TextArea
          label="Комментарий"
          value={answers.hormoneNotes || ''}
          onChange={(v) => setAnswer('hormoneNotes', v)}
          placeholder="Уточнения, если сдавал анализы на гормоны..."
        />
      </div>
    )
  }
  return (
    <div className="slide-content">
      <p className="muted" style={{ marginBottom: 8 }}>
        Отметь, если замечаешь у себя в последнее время:
      </p>
      <ChoiceField
        label="Признаки"
        value={answers.maleHormones || []}
        onChange={(v) => setAnswer('maleHormones', v)}
        options={['Спад энергии / драйва', 'Снижение либидо', 'Жир на животе / талии', 'Долгое восстановление', 'Всё отлично / В норме']}
        cols={2}
        multi
      />
      <TextArea
        label="Комментарий"
        value={answers.hormoneNotes || ''}
        onChange={(v) => setAnswer('hormoneNotes', v)}
        placeholder="Уточнения, если сдавал анализы на гормоны..."
      />
    </div>
  )
}

function AlgoSlide({ slide, algorithm, recommendations, setRecommendation, answers, onPdf }) {
  if (!algorithm) {
    return <p className="muted">Заполните блоки 1-2, чтобы построить оценку.</p>
  }

  if (slide.view === 'picture') {
    return (
      <div className="slide-content">
        <div className="metrics-row">
          <div className="metric-pill">
            <div className="num">{algorithm.weight ?? '—'} кг</div>
            <div className="lbl">Вес</div>
          </div>
          <div className="metric-pill">
            <div className="num">{algorithm.bmi ?? '—'}</div>
            <div className="lbl">ИМТ · Избыточный вес</div>
          </div>
          <div className="metric-pill">
            <div className="num">{algorithm.tdee ?? '—'}</div>
            <div className="lbl">Расход в сутки (TDEE)</div>
          </div>
          <div className="metric-pill">
            <div className="num">{algorithm.bmr ?? '—'}</div>
            <div className="lbl">Базовый обмен (BMR)</div>
          </div>
        </div>
        <DomainTraffic domains={algorithm.domains} highlight={algorithm.focusKeys} />
      </div>
    )
  }

  if (slide.view === 'loss') {
    // Prefer ranked by focusKeys; fallback to 2-3 weakest if keys were broken in old saves
    let weak = (algorithm.ranked || []).filter((d) => algorithm.focusKeys?.includes(d.key) && DOMAIN_NAMES[d.key])
    if (!weak.length) {
      weak = [...(algorithm.ranked || [])]
        .filter((d) => DOMAIN_NAMES[d.key])
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)
    }
    // If ranked still empty (old cached algo without domain ids), rebuild from domains map
    if (!weak.length && algorithm.domains) {
      weak = Object.entries(algorithm.domains)
        .map(([key, d]) => ({
          key,
          score: d.score,
          color: d.color,
          label: d.label,
        }))
        .sort((a, b) => (a.score ?? 5) - (b.score ?? 5))
        .slice(0, 3)
    }

    return (
      <div className="slide-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {weak.map((d) => {
          const name = DOMAIN_NAMES[d.key] || d.key
          const why = lossWhy(d.key, answers, algorithm)
          return (
            <div key={d.key} className="card card-static loss-card" style={{ maxWidth: 480, width: '100%' }}>
              <div className="loss-card-head">
                <span className={`domain-dot ${d.color || 'red'}`} />
                <div className="loss-card-title">
                  <strong>{name}</strong>
                  <span className="loss-card-level">{d.label || 'Критическая зона'}</span>
                </div>
                <span className={`domain-score ${d.color || 'red'}`}>
                  {d.score == null ? '—' : `${d.score} / 5`}
                </span>
              </div>
              <p className="loss-card-why">{why}</p>
            </div>
          )
        })}
      </div>
    )
  }

  if (slide.view === 'realistic') {
    const w = algorithm.weight
    const tw = algorithm.targetWeight
    const deltaKg =
      w != null && tw != null ? Math.round((Number(tw) - Number(w)) * 10) / 10 : null
    const deltaAbs = deltaKg != null ? Math.abs(deltaKg) : null

    return (
      <div className="slide-content">
        <div className="highlight-box">
          <div className="muted" style={{ marginBottom: 6 }}>
            Цель: {algorithm.goal}
            {deltaAbs != null && deltaAbs > 0
              ? ` · снижение веса на ${deltaAbs} кг (${w} → ${tw} кг)`
              : ''}
          </div>
          <div className="big-num">
            {tw != null && w != null ? `${w} → ${tw} кг` : algorithm.goal}
          </div>
          <div className="mt-12 muted">
            Плавный дефицит калорий (-15-20%) с сохранением мышечной массы и энергии.
          </div>
        </div>

        <div className="metrics-row metrics-row-explained">
          <div className="metric-pill metric-pill-lg">
            <div className="num">~0.8 кг / нед.</div>
            <div className="lbl">Безопасный темп</div>
            <p className="metric-hint">
              Снижение жировой массы без потери мышц и срывов.
            </p>
          </div>
          <div className="metric-pill metric-pill-lg">
            <div className="num">~{algorithm.realMonths ?? '—'} месяцев</div>
            <div className="lbl">Горизонт работы</div>
            <p className="metric-hint">
              Оптимальный срок для закрепления результата и привычек.
            </p>
          </div>
          <div className="metric-pill metric-pill-lg">
            <div className="num">{algorithm.kcal}</div>
            <div className="lbl">Ккал / день</div>
            <p className="metric-hint">
              Комфортный коридор питания для стабильного жиросжигания.
            </p>
          </div>
        </div>

        <div className="domain-legend realistic-legend">
          <div className="domain-legend-title">Как считаем</div>
          <p className="domain-legend-text">
            Расчёт основан на физиологической норме снижения веса (до 1% массы тела в неделю) и сохранении нормы белка ({algorithm.protein ?? '—'} г/день).
          </p>
        </div>

        {algorithm.expectationsHigh && (
          <div className="card" style={{ padding: 16, borderColor: 'rgba(245,197,66,0.35)' }}>
            <strong style={{ color: 'var(--warning)' }}>Ожидания завышены</strong>
            <p className="muted mt-8" style={{ fontSize: '0.9rem' }}>
              Желаемый срок короче расчётного. За месяц цель обычно не закрыть: покажем честный горизонт
              и тариф 3-6 месяцев, чтобы не обещать невозможное.
            </p>
          </div>
        )}
      </div>
    )
  }

  if (slide.view === 'rec' || slide.view === 'summary') {
    const key = slide.recKey
    const text = recommendations?.[key] || algorithm.recommendations?.[key] || ''

    if (key === 'training' && slide.view === 'rec') {
      const freq = algorithm.freq || 3
      const pain = (answers.bodyPainZones || []).filter((z) => z && z !== 'Нет болей')
      const zones = (answers.priorityZones || []).slice(0, 3).join(', ') || 'укрепление общего тонуса'
      const hasPain = pain.length > 0 || algorithm.flags?.some((f) => f.key === 'pain')
      const safetyText = hasPain
        ? `Исключение осевых перегрузок и работа с учётом зон дискомфорта (${pain.join(', ')}). Комфортная амплитуда без боли.`
        : 'Исключение осевых перегрузок на поясницу и шею. Работа только в комфортной амплитуде без боли.'

      const cards = [
        {
          icon: '📅',
          title: 'Формат и график',
          text: `${freq} силовые тренировки в неделю по 50–60 минут. Фиксированная программа на 4 недели для адаптации.`,
        },
        {
          icon: '📈',
          title: 'Прогрессия и дневник',
          text: 'Пошаговый рост весов и повторений под контролем тренера. Ведение дневника тренировок в приложении.',
        },
        {
          icon: '🛡',
          title: 'Безопасность и здоровье',
          text: safetyText,
        },
        {
          icon: '🎯',
          title: 'Фокусные зоны',
          text: `Акцент на ${zones}.`,
        },
      ]

      return (
        <div className="slide-content">
          <div className="rec-cards">
            {cards.map((c, i) => (
              <div key={i} className="rec-card card card-static">
                <div className="rec-card-head">
                  <span className="rec-card-icon">{c.icon}</span>
                  <strong className="rec-card-title">{c.title}</strong>
                </div>
                <p className="rec-card-text">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="rec-edit-bar">
            <button
              type="button"
              className="btn-ghost btn-icon-only"
              title="Редактировать текст"
              onClick={() => {
                const el = document.querySelector('.rec-edit-hidden')
                if (el) el.open = !el.open
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
          </div>
          <details className="rec-edit-hidden" style={{ display: 'none' }}>
            <summary></summary>
            <div className="rec-section card card-static">
              <RecText
                storageKey={`slide-${key}`}
                value={text}
                onChange={(v) => setRecommendation(key, v)}
                rows={8}
              />
            </div>
          </details>
        </div>
      )
    }

    if (key === 'nutrition' && slide.view === 'rec') {
      const meals = answers.mealsPerDay != null ? Number(answers.mealsPerDay) : 3
      const mealCount = Math.min(Math.max(meals, 3), 4)
      const kcal = algorithm.kcal || '—'
      const protein = algorithm.protein || '—'
      const fat = algorithm.fat || '—'
      const carbs = algorithm.carbs || '—'
      const hasSweet = answers.sweetCraving === 'strong' || answers.emotionalEating === 'often' || algorithm.flags?.some((f) => f.key === 'emotional_eating')

      const cards = [
        {
          icon: '📊',
          title: 'Целевой коридор КБЖУ',
          text: `${kcal} ккал/день. Белок: ~${protein} г · Жиры: ~${fat} г · Углеводы: ~${carbs} г. Сохранение сытости и мышечной массы.`,
        },
        {
          icon: '🍽',
          title: 'Формат и привычки на первые 14 дней',
          text: `${mealCount} приёма пищи в день с порцией белка в каждом. Без взвешивания до грамма, фокус на регулярности и контроле перекусов.`,
        },
        {
          icon: '🍫',
          title: 'Гибкость и сладкое (без запретов)',
          text: hasSweet
            ? 'Плановые порции любимой еды 2–3 раза в неделю после основного приёма пищи. Защита от срывов и психологического отката.'
            : 'Гибкий подход без жёстких запретов. Любимая еда вписывается в коридор калорий без чувства вины.',
        },
        {
          icon: '🎯',
          title: 'Главный фокус первого месяца',
          text: 'Сокращение одного триггера: фастфуд не чаще 1 раза в неделю или замена сладких газировок и соков.',
        },
      ]

      return (
        <div className="slide-content">
          <div className="rec-cards">
            {cards.map((c, i) => (
              <div key={i} className="rec-card card card-static">
                <div className="rec-card-head">
                  <span className="rec-card-icon">{c.icon}</span>
                  <strong className="rec-card-title">{c.title}</strong>
                </div>
                <p className="rec-card-text">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="rec-edit-bar">
            <button
              type="button"
              className="btn-ghost btn-icon-only"
              title="Редактировать текст"
              onClick={() => {
                const el = document.querySelector('.rec-edit-hidden')
                if (el) el.open = !el.open
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
          </div>
          <details className="rec-edit-hidden" style={{ display: 'none' }}>
            <summary></summary>
            <div className="rec-section card card-static">
              <RecText
                storageKey={`slide-${key}`}
                value={text}
                onChange={(v) => setRecommendation(key, v)}
                rows={8}
              />
            </div>
          </details>
        </div>
      )
    }

    if (key === 'activity_recovery' && slide.view === 'rec') {
      const curSteps = answers.dailySteps
      const stepsText = curSteps != null
        ? `Плавный рост с ${curSteps.toLocaleString('ru-RU')} до 7 000–8 000 шагов в день (+1500 шагов в неделю). Две короткие прогулки по 10–15 мин вместо изнурительного кардио.`
        : 'Плавный рост до 7 000–8 000 шагов в день (+1500 шагов в неделю). Две короткие прогулки по 10–15 мин вместо изнурительного кардио.'
      const sleepH = answers.sleepHours
      const sleepTarget = algorithm.sleep || '7-8 ч'
      const sleepText = sleepH != null
        ? `Цель: ${sleepTarget} качественного сна (сейчас ≈ ${sleepH} ч). Фиксация стабильного времени отбоя (±30 мин) для снижения уровня стресса и отёчности.`
        : `Цель: ${sleepTarget} качественного сна. Фиксация стабильного времени отбоя (±30 мин) для снижения уровня стресса и отёчности.`

      const cards = [
        {
          icon: '🚶',
          title: 'Шаги и бытовая активность',
          text: stepsText,
        },
        {
          icon: '😴',
          title: 'Сон и режим отдыха',
          text: sleepText,
        },
        {
          icon: '☕',
          title: 'Гигиена восстановления',
          text: 'Кофеин не позднее 8 часов до сна, ограничение экранов за 40–60 минут до отдыха. Быстрое засыпание и бодрое утро.',
        },
      ]

      return (
        <div className="slide-content">
          <div className="rec-cards">
            {cards.map((c, i) => (
              <div key={i} className="rec-card card card-static">
                <div className="rec-card-head">
                  <span className="rec-card-icon">{c.icon}</span>
                  <strong className="rec-card-title">{c.title}</strong>
                </div>
                <p className="rec-card-text">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="rec-edit-bar">
            <button
              type="button"
              className="btn-ghost btn-icon-only"
              title="Редактировать текст"
              onClick={() => {
                const el = document.querySelector('.rec-edit-hidden')
                if (el) el.open = !el.open
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
          </div>
          <details className="rec-edit-hidden" style={{ display: 'none' }}>
            <summary></summary>
            <div className="rec-section card card-static">
              <RecText
                storageKey={`slide-${key}`}
                value={text}
                onChange={(v) => setRecommendation(key, v)}
                rows={8}
              />
            </div>
          </details>
        </div>
      )
    }

    if (key === 'stress_health' && slide.view === 'rec') {
      const pain = (answers.bodyPainZones || []).filter((z) => z && z !== 'Нет болей')
      const hasPain = pain.length > 0 || algorithm.flags?.some((f) => f.key === 'pain')
      const hasInjury = algorithm.flags?.some((f) => f.key === 'injury')
      const hasBP = algorithm.flags?.some((f) => f.key === 'bp')

      const cards = [
        {
          icon: '📋',
          title: 'Адаптация под рабочий график',
          text: 'Гибкое регулирование объёма: в недели высоких нагрузок на работе снижаем интенсивность, чтобы не перегружать ЦНС.',
        },
        {
          icon: '🦴',
          title: hasPain ? `Защита ${pain.slice(0, 2).join(' и ')}` : 'Защита шеи, поясницы и спины',
          text: 'Скрининг амплитуды движений на старте. Исключение опасных осевых нагрузок и подбор безопасных анатомических альтернатив.',
        },
        {
          icon: '🩹',
          title: 'Плавный ввод в процесс',
          text: hasInjury
            ? 'Поэтапное укрепление мышц кора и мышечного корсета с учётом истории операций. Без перегрузок и травм.'
            : 'Поэтапное укрепление мышц кора и мышечного корсета. Без резких скачков нагрузки.',
        },
      ]

      if (hasBP) {
        cards.push({
          icon: '❤️',
          title: 'Контроль давления',
          text: 'Умеренная интенсивность, удлинённая разминка. Без максимумов и резких пиков пульса. При сомнениях консультация врача.',
        })
      }

      return (
        <div className="slide-content">
          <div className="rec-cards">
            {cards.map((c, i) => (
              <div key={i} className="rec-card card card-static">
                <div className="rec-card-head">
                  <span className="rec-card-icon">{c.icon}</span>
                  <strong className="rec-card-title">{c.title}</strong>
                </div>
                <p className="rec-card-text">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="rec-edit-bar">
            <button
              type="button"
              className="btn-ghost btn-icon-only"
              title="Редактировать текст"
              onClick={() => {
                const el = document.querySelector('.rec-edit-hidden')
                if (el) el.open = !el.open
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
          </div>
          <details className="rec-edit-hidden" style={{ display: 'none' }}>
            <summary></summary>
            <div className="rec-section card card-static">
              <RecText
                storageKey={`slide-${key}`}
                value={text}
                onChange={(v) => setRecommendation(key, v)}
                rows={8}
              />
            </div>
          </details>
        </div>
      )
    }

    if (key === 'summary' && slide.view === 'summary') {
      const kcal = algorithm.kcal || '—'
      const protein = algorithm.protein || '—'
      const freq = algorithm.freq || 3
      const steps = algorithm.steps || '7 000–8 000'
      const sleep = algorithm.sleep || '7-8 ч'
      const paceKg = algorithm.weight != null ? Math.round(0.0075 * Number(algorithm.weight) * 10) / 10 : 0.8

      const cards = [
        {
          icon: '📊',
          title: 'Главные метрики месяца',
          items: [
            `Питание: ${kcal} ккал (Белок ~${protein} г)`,
            `Тренировки: ${freq} силовые в неделю`,
            `Активность: ${steps} шагов/день`,
            `Сон: ${sleep}`,
          ],
        },
        {
          icon: '🎯',
          title: 'Фокус первого этапа',
          items: [
            'Адаптация к регулярному режиму без срывов',
            'Защита суставов и мышечной массы',
            `Стабильный темп снижения веса (~${paceKg} кг/нед.)`,
          ],
        },
        {
          icon: '🏆',
          title: 'Результат через 4 недели',
          items: [
            `Первые устойчивые –${Math.round(paceKg * 4 * 10) / 10} кг`,
            'Рост тонуса, энергии и выносливости',
            'Сформированная система привычек без стресса',
          ],
        },
      ]

      return (
        <div className="slide-content">
          <div className="rec-cards">
            {cards.map((c, i) => (
              <div key={i} className="rec-card card card-static">
                <div className="rec-card-head">
                  <span className="rec-card-icon">{c.icon}</span>
                  <strong className="rec-card-title">{c.title}</strong>
                </div>
                <ul className="rec-card-list">
                  {c.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="rec-edit-bar">
            <button
              type="button"
              className="btn-ghost btn-icon-only"
              title="Редактировать текст"
              onClick={() => {
                const el = document.querySelector('.rec-edit-hidden')
                if (el) el.open = !el.open
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
          </div>
          <details className="rec-edit-hidden" style={{ display: 'none' }}>
            <summary></summary>
            <div className="rec-section card card-static">
              <RecText
                storageKey={`slide-${key}`}
                value={text}
                onChange={(v) => setRecommendation(key, v)}
                rows={8}
              />
            </div>
          </details>
        </div>
      )
    }

    return (
      <div className="slide-content">
        <div className="rec-section card card-static">
          <RecText
            storageKey={`slide-${key}`}
            value={text}
            onChange={(v) => setRecommendation(key, v)}
            rows={8}
          />
        </div>
        {slide.view === 'summary' && (
          <button type="button" className="btn-primary w-full" onClick={() => onPdf?.()}>
            Сформировать PDF
          </button>
        )}
      </div>
    )
  }

  return null
}

function lossWhy(key, answers, algo) {
  switch (key) {
    case 'activity':
      return `Мало бытовой активности (${answers.hoursSitting ?? '—'} ч сидя). Шаги ≈ ${answers.dailySteps ?? 'мало'}, цель: ${algo.steps}.`
    case 'training':
      return 'Нет системы и прогрессии. Нужна программа под цель, дневник и контроль техники.'
    case 'nutrition':
      return `Питание не настроено. Каркас: ${algo.kcal} ккал, белок ${algo.protein} г. Без этого результат из зала не закрепляется.`
    case 'recovery':
      return `Сон ${answers.sleepHours ?? '—'} ч, цель ${algo.sleep}. Без восстановления нет прогресса.`
    case 'stress':
      return 'Высокий стресс усиливает срывы и мешает сну. Нагрузку нужно согласовать с жизнью.'
    default:
      return 'Слабое место для цели. Пока его не подтянуть, остальные усилия дают меньше отдачи.'
  }
}

function FasterSlide({ algorithm, answers }) {
  const [expandedCard, setExpandedCard] = useState(null)

  const focus = algorithm?.focusKeys?.map((k) => DOMAIN_NAMES[k]).join(', ') || 'слабые места'
  const pain = (answers?.bodyPainZones || []).filter((z) => z && z !== 'Нет болей')
  const painText = pain.length > 0 ? pain.join(', ') : 'поясница и шея'
  const hasInjury = algorithm?.flags?.some((f) => f.key === 'injury')

  const items = [
    {
      num: '01',
      title: 'Точечный фокус на главном',
      text: `Не хватаемся за всё сразу. В первый месяц прицельно устраняем главные тормозы: ${focus}.`,
    },
    {
      num: '02',
      title: 'Безопасность и адаптация',
      text: hasInjury
        ? `Упражнения выстроены строго под твою биомеханику и ограничения (${painText}). Никаких шаблонных программ из интернета и риска травм.`
        : `Упражнения выстроены строго под твоё тело и зоны риска (${painText}). Никаких шаблонных программ из интернета и риска травм.`,
    },
    {
      num: '03',
      title: 'Еженедельная калибровка',
      text: 'Анализируем прогресс каждые 7 дней и точечно обновляем нагрузку. Вес не встаёт в плато, а ты не остаёшься один с бумажкой.',
    },
    {
      num: '04',
      title: 'Внешняя дисциплина и плечо',
      text: 'Личный контроль тренера и понятная система в приложении снимают стресс. Тебе не нужно заставлять себя через силу, процесс идёт по рельсам.',
    },
  ]

  const toggle = (num) => (e) => {
    e.stopPropagation()
    setExpandedCard((prev) => (prev === num ? null : num))
  }

  if (expandedCard !== null) {
    const item = items.find((i) => i.num === expandedCard)
    return (
      <div className="faster-expanded-overlay" onClick={() => setExpandedCard(null)}>
        <article className="faster-expanded-card" onClick={(e) => e.stopPropagation()}>
          <div className="faster-expanded-close" onClick={() => setExpandedCard(null)}>&times;</div>
          <div className="faster-num">{item.num}</div>
          <div className="faster-title">{item.title}</div>
          <p className="faster-text">{item.text}</p>
        </article>
      </div>
    )
  }

  return (
    <div className="faster-grid">
      {items.map((it) => (
        <article key={it.num} className="card faster-card faster-hover" onClick={toggle(it.num)}>
          <div className="faster-num">{it.num}</div>
          <div className="faster-title">{it.title}</div>
          <p className="faster-text">{it.text}</p>
        </article>
      ))}
    </div>
  )
}

function ContentSlide({ slide, algorithm, answers }) {
  if (slide.view === 'roads') {
    const name = answers?.name || 'Клиент'
    const w = algorithm?.weight || '—'
    const tw = answers?.targetWeight || algorithm?.targetWeight || '—'
    const pain = (answers?.bodyPainZones || []).filter((z) => z && z !== 'Нет болей')
    const painText = pain.length > 0 ? pain.join(' и ') : 'поясница и шея'
    const goalRaw = answers?.mainGoal || 'health'
    const goalMap = {
      lose: 'сбросить вес',
      definition: 'получить рельеф',
      mass: 'набрать массу',
      strength: 'стать сильнее',
      health: 'улучшить здоровье',
      maintain: 'удержать форму',
    }
    const goalText = goalMap[goalRaw] || goalRaw
    const idealForm = answers?.idealForm || ''
    const trigger = answers?.trigger || answers?.whyImportant || ''

    // Left column: personalized pain points
    const leftItems = [
      `Энтузиазм на 3-4 недели, затем спад и очередной откат назад`,
      `Риск перегрузить ${painText} из-за ошибок в технике`,
      `Срывы в питании, чувство вины и хаос без системы`,
      `Итог к лету: те же ${w} кг, одышка и стеснение на пляже`,
    ]

    // Right column: personalized solution + emotional goal
    const rightItems = [
      `Ежедневное ведение за руку, поддержка и страховка от слива`,
      `Адаптация упражнений под твоё тело и полный контроль безопасности`,
      `Гибкий рацион без жёстких запретов и стресса при авралах`,
      `Итог к лету: стабильные ${tw} кг, высокий тонус${idealForm ? ` и ${idealForm.toLowerCase()}` : ' и уверенность в себе'}`,
    ]

    return (
      <div className="roads">
        <article className="card road bad road-hover">
          <div className="road-badge road-badge-bad">Вариант 1 · Сам (по старому кругу)</div>
          <div className="road-title">Без системы</div>
          <ul>
            {leftItems.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </article>
        <article className="card road good road-hover">
          <div className="road-badge road-badge-good">Вариант 2 · С наставником в MetaSystem</div>
          <div className="road-title">С поддержкой</div>
          <ul>
            {rightItems.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </article>
      </div>
    )
  }

  if (slide.view === 'faster') {
    return <FasterSlide algorithm={algorithm} answers={answers} />
  }

  if (slide.view === 'step') {
    const shots = SLIDE_SCREENS[slide.id] || slide.screens || []
    const items = slide.cards || (slide.bullets || []).map((b) => ({ text: b }))
    return (
      <div className={`step-slide${slide.hideStepHero ? ' step-slide-compact' : ''}`}>
        {!slide.hideStepHero && (
          <div className="step-hero anim-rise">
            <div className="step-hero-label">Как это работает</div>
            <div className="step-hero-num">Шаг {slide.stepNum}</div>
          </div>
        )}
        <div className="step-with-shot">
          <div className={`anim-card-grid ${slide.horizontal ? 'horizontal' : ''}`}>
            {items.map((item, i) => (
              <article
                key={item.title || item.text}
                className="card anim-card anim-card-hover anim-stagger"
                style={{ '--stagger': i }}
              >
                <div className="anim-card-index">{String(i + 1).padStart(2, '0')}</div>
                {item.title && <div className="anim-card-title">{item.title}</div>}
                <div className="anim-card-text">{item.text}</div>
              </article>
            ))}
          </div>
          {shots.length > 0 && (
            <div className="step-shot-col anim-rise" style={{ animationDelay: '120ms' }}>
              <ProductShotRow keys={shots} />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (slide.view === 'features') {
    const shots = SLIDE_SCREENS[slide.id] || slide.screens || []
    return (
      <div className="features-with-shot">
        <div className="anim-card-grid features-grid">
          {(slide.bullets || []).map((b, i) => (
            <article
              key={b}
              className="card anim-card anim-card-hover anim-stagger"
              style={{ '--stagger': i }}
            >
              <div className="anim-card-check" aria-hidden>
                ✓
              </div>
              <div className="anim-card-text">{b}</div>
            </article>
          ))}
        </div>
        {shots.length > 0 && (
          <div className="features-shot-col">
            <ProductShotRow keys={shots} />
          </div>
        )}
      </div>
    )
  }

  if (slide.view === 'bento') {
    const items = slide.cards || []
    return (
      <div className="anim-card-grid features-grid objections-grid">
        {items.map((item, i) => (
          <article
            key={item.title}
            className="card objection anim-card-hover anim-stagger"
            style={{ '--stagger': i }}
          >
            <div className="objection-q">{item.title}</div>
            <div className="objection-a">{item.text}</div>
          </article>
        ))}
      </div>
    )
  }

  if (slide.view === 'cabinet') {
    const items = [
      { icon: '01', title: 'Программа', text: 'Тренировки на неделю всегда под рукой' },
      { icon: '02', title: 'Дневник', text: 'Веса и подходы за пару минут в зале' },
      { icon: '03', title: 'Фото и цифры', text: 'Видно, растёшь ты или стоишь' },
      { icon: '04', title: 'Чат', text: 'Вопрос тренеру без поиска в переписке' },
      { icon: '05', title: 'Правки', text: 'Новая версия программы каждую неделю' },
      { icon: '06', title: 'Всё вместе', text: 'Один вход. Без WhatsApp и папок с PDF' },
    ]
    const shots = SLIDE_SCREENS[slide.id] || ['cabinet']
    return (
      <div className="showcase-slide">
        <div className="showcase-hero anim-rise">
          <div className="showcase-hero-kicker">Личный кабинет</div>
          <div className="showcase-hero-title">Всё в одном месте</div>
          <p className="showcase-hero-text">
            Не нужно собирать переписку в мессенджере и файлы по папкам. Программа, дневник, фото, цифры и
            чат открываются в одном окне.
          </p>
        </div>
        <div className="cabinet-layout">
          <div className="anim-card-grid features-grid">
            {items.map((it, i) => (
              <article
                key={it.title}
                className="card anim-card anim-card-hover anim-stagger"
                style={{ '--stagger': i }}
              >
                <div className="anim-card-index">{it.icon}</div>
                <div className="anim-card-title">{it.title}</div>
                <div className="anim-card-text muted-soft">{it.text}</div>
              </article>
            ))}
          </div>
          <div className="cabinet-shot anim-rise" style={{ animationDelay: '100ms' }}>
            <ProductShotRow keys={shots} />
          </div>
        </div>
      </div>
    )
  }

  if (slide.view === 'objections') {
    const tw = answers?.targetWeight
    const items = [
      {
        q: 'Вопрос стоимости',
        a: 'Считаем цену результата, а не абонемента. Месяцы тренировок вслепую обходятся дороже. Плюс действует 5 дней гарантии полного возврата.',
      },
      {
        q: 'Справлюсь ли сам?',
        a: 'План в PDF останется у тебя. Но наставник берет на себя контроль, страхует спину от перегрузок и экономит месяцы проб и ошибок.',
      },
      {
        q: 'Будет ли сложно?',
        a: 'Приложение интуитивное: 2 клика на подход в зале, видео-подсказки к каждому движению и постоянная поддержка в чате.',
      },
      {
        q: 'Хочу подумать',
        a: tw
          ? `Подумать — это нормально. Главное не откладывать тело на потом: чем раньше наладим систему, тем быстрее увидишь свои ${tw} кг.`
          : 'Подумать — это нормально. Главное не откладывать тело на потом: чем раньше наладим систему, тем быстрее увидишь результат.',
      },
    ]
    return (
      <div className="anim-card-grid features-grid objections-grid">
        {items.map((it, i) => (
          <article
            key={it.q}
            className="card objection anim-card-hover anim-stagger"
            style={{ '--stagger': i }}
          >
            <div className="objection-q">{it.q}</div>
            <div className="objection-a">{it.a}</div>
          </article>
        ))}
      </div>
    )
  }

  if (slide.view === 'includes') {
    const items = [
      'Личный кабинет. Всё в одном окне',
      'Программа под тебя, не шаблон из интернета',
      'Правки каждую неделю по твоим результатам',
      'Разбор техники по видео',
      'Чат с тренером',
      'Отслеживание прогресса: цифры и фото',
      'Гарантия 5 дней, полный возврат',
    ]
    return (
      <div className="anim-card-grid features-grid">
        {items.map((b, i) => (
          <article
            key={b}
            className="card anim-card anim-card-hover anim-stagger"
            style={{ '--stagger': i }}
          >
            <div className="anim-card-check" aria-hidden>
              ✓
            </div>
            <div className="anim-card-text">{b}</div>
          </article>
        ))}
      </div>
    )
  }

  if (slide.view === 'guarantee') {
    const items = [
      {
        title: 'Полный доступ',
        text: 'С первого дня открываются все тренировки, дневник, видеоразборы техники и персональный чат со мной.',
      },
      {
        title: 'Оценка комфорта',
        text: 'Ты тестируешь нагрузку на практике и понимаешь, насколько система органично вписывается в твой график.',
      },
      {
        title: 'Возврат без споров',
        text: 'Если в течение 5 дней решишь, что формат не для тебя, одно сообщение в чат, и мы возвращаем 100% оплаты.',
      },
    ]
    return (
      <div className="guarantee-grid">
        {items.map((item, i) => (
          <article
            key={item.title}
            className="card guarantee-card anim-card anim-stagger"
            style={{ '--stagger': i }}
          >
            <div className="guarantee-card-num">{String(i + 1).padStart(2, '0')}</div>
            <div className="guarantee-card-title">{item.title}</div>
            <div className="guarantee-card-text">{item.text}</div>
          </article>
        ))}
      </div>
    )
  }

  if (slide.view === 'pay') {
    const items = [
      {
        title: 'Фиксация условий',
        text: 'Отправляю ссылку на безопасную оплату с сохранением скидки 25% и бонусов.',
      },
      {
        title: 'Вход в систему',
        text: 'Мгновенно открывается доступ к личному кабинету и твоему персональному чату со мной.',
      },
      {
        title: 'Онбординг и тесты',
        text: 'Заполняешь анкету по здоровью и записываешь короткие видео-тесты осанки и суставов.',
      },
      {
        title: 'Готовая программа',
        text: 'В течение 24–48 часов персональный план загружается в твой профиль, и мы начинаем.',
      },
    ]
    return (
      <div className="anim-card-grid features-grid objections-grid">
        {items.map((item, i) => (
          <article
            key={item.title}
            className="card objection anim-card-hover anim-stagger"
            style={{ '--stagger': i }}
          >
            <div className="objection-q">{String(i + 1).padStart(2, '0')}. {item.title}</div>
            <div className="objection-a">{item.text}</div>
          </article>
        ))}
      </div>
    )
  }

  return <p className="muted">{slide.description}</p>
}

function SmartGoalSlide({ answers, algorithm }) {
  const smart = buildSmartGoal(answers, algorithm)

  const parts = [
    { letter: 'S', label: 'Конкретная', text: smart.specific, color: '#c8f542' },
    { letter: 'M', label: 'Измеримая', text: smart.measurable, color: '#42f5e0' },
    { letter: 'A', label: 'Достижимая', text: smart.achievable, color: '#f5c842' },
    { letter: 'R', label: 'Значимая', text: smart.relevant, color: '#f57842' },
    { letter: 'T', label: 'Срок', text: smart.timeBound, color: '#b442f5' },
  ]

  return (
    <div className="smart-goal-slide">
      <div className="smart-goal-short">
        {smart.short}
      </div>

      <div className="smart-goal-compact">
        {parts.map((p) => (
          <div key={p.letter} className="smart-row">
            <span className="smart-row-letter" style={{ color: p.color }}>{p.letter}</span>
            <span className="smart-row-label">{p.label}:</span>
            <span className="smart-row-text">{p.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DecisionSlide({ algorithm, answers, onPdf }) {
  const name = answers?.name || 'Клиент'
  const w = algorithm?.weight || '—'
  const tw = answers?.targetWeight || algorithm?.targetWeight || '—'

  return (
    <div className="showcase-slide decision-compact">
      <div className="showcase-hero anim-rise">
        <div className="showcase-hero-kicker">Точка выбора</div>
        <div className="showcase-hero-title">Два пути: что дальше?</div>
        <p className="showcase-hero-text">
          {name}, у тебя на руках персональный план. Можно забрать его и попробовать самому, а можно начать с поддержкой и не гадать.
        </p>
      </div>

      <div className="roads">
        <article className="card road bad road-hover">
          <div className="road-badge road-badge-bad">Путь 1</div>
          <div className="road-title">Самостоятельно</div>
          <ul>
            <li>Забираешь PDF с планом</li>
            <li>Пробуешь внедрить сам</li>
            <li>Без обратной связи и страховки от срывов</li>
          </ul>
        </article>
        <article className="card road good road-hover">
          <div className="road-badge road-badge-good">Путь 2</div>
          <div className="road-title">С наставником</div>
          <ul>
            <li>Ежедневный контроль тренера</li>
            <li>Корректировки каждую неделю</li>
            <li>Страховка от отката и потери мотивации</li>
          </ul>
        </article>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => onPdf?.()}>
          Сформировать и отправить PDF
        </button>
        <button type="button" className="btn-primary" style={{ flex: 1 }}>
          Да, показать систему ведения →
        </button>
      </div>
    </div>
  )
}

function RouteGoal({ algorithm, answers }) {
  return (
    <div className="showcase-slide">
      <article className="card anim-card anim-card-hover anim-stagger" style={{ '--stagger': 0 }}>
        <div className="field-label">К чему ты идёшь</div>
        <div className="route-goal-text">
          {answers.idealForm || algorithm?.goal || '—'}
        </div>
        {answers.mainGoal && (
          <div className="muted mt-8" style={{ fontSize: '0.95rem' }}>
            Главная цель: {algorithm?.goal}
            {answers.targetWeight ? `. Хочешь выйти на ${answers.targetWeight} кг` : ''}
          </div>
        )}
      </article>
      <div className="showcase-hero anim-rise" style={{ animationDelay: '80ms' }}>
        <div className="showcase-hero-kicker">Сколько это займёт по-честному</div>
        <div className="showcase-hero-title big-num-hero">
          {algorithm?.realWeeks != null ? `~${algorithm.realWeeks} недель` : '—'}
        </div>
        <p className="showcase-hero-text">
          {algorithm?.realMonths != null ? `Это примерно ${algorithm.realMonths} мес. ` : ''}
          {algorithm?.expectationsHigh
            ? 'Ты хотел быстрее, но безопасный темп длиннее. Лучше честный срок, чем срыв.'
            : 'Темп безопасный, без ломки и без обещания всё сбросить за две недели.'}
        </p>
      </div>
    </div>
  )
}

function TariffSlide({ slide, algorithm, answers, selected, nutrition, onTariff, onNutrition }) {
  const rec = suggestedTariff(algorithm?.realMonths)
  const showStream = slide.view === 'stream' || slide.view === 'pick'
  const showOld = slide.view === 'anchor' || slide.view === 'stream' || slide.view === 'pick'
  const activeTariff = selected || rec

  if (slide.view === 'nutrition') {
    const isGift = selected === 'transform'
    const isActive = nutrition || isGift
    const items = [
      'Индивидуальный расчет КБЖУ под динамику снижения веса.',
      'Простая продуктовая корзина и готовые варианты приемов пищи.',
      'Стратегия для ресторанов, поездок и перекусов без срывов.',
      'Еженедельная калибровка рациона по результатам замеров.',
    ]
    return (
      <div className="nutrition-slide">
        <div className="anim-card-grid features-grid objections-grid">
          {items.map((text, i) => (
            <article
              key={text}
              className="card objection anim-card-hover anim-stagger"
              style={{ '--stagger': i }}
            >
              <div className="objection-q">{String(i + 1).padStart(2, '0')}</div>
              <div className="objection-a">{text}</div>
            </article>
          ))}
        </div>
        <button
          type="button"
          className={`nutrition-toggle ${isActive ? 'active' : ''} ${isGift ? 'locked' : ''}`}
          onClick={() => !isGift && onNutrition?.(!nutrition)}
          disabled={isGift}
        >
          <div className="nutrition-toggle-check">{isActive ? '✓' : ''}</div>
          <div className="nutrition-toggle-content">
            <div className="nutrition-toggle-title">
              {isGift ? 'Ведение по питанию включено в ваш тариф' : 'Добавить модуль питания к программе'}
            </div>
            <div className="nutrition-toggle-price">
              {isGift ? '0 ₽ (В подарок)' : `+${formatPrice(NUTRITION_ADDON)} ₽`}
            </div>
          </div>
        </button>
      </div>
    )
  }

  const tw = answers?.targetWeight
  const realMonths = algorithm?.realMonths
  const showRecommendation = !selected && (slide.view === 'anchor' || slide.view === 'stream' || slide.view === 'pick') && (tw || realMonths)

  return (
    <div className="slide-content">
      {showRecommendation && (
        <p className="slide-desc" style={{ marginBottom: 16 }}>
          {tw && realMonths
            ? <>До твоей цели ({tw} кг) по расчету около {realMonths} мес. Рекомендуемый формат —{' '}<strong style={{ color: 'var(--accent)' }}>{TARIFFS[rec]?.name}</strong>.</>
            : tw
              ? <>Твоя цель: {tw} кг. Рекомендуемый формат —{' '}<strong style={{ color: 'var(--accent)' }}>{TARIFFS[rec]?.name}</strong>.</>
              : <>Рекомендуемый формат по расчету —{' '}<strong style={{ color: 'var(--accent)' }}>{TARIFFS[rec]?.name}</strong>.</>
          }
        </p>
      )}
      <div className="tariff-grid three">
        {Object.values(TARIFFS).map((t) => {
          const isRec = t.id === rec && !selected
          const isSel = t.id === activeTariff
          const price = showStream ? t.priceStream : t.priceRegular
          return (
            <button
              key={t.id}
              type="button"
              className={`card tariff-card ${isSel ? 'recommended' : ''}`}
              onClick={() => onTariff?.(t.id)}
            >
              {isSel && (
                <span className="tariff-badge">
                  {selected ? 'Выбран' : 'Рекомендуем по расчету'}
                </span>
              )}
              <div className="tariff-name">{t.name}</div>
              <div className="tariff-term">{t.months} мес. · {t.desc}</div>
              {t.longDesc && <div className="tariff-long-desc">{t.longDesc}</div>}
              {showOld && showStream && (
                <div className="tariff-price-old">{formatPrice(t.priceRegular)} ₽</div>
              )}
              <div className="tariff-price">{formatPrice(price)} ₽</div>
              {showStream && t.months > 1 && (
                <div className="tariff-month">~{formatPrice(Math.round(t.priceStream / t.months))} ₽/мес</div>
              )}
              {showStream && (
                <span className="tariff-save">−{formatPrice(t.priceRegular - t.priceStream)} ₽</span>
              )}
              {t.nutritionGift && <div className="muted mt-8" style={{ fontSize: '0.75rem' }}>Питание в подарок</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CrmClose({ onStatus, onPdf, lead }) {
  // Client-facing labels; CRM keys stay the same under the hood
  const options = [
    {
      v: 'thinking',
      l: 'Иду сам по плану',
      d: 'Скачиваю PDF и тренируюсь самостоятельно.',
    },
    {
      v: 'bought',
      l: 'Зафиксировать скидку 25%',
      d: 'Бронирую спецусловие на 48 часов, чтобы принять решение.',
    },
    {
      v: 'callback',
      l: 'Напомнить позже',
      d: 'Назначить короткий созвон или сообщение через пару дней.',
    },
  ]

  return (
    <div className="crm-close">
      <div className="crm-close-choices">
        {options.map((s) => (
          <button
            key={s.v}
            type="button"
            className={`choice-card ${lead?.status === s.v ? 'selected' : ''}`}
            onClick={() => onStatus?.(s.v)}
          >
            <div className="choice-title">{s.l}</div>
            <div className="choice-desc">{s.d}</div>
          </button>
        ))}
      </div>

      <label className="crm-close-date">
        <input
          type="date"
          className="field-input"
          value={lead?.nextContactAt || ''}
          onChange={(e) => onStatus?.(lead?.status || 'thinking', e.target.value)}
          placeholder=" "
        />
        <span className="crm-close-date-label">Удобная дата для связи (необязательно)</span>
      </label>

      <button type="button" className="btn-primary crm-close-btn" onClick={() => onPdf?.()}>
        Скачать персональный план в PDF
      </button>
      <p className="crm-close-note muted">
        Спецусловия после разбора сохраняются в течение 48 часов.
      </p>
    </div>
  )
}
