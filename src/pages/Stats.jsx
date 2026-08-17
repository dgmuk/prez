import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { listLeads, pullFromCloud, cloudEnabled } from '../lib/storage'
import { listPurchases, monthlyRevenue, salesSummary, formatPrice, tariffName } from '../lib/sales'
import { TARIFFS } from '../lib/algorithm'

export default function Stats() {
  const [leads, setLeads] = useState(() => listLeads())

  useEffect(() => {
    if (!cloudEnabled()) return
    pullFromCloud()
      .then((res) => setLeads(res.leads || listLeads()))
      .catch(() => setLeads(listLeads()))
  }, [])

  const purchases = useMemo(() => listPurchases(leads), [leads])
  const months = useMemo(() => monthlyRevenue(purchases, 12), [purchases])
  const summary = useMemo(() => salesSummary(purchases), [purchases])
  const maxMonth = Math.max(1, ...months.map((m) => m.total))

  return (
    <div className="app-shell">
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="brand">
            <Link to="/">
              <Logo />
            </Link>
            <div>
              <div className="brand-name">Статистика продаж</div>
              <div className="brand-sub">Тарифы, сделки, доход по месяцам</div>
            </div>
          </div>
          <div className="detail-actions">
            <Link to="/" className="btn-outline">
              ← К лидам
            </Link>
          </div>
        </header>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{summary.deals}</div>
            <div className="stat-label">Сделок</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatPrice(summary.totalRevenue)} ₽</div>
            <div className="stat-label">Выручка</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatPrice(summary.avgCheck)} ₽</div>
            <div className="stat-label">Средний чек</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summary.byTariff[0]?.name || '—'}</div>
            <div className="stat-label">Топ тариф</div>
          </div>
        </div>

        <section className="card card-static stats-panel">
          <h3 className="stats-panel-title">Доход по месяцам</h3>
          <div className="revenue-chart">
            {months.map((m) => {
              const h = Math.round((m.total / maxMonth) * 100)
              return (
                <div key={m.key} className="revenue-col" title={`${m.label}: ${formatPrice(m.total)} ₽`}>
                  <div className="revenue-bar-wrap">
                    <div className="revenue-bar" style={{ height: `${Math.max(h, m.total > 0 ? 6 : 0)}%` }} />
                  </div>
                  <div className="revenue-val">{m.total > 0 ? formatShort(m.total) : ''}</div>
                  <div className="revenue-label">{m.label}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card card-static stats-panel">
          <h3 className="stats-panel-title">По тарифам</h3>
          <div className="tariff-stats">
            {Object.values(TARIFFS).map((t) => {
              const row = summary.byTariff.find((x) => x.id === t.id) || {
                count: 0,
                revenue: 0,
                name: t.name,
              }
              return (
                <div key={t.id} className="tariff-stat-card">
                  <div className="tariff-stat-name">{t.name}</div>
                  <div className="tariff-stat-count">{row.count} сделок</div>
                  <div className="tariff-stat-sum">{formatPrice(row.revenue)} ₽</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card card-static stats-panel">
          <h3 className="stats-panel-title">Кто купил</h3>
          {purchases.length === 0 ? (
            <p className="muted">Пока нет записей о покупках. Отметь тариф в карточке лида.</p>
          ) : (
            <div className="purchases-table">
              <div className="purchases-head">
                <span>Дата</span>
                <span>Клиент</span>
                <span>Тариф</span>
                <span>Сумма</span>
              </div>
              {purchases.map((p) => (
                <Link key={p.leadId} to={`/lead/${p.leadId}`} className="purchases-row">
                  <span>{formatDay(p.purchasedAt)}</span>
                  <span>
                    {p.name}
                    {p.telegram ? ` · ${p.telegram}` : ''}
                    {p.nutrition ? ' · +питание' : ''}
                  </span>
                  <span>{p.tariff || tariffName(p.tariffId)}</span>
                  <span className="purchases-sum">{formatPrice(p.amount)} ₽</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function formatDay(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatShort(n) {
  if (n >= 1000) return `${Math.round(n / 1000)}к`
  return String(n)
}
