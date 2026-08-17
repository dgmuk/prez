import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { listLeads, createLead, statusBadge, statusLabel, STATUS, pullFromCloud, cloudEnabled } from '../lib/storage'
import { checkConnection, getSupabaseUrl } from '../lib/supabase'
import { tariffName } from '../lib/sales'
import { formatPrice } from '../lib/algorithm'
import { listPurchases, salesSummary } from '../lib/sales'

export default function Dashboard() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [leads, setLeads] = useState(() => listLeads())
  const [cloud, setCloud] = useState({ status: 'idle', message: '' })
  const [syncing, setSyncing] = useState(false)

  const refresh = () => setLeads(listLeads())

  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (!cloudEnabled()) {
        setCloud({ status: 'off', message: 'Локальный режим (нет .env)' })
        return
      }
      setCloud({ status: 'checking', message: 'Проверка Supabase…' })
      const health = await checkConnection()
      if (cancelled) return
      if (!health.ok) {
        setCloud({ status: 'error', message: health.message || 'Нет связи' })
        return
      }
      setCloud({ status: 'ok', message: 'Облако подключено' })
      setSyncing(true)
      try {
        const res = await pullFromCloud()
        if (!cancelled) {
          setLeads(res.leads || listLeads())
          setCloud({ status: 'ok', message: `Облако · ${res.count ?? 0} лидов` })
        }
      } catch (e) {
        if (!cancelled) {
          setCloud({ status: 'error', message: e?.message || 'Ошибка синхронизации' })
          refresh()
        }
      } finally {
        if (!cancelled) setSyncing(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (!q.trim()) return true
      const s = q.toLowerCase()
      return (
        (l.name || '').toLowerCase().includes(s) ||
        (l.telegram || '').toLowerCase().includes(s) ||
        (l.notes || '').toLowerCase().includes(s)
      )
    })
  }, [leads, q, statusFilter])

  const stats = useMemo(() => {
    const total = leads.length
    const bought = leads.filter((l) => l.status === 'bought' || l.purchasedTariff).length
    const thinking = leads.filter((l) => l.status === 'thinking' || l.status === 'callback').length
    const consulted = leads.filter((l) => l.status === 'consulted' || l.algorithm).length
    const sales = salesSummary(listPurchases(leads))
    return { total, bought, thinking, consulted, revenue: sales.totalRevenue }
  }, [leads])

  const startNew = () => {
    const lead = createLead()
    refresh()
    navigate(`/consult/${lead.id}`)
  }

  const resync = async () => {
    if (!cloudEnabled()) return
    setSyncing(true)
    try {
      const health = await checkConnection()
      if (!health.ok) {
        setCloud({ status: 'error', message: health.message })
        return
      }
      const res = await pullFromCloud()
      setLeads(res.leads || listLeads())
      setCloud({ status: 'ok', message: `Синхронизировано · ${res.count ?? 0}` })
    } catch (e) {
      setCloud({ status: 'error', message: e?.message || 'Ошибка' })
    } finally {
      setSyncing(false)
    }
  }

  const cloudDot =
    cloud.status === 'ok' ? 'green' : cloud.status === 'error' ? 'red' : cloud.status === 'checking' ? 'yellow' : 'yellow'

  const host = (getSupabaseUrl() || '').replace(/^https?:\/\//, '') || 'ylytplazmkmnqisqmlhk.supabase.co'

  return (
    <div className="app-shell">
      {/* Cloud host. always at the very top */}
      <div className="cloud-topbar">
        <div className="cloud-topbar-inner">
          <div className="cloud-topbar-left">
            <span className={`domain-dot ${cloudDot}`} />
            <span className="cloud-host">{host}</span>
            <span className="cloud-status-text">
              {syncing ? '· синхронизация…' : cloud.message ? `· ${cloud.message}` : ''}
            </span>
          </div>
          {cloudEnabled() && (
            <button type="button" className="btn-ghost btn-sm" onClick={resync} disabled={syncing}>
              Обновить
            </button>
          )}
        </div>
      </div>

      <div className="dashboard">
        <header className="dashboard-header">
          <div className="brand">
            <Logo />
            <div>
              <div className="brand-name">MetaSystem</div>
              <div className="brand-sub">Консультация · мини-CRM</div>
            </div>
          </div>
          <div className="detail-actions">
            <Link to="/stats" className="btn-outline">
              Статистика
            </Link>
            <button type="button" className="btn-primary" onClick={startNew}>
              + Новая консультация
            </button>
          </div>
        </header>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Лидов</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.consulted}</div>
            <div className="stat-label">С оценкой</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.bought}</div>
            <div className="stat-label">Купили</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatPrice(stats.revenue)} ₽</div>
            <div className="stat-label">Выручка</div>
          </div>
        </div>

        <div className="leads-toolbar">
          <input
            className="field-input search-input"
            placeholder="Поиск: имя, Telegram..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="field-select"
            style={{ width: 200 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Все статусы</option>
            {Object.values(STATUS).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state card card-static">
            <div className="display">Пока нет лидов</div>
            <p>Начните консультацию. Карточка сохранится локально и в Supabase.</p>
            <button type="button" className="btn-primary mt-16" onClick={startNew}>
              Начать
            </button>
          </div>
        ) : (
          <div className="leads-list">
            {filtered.map((l) => (
              <Link key={l.id} to={`/lead/${l.id}`} className="card lead-row">
                <div className="lead-avatar">{initials(l.name)}</div>
                <div className="lead-info">
                  <div className="lead-name">{l.name || 'Без имени'}</div>
                  <div className="lead-meta">
                    {l.telegram ? `${l.telegram} · ` : ''}
                    {(l.purchasedTariff || l.selectedTariff)
                      ? `${tariffName(l.purchasedTariff || l.selectedTariff)}${l.nutritionAddon ? ' +пит.' : ''} · `
                      : ''}
                    {formatDate(l.updatedAt)}
                  </div>
                </div>
                <span className={`badge ${statusBadge(l.status)}`}>{statusLabel(l.status)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function initials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
