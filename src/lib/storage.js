/**
 * Lead storage: localStorage cache + Supabase source of truth
 */

import {
  isSupabaseConfigured,
  syncLead,
  fetchLeadsFromCloud,
  fetchLeadFromCloud,
  deleteLeadFromCloud,
} from './supabase'

const STORAGE_KEY = 'metasystem_leads_v1'

const STATUS = {
  new: { key: 'new', label: 'Новый', badge: 'badge-new' },
  consulted: { key: 'consulted', label: 'Прошёл консультацию', badge: 'badge-done' },
  bought: { key: 'bought', label: 'Купил', badge: 'badge-bought' },
  refused: { key: 'refused', label: 'Отказал', badge: 'badge-refuse' },
  callback: { key: 'callback', label: 'Перезвонить', badge: 'badge-callback' },
  thinking: { key: 'thinking', label: 'Думает', badge: 'badge-think' },
}

export { STATUS }

function uid() {
  return crypto.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
}

export function emptyLead(partial = {}) {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: '',
    telegram: '',
    sex: 'male',
    age: '',
    height: '',
    weight: '',
    bmi: null,
    status: 'new',
    nextContactAt: null,
    notes: '',
    answers: {},
    domainScores: null,
    algorithm: null,
    recommendations: null,
    pdfDataUrl: null,
    selectedTariff: null,
    nutritionAddon: false,
    /** Purchase (CRM) */
    purchasedTariff: null,
    purchasedAt: null,
    purchasePrice: null,
    purchasePriceType: 'stream', // stream | regular
    history: [{ at: now, event: 'created', text: 'Лид создан' }],
    createdAt: now,
    updatedAt: now,
    consultProgress: { blockIndex: 0, slideIndex: 0 },
    ...partial,
  }
}

export function listLeads() {
  return readAll().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function getLead(id) {
  return readAll().find((l) => l.id === id) || null
}

function upsertLocal(lead) {
  const leads = readAll()
  const idx = leads.findIndex((l) => l.id === lead.id)
  if (idx >= 0) leads[idx] = lead
  else leads.unshift(lead)
  writeAll(leads)
  return lead
}

/**
 * Save to local cache and push to Supabase (awaitable)
 */
export function saveLead(lead) {
  const next = { ...lead, updatedAt: new Date().toISOString() }
  upsertLocal(next)

  if (isSupabaseConfigured()) {
    // fire-and-forget; callers that need await use saveLeadAsync
    syncLead(next).catch((e) => console.warn('[storage] cloud sync failed', e))
  }
  return next
}

export async function saveLeadAsync(lead) {
  const next = { ...lead, updatedAt: new Date().toISOString() }
  upsertLocal(next)
  if (isSupabaseConfigured()) {
    const res = await syncLead(next)
    if (!res.ok) throw res.error || new Error('Supabase sync failed')
  }
  return next
}

export function createLead(partial = {}) {
  const lead = emptyLead(partial)
  return saveLead(lead)
}

export async function createLeadAsync(partial = {}) {
  const lead = emptyLead(partial)
  return saveLeadAsync(lead)
}

export function updateLead(id, patch) {
  const lead = getLead(id)
  if (!lead) return null
  return saveLead({ ...lead, ...patch })
}

export function deleteLead(id) {
  writeAll(readAll().filter((l) => l.id !== id))
  if (isSupabaseConfigured()) {
    deleteLeadFromCloud(id).catch((e) => console.warn('[storage] cloud delete failed', e))
  }
}

export async function deleteLeadAsync(id) {
  writeAll(readAll().filter((l) => l.id !== id))
  if (isSupabaseConfigured()) {
    const res = await deleteLeadFromCloud(id)
    if (!res.ok) throw res.error || new Error('Cloud delete failed')
  }
}

/**
 * Pull cloud → merge with local (newer updatedAt wins) → write cache
 */
export async function pullFromCloud() {
  if (!isSupabaseConfigured()) {
    return { ok: false, leads: listLeads(), reason: 'not_configured' }
  }
  const remote = await fetchLeadsFromCloud()
  const local = readAll()
  const map = new Map()

  for (const l of local) map.set(l.id, l)
  for (const r of remote) {
    const cur = map.get(r.id)
    if (!cur) {
      map.set(r.id, r)
      continue
    }
    const localTs = new Date(cur.updatedAt || 0).getTime()
    const remoteTs = new Date(r.updatedAt || 0).getTime()
    // prefer remote if equal or newer; keep local PDF if cloud stripped it
    if (remoteTs >= localTs) {
      map.set(r.id, {
        ...r,
        pdfDataUrl: r.pdfDataUrl || cur.pdfDataUrl || null,
      })
    } else {
      map.set(r.id, {
        ...cur,
        // still keep cloud fields if local missing
        pdfDataUrl: cur.pdfDataUrl || r.pdfDataUrl || null,
      })
    }
  }

  // Push local-only / newer-local to cloud (best effort)
  const merged = [...map.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  writeAll(merged)

  const remoteIds = new Set(remote.map((r) => r.id))
  for (const l of local) {
    const remoteOne = remote.find((r) => r.id === l.id)
    const localTs = new Date(l.updatedAt || 0).getTime()
    const remoteTs = remoteOne ? new Date(remoteOne.updatedAt || 0).getTime() : 0
    if (!remoteIds.has(l.id) || localTs > remoteTs) {
      syncLead(l).catch(() => {})
    }
  }

  return { ok: true, leads: merged, count: merged.length }
}

/**
 * Load one lead: local first, then cloud if missing
 */
export async function getLeadAsync(id) {
  const local = getLead(id)
  if (local) return local
  if (!isSupabaseConfigured()) return null
  try {
    const remote = await fetchLeadFromCloud(id)
    if (remote) upsertLocal(remote)
    return remote
  } catch (e) {
    console.warn('[storage] getLeadAsync', e)
    return null
  }
}

export function addHistory(id, event, text) {
  const lead = getLead(id)
  if (!lead) return null
  const history = [...(lead.history || []), { at: new Date().toISOString(), event, text }]
  return saveLead({ ...lead, history })
}

export function patchAnswers(id, answersPatch, extras = {}) {
  const lead = getLead(id)
  if (!lead) return null
  const answers = { ...lead.answers, ...answersPatch }
  const sync = {}
  if (answers.name != null) sync.name = answers.name
  if (answers.telegram != null) sync.telegram = answers.telegram
  if (answers.sex != null) sync.sex = answers.sex
  if (answers.age != null) sync.age = answers.age
  if (answers.height != null) sync.height = answers.height
  if (answers.weight != null) sync.weight = answers.weight
  if (answers.bmi != null) sync.bmi = answers.bmi

  return saveLead({
    ...lead,
    ...sync,
    ...extras,
    answers,
  })
}

export function statusLabel(key) {
  return STATUS[key]?.label || key
}

export function statusBadge(key) {
  return STATUS[key]?.badge || 'badge-default'
}

export function cloudEnabled() {
  return isSupabaseConfigured()
}
