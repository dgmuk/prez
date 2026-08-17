import { TARIFFS, NUTRITION_ADDON, formatPrice } from './algorithm'
import { listLeads } from './storage'

export { formatPrice }

export function tariffName(id) {
  return TARIFFS[id]?.name || id || '—'
}

/**
 * Deal amount in RUB
 * priceType: stream (first intake -25%) | regular
 */
export function calcDealAmount({ tariffId, nutrition = false, priceType = 'stream' }) {
  const t = TARIFFS[tariffId]
  if (!t) return 0
  let sum = priceType === 'regular' ? t.priceRegular : t.priceStream
  const needsNutritionPay = nutrition && !t.nutritionGift
  if (needsNutritionPay) sum += NUTRITION_ADDON
  return sum
}

export function describeDeal(lead) {
  if (!lead?.purchasedTariff && lead?.status !== 'bought') return null
  const tariffId = lead.purchasedTariff || lead.selectedTariff
  if (!tariffId) return null
  const amount =
    lead.purchasePrice != null && lead.purchasePrice !== ''
      ? Number(lead.purchasePrice)
      : calcDealAmount({
          tariffId,
          nutrition: lead.nutritionAddon,
          priceType: lead.purchasePriceType || 'stream',
        })
  return {
    tariffId,
    tariff: tariffName(tariffId),
    nutrition: Boolean(lead.nutritionAddon || TARIFFS[tariffId]?.nutritionGift),
    amount,
    purchasedAt: lead.purchasedAt || lead.updatedAt,
    name: lead.name || 'Без имени',
    telegram: lead.telegram || '',
    leadId: lead.id,
  }
}

/** All purchases for stats (status bought or has purchasedTariff) */
export function listPurchases(leads = listLeads()) {
  return leads
    .filter((l) => l.status === 'bought' || l.purchasedTariff)
    .map(describeDeal)
    .filter(Boolean)
    .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))
}

/**
 * Last N months revenue buckets { key: '2026-07', label: 'июл 2026', total, count }
 */
export function monthlyRevenue(purchases, monthsBack = 12) {
  const now = new Date()
  const buckets = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
    buckets.push({ key, label, total: 0, count: 0 })
  }
  const map = Object.fromEntries(buckets.map((b) => [b.key, b]))

  for (const p of purchases) {
    if (!p.purchasedAt) continue
    const d = new Date(p.purchasedAt)
    if (Number.isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map[key]) continue
    map[key].total += p.amount || 0
    map[key].count += 1
  }

  return buckets
}

export function salesSummary(purchases) {
  const totalRevenue = purchases.reduce((s, p) => s + (p.amount || 0), 0)
  const byTariff = {}
  for (const p of purchases) {
    const id = p.tariffId || 'unknown'
    if (!byTariff[id]) byTariff[id] = { id, name: p.tariff, count: 0, revenue: 0 }
    byTariff[id].count += 1
    byTariff[id].revenue += p.amount || 0
  }
  return {
    totalRevenue,
    deals: purchases.length,
    avgCheck: purchases.length ? Math.round(totalRevenue / purchases.length) : 0,
    byTariff: Object.values(byTariff).sort((a, b) => b.revenue - a.revenue),
  }
}
