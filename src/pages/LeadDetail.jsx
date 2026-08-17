import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Logo from '../components/Logo'
import DomainTraffic from '../components/DomainTraffic'
import { getLead, getLeadAsync, saveLead, deleteLeadAsync, STATUS, statusBadge, statusLabel, addHistory } from '../lib/storage'
import { runAlgorithm, TARIFFS, NUTRITION_ADDON, formatPrice } from '../lib/algorithm'
import { calcDealAmount, tariffName } from '../lib/sales'
import { downloadPdf, generateRecommendationsPdf } from '../lib/pdf'
import { TextArea } from '../components/Field'
import RecText from '../components/RecText'
import { formatRecommendationText } from '../lib/algorithm'

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getLeadAsync(id).then((l) => {
      if (!cancelled) {
        setLead(l)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="dashboard">
        <p className="muted">Загрузка карточки…</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="dashboard">
        <p className="muted">Лид не найден.</p>
        <Link to="/" className="btn-outline mt-16">
          В CRM
        </Link>
      </div>
    )
  }

  const update = (patch) => {
    const next = saveLead({ ...lead, ...patch })
    setLead(next)
  }

  const recompute = () => {
    const algo = runAlgorithm(lead)
    const next = saveLead({
      ...lead,
      algorithm: algo,
      domainScores: algo.domains,
      recommendations: algo.recommendations,
      bmi: algo.bmi,
    })
    setLead(next)
  }

  const handlePdf = async () => {
    const algo = lead.algorithm || runAlgorithm(lead)
    const recs = lead.recommendations || algo.recommendations
    try {
      const generated = await generateRecommendationsPdf({ ...lead, recommendations: recs }, algo)
      const { dataUrl } = generated
      await downloadPdf({ ...lead, recommendations: recs }, algo, generated)
      const next = saveLead({
        ...lead,
        algorithm: algo,
        recommendations: recs,
        pdfDataUrl: dataUrl,
        history: [
          ...(lead.history || []),
          { at: new Date().toISOString(), event: 'pdf', text: 'Сформирован PDF рекомендаций' },
        ],
      })
      setLead(next)
    } catch (e) {
      console.error(e)
      window.alert('Не удалось сформировать PDF. Попробуйте ещё раз.')
    }
  }

  const remove = async () => {
    if (window.confirm('Удалить лида локально и в Supabase?')) {
      await deleteLeadAsync(lead.id)
      navigate('/')
    }
  }

  const algo = lead.algorithm

  return (
    <div className="lead-detail">
      <header className="detail-header">
        <div className="brand">
          <Link to="/" className="detail-home-link" title="На главную">
            <Logo />
          </Link>
          <div>
            <div className="brand-name">{lead.name || 'Без имени'}</div>
            <div className="brand-sub">
              {lead.telegram || 'нет Telegram'} ·{' '}
              <span className={`badge ${statusBadge(lead.status)}`}>{statusLabel(lead.status)}</span>
            </div>
          </div>
        </div>
        <div className="detail-actions">
          <Link to="/" className="btn-outline">
            ← На главную
          </Link>
          <Link to={`/consult/${lead.id}`} className="btn-primary">
            {lead.algorithm ? 'Продолжить / дозаполнить' : 'Начать консультацию'}
          </Link>
          <button type="button" className="btn-ghost" onClick={handlePdf}>
            PDF
          </button>
          <button type="button" className="btn-ghost" onClick={remove}>
            Удалить
          </button>
        </div>
      </header>

      <div className="detail-grid">
        <section className="card detail-section card-static">
          <h3>Контакт</h3>
          <label className="field mb-8">
            <span className="field-label">Имя</span>
            <input className="field-input" value={lead.name || ''} onChange={(e) => update({ name: e.target.value })} />
          </label>
          <label className="field mb-8">
            <span className="field-label">Telegram</span>
            <input
              className="field-input"
              value={lead.telegram || ''}
              onChange={(e) => update({ telegram: e.target.value })}
            />
          </label>
          <div className="fields-grid two">
            <label className="field">
              <span className="field-label">Пол</span>
              <select className="field-select" value={lead.sex || 'male'} onChange={(e) => update({ sex: e.target.value })}>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">Возраст</span>
              <input
                className="field-input"
                type="number"
                value={lead.age ?? ''}
                onChange={(e) => update({ age: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Рост, см</span>
              <input
                className="field-input"
                type="number"
                value={lead.height ?? ''}
                onChange={(e) => update({ height: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Вес, кг</span>
              <input
                className="field-input"
                type="number"
                value={lead.weight ?? ''}
                onChange={(e) => update({ weight: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </label>
          </div>
          {lead.bmi != null && (
            <div className="bmi-display mt-16">
              <div className="bmi-value">{lead.bmi}</div>
              <div className="bmi-label">ИМТ</div>
            </div>
          )}
        </section>

        <section className="card detail-section card-static">
          <h3>CRM</h3>
          <label className="field mb-8">
            <span className="field-label">Статус</span>
            <select
              className="field-select"
              value={lead.status}
              onChange={(e) => {
                const status = e.target.value
                const patch = { status }
                // When marking bought, prefill purchase from consultation choice
                if (status === 'bought' && !lead.purchasedTariff && lead.selectedTariff) {
                  const priceType = lead.purchasePriceType || 'stream'
                  patch.purchasedTariff = lead.selectedTariff
                  patch.purchasedAt = lead.purchasedAt || new Date().toISOString().slice(0, 10)
                  patch.purchasePrice = calcDealAmount({
                    tariffId: lead.selectedTariff,
                    nutrition: lead.nutritionAddon,
                    priceType,
                  })
                  patch.purchasePriceType = priceType
                }
                update(patch)
                addHistory(lead.id, 'status', `Статус: ${statusLabel(status)}`)
              }}
            >
              {Object.values(STATUS).map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field mb-8">
            <span className="field-label">Следующее касание</span>
            <input
              type="date"
              className="field-input"
              value={lead.nextContactAt || ''}
              onChange={(e) => update({ nextContactAt: e.target.value || null })}
            />
          </label>

          <div className="purchase-box">
            <div className="field-label" style={{ marginBottom: 10 }}>
              Покупка
            </div>
            <label className="field mb-8">
              <span className="field-label">Тариф (куплен)</span>
              <select
                className="field-select"
                value={lead.purchasedTariff || lead.selectedTariff || ''}
                onChange={(e) => {
                  const purchasedTariff = e.target.value || null
                  const priceType = lead.purchasePriceType || 'stream'
                  const nutrition = lead.nutritionAddon
                  const purchasePrice = purchasedTariff
                    ? calcDealAmount({ tariffId: purchasedTariff, nutrition, priceType })
                    : null
                  const patch = {
                    purchasedTariff,
                    purchasePrice,
                    selectedTariff: purchasedTariff || lead.selectedTariff,
                  }
                  if (purchasedTariff && !lead.purchasedAt) {
                    patch.purchasedAt = new Date().toISOString().slice(0, 10)
                  }
                  if (purchasedTariff && lead.status !== 'bought') {
                    patch.status = 'bought'
                  }
                  update(patch)
                  if (purchasedTariff) {
                    addHistory(
                      lead.id,
                      'purchase',
                      `Тариф: ${tariffName(purchasedTariff)}, ${formatPrice(purchasePrice)} ₽`
                    )
                  }
                }}
              >
                <option value="">Не выбран</option>
                {Object.values(TARIFFS).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.months} мес.
                  </option>
                ))}
              </select>
            </label>
            <label className="field mb-8">
              <span className="field-label">Тип цены</span>
              <select
                className="field-select"
                value={lead.purchasePriceType || 'stream'}
                onChange={(e) => {
                  const purchasePriceType = e.target.value
                  const tariffId = lead.purchasedTariff || lead.selectedTariff
                  const purchasePrice = tariffId
                    ? calcDealAmount({
                        tariffId,
                        nutrition: lead.nutritionAddon,
                        priceType: purchasePriceType,
                      })
                    : lead.purchasePrice
                  update({ purchasePriceType, purchasePrice })
                }}
              >
                <option value="stream">Первый набор (−25%)</option>
                <option value="regular">Обычная цена</option>
              </select>
            </label>
            <label className="field mb-8">
              <span className="field-label">Питание (+{formatPrice(NUTRITION_ADDON)} ₽, на Трансформации в подарок)</span>
              <select
                className="field-select"
                value={lead.nutritionAddon ? 'yes' : 'no'}
                onChange={(e) => {
                  const nutritionAddon = e.target.value === 'yes'
                  const tariffId = lead.purchasedTariff || lead.selectedTariff
                  const priceType = lead.purchasePriceType || 'stream'
                  const purchasePrice = tariffId
                    ? calcDealAmount({ tariffId, nutrition: nutritionAddon, priceType })
                    : null
                  update({ nutritionAddon, purchasePrice })
                }}
              >
                <option value="no">Без питания</option>
                <option value="yes">С питанием</option>
              </select>
            </label>
            <label className="field mb-8">
              <span className="field-label">Дата оплаты</span>
              <input
                type="date"
                className="field-input"
                value={(lead.purchasedAt || '').slice(0, 10)}
                onChange={(e) => update({ purchasedAt: e.target.value || null })}
              />
            </label>
            <label className="field mb-8">
              <span className="field-label">Сумма, ₽</span>
              <input
                type="number"
                className="field-input"
                value={lead.purchasePrice ?? ''}
                onChange={(e) =>
                  update({
                    purchasePrice: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="Авто из тарифа"
              />
            </label>
            {(lead.purchasedTariff || lead.purchasePrice) && (
              <div className="purchase-summary">
                Итого:{' '}
                <strong>
                  {formatPrice(
                    lead.purchasePrice != null
                      ? Number(lead.purchasePrice)
                      : calcDealAmount({
                          tariffId: lead.purchasedTariff || lead.selectedTariff,
                          nutrition: lead.nutritionAddon,
                          priceType: lead.purchasePriceType || 'stream',
                        })
                  )}{' '}
                  ₽
                </strong>
                {lead.purchasedTariff ? ` · ${tariffName(lead.purchasedTariff)}` : ''}
              </div>
            )}
            {lead.selectedTariff && !lead.purchasedTariff && (
              <p className="muted" style={{ fontSize: '0.8rem', marginTop: 8 }}>
                На консультации выбран: {tariffName(lead.selectedTariff)}
                {lead.nutritionAddon ? ' + питание' : ''}
              </p>
            )}
          </div>

          <TextArea
            label="Заметки тренера"
            value={lead.notes || ''}
            onChange={(v) => update({ notes: v })}
            placeholder="Досбор после созвона..."
          />
        </section>

        <section className="card detail-section card-static">
          <h3>Оценка доменов</h3>
          {algo?.domains ? (
            <>
              <DomainTraffic domains={algo.domains} highlight={algo.focusKeys} showLegend />
              <div className="detail-row mt-16">
                <span className="detail-key">Стратегия</span>
                <span className="detail-val">{algo.strategy}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Ккал</span>
                <span className="detail-val">{algo.kcal}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Белок</span>
                <span className="detail-val">{algo.protein} г</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Срок</span>
                <span className="detail-val">
                  {algo.realWeeks != null ? `${algo.realWeeks} нед.` : '—'}
                </span>
              </div>
            </>
          ) : (
            <p className="muted">Ещё нет расчёта. Пройдите блок 3 или пересчитайте.</p>
          )}
          <button type="button" className="btn-outline mt-16 w-full" onClick={recompute}>
            Пересчитать алгоритм
          </button>
        </section>

        <section className="card detail-section card-static">
          <h3>Рекомендации</h3>
          {lead.recommendations || algo?.recommendations ? (
            Object.entries(lead.recommendations || algo.recommendations).map(([key, text]) => (
              <div key={key} className="rec-section" style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 10 }}>{recTitle(key)}</h4>
                <RecText
                  storageKey={`lead-${lead.id}-${key}`}
                  value={text || ''}
                  onChange={(v) =>
                    update({
                      recommendations: {
                        ...(lead.recommendations || algo.recommendations),
                        [key]: formatRecommendationText(v),
                      },
                    })
                  }
                  rows={8}
                />
              </div>
            ))
          ) : (
            <p className="muted">Рекомендации появятся после блока 3.</p>
          )}
        </section>

        <section className="card detail-section card-static" style={{ gridColumn: '1 / -1' }}>
          <h3>История</h3>
          {(lead.history || []).length === 0 ? (
            <p className="muted">Пусто</p>
          ) : (
            [...(lead.history || [])]
              .reverse()
              .map((h, i) => (
                <div key={i} className="detail-row">
                  <span className="detail-key">{formatTs(h.at)}</span>
                  <span className="detail-val">{h.text}</span>
                </div>
              ))
          )}
        </section>
      </div>
    </div>
  )
}

function recTitle(key) {
  return (
    {
      training: 'Тренировки',
      nutrition: 'Питание',
      activity_recovery: 'Активность и восстановление',
      stress_health: 'Стресс и здоровье',
      summary: 'Итог месяца',
    }[key] || key
  )
}

function formatTs(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
