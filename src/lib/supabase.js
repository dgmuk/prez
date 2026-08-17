/**
 * Supabase client + lead mappers
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

export function isSupabaseConfigured() {
  return Boolean(supabase)
}

export function getSupabaseUrl() {
  return url || null
}

/** Health check: auth service + leads table */
export async function checkConnection() {
  if (!supabase) {
    return { ok: false, reason: 'not_configured', message: 'Нет VITE_SUPABASE_URL / ANON_KEY' }
  }
  try {
    const { error } = await supabase.from('leads').select('id').limit(1)
    if (error) {
      return { ok: false, reason: 'query_error', message: error.message, code: error.code }
    }
    return { ok: true, reason: 'connected', message: 'Supabase подключён', url }
  } catch (e) {
    return { ok: false, reason: 'network', message: e?.message || String(e) }
  }
}

export function toRow(lead) {
  return {
    id: lead.id,
    name: lead.name || '',
    telegram: lead.telegram || '',
    sex: lead.sex || 'male',
    age: lead.age === '' || lead.age == null ? null : Number(lead.age),
    height: lead.height === '' || lead.height == null ? null : Number(lead.height),
    weight: lead.weight === '' || lead.weight == null ? null : Number(lead.weight),
    bmi: lead.bmi == null ? null : Number(lead.bmi),
    status: lead.status || 'new',
    next_contact_at: lead.nextContactAt || null,
    notes: lead.notes || '',
    answers: lead.answers || {},
    domain_scores: lead.domainScores || lead.algorithm?.domains || null,
    algorithm: lead.algorithm || null,
    recommendations: lead.recommendations || lead.algorithm?.recommendations || null,
    // skip huge PDF data URLs in cloud if too large (>500kb text)
    pdf_data_url: lead.pdfDataUrl && String(lead.pdfDataUrl).length < 400_000 ? lead.pdfDataUrl : lead.pdfDataUrl ? '[stored_locally]' : null,
    selected_tariff: lead.selectedTariff || null,
    nutrition_addon: Boolean(lead.nutritionAddon),
    purchased_tariff: lead.purchasedTariff || null,
    purchased_at: lead.purchasedAt || null,
    purchase_price: lead.purchasePrice == null || lead.purchasePrice === '' ? null : Number(lead.purchasePrice),
    purchase_price_type: lead.purchasePriceType || 'stream',
    history: lead.history || [],
    consult_progress: lead.consultProgress || { blockIndex: 0, slideIndex: 0 },
    created_at: lead.createdAt || new Date().toISOString(),
    updated_at: lead.updatedAt || new Date().toISOString(),
  }
}

export function fromRow(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name || '',
    telegram: row.telegram || '',
    sex: row.sex || 'male',
    age: row.age ?? '',
    height: row.height ?? '',
    weight: row.weight ?? '',
    bmi: row.bmi,
    status: row.status || 'new',
    nextContactAt: row.next_contact_at,
    notes: row.notes || '',
    answers: row.answers || {},
    domainScores: row.domain_scores,
    algorithm: row.algorithm,
    recommendations: row.recommendations,
    pdfDataUrl: row.pdf_data_url === '[stored_locally]' ? null : row.pdf_data_url,
    selectedTariff: row.selected_tariff,
    nutritionAddon: row.nutrition_addon,
    purchasedTariff: row.purchased_tariff || null,
    purchasedAt: row.purchased_at || null,
    purchasePrice: row.purchase_price ?? null,
    purchasePriceType: row.purchase_price_type || 'stream',
    history: row.history || [],
    consultProgress: row.consult_progress || { blockIndex: 0, slideIndex: 0 },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function syncLead(lead) {
  if (!supabase || !lead?.id) return { ok: false, reason: 'no_client' }
  const row = toRow(lead)
  const { data, error } = await supabase.from('leads').upsert(row).select().single()
  if (error) {
    console.warn('[supabase] syncLead', error)
    return { ok: false, error }
  }
  return { ok: true, data: fromRow(data) }
}

export async function fetchLeadsFromCloud() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromRow)
}

export async function fetchLeadFromCloud(id) {
  if (!supabase || !id) return null
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return fromRow(data)
}

export async function deleteLeadFromCloud(id) {
  if (!supabase || !id) return { ok: false }
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) {
    console.warn('[supabase] delete', error)
    return { ok: false, error }
  }
  return { ok: true }
}

// Optional hook for storage layer
if (typeof window !== 'undefined') {
  window.__metasystem_sync = (lead) => {
    syncLead(lead).catch((e) => console.warn('[supabase] background sync', e))
  }
}
