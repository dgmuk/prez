/**
 * PDF export via HTML + html2canvas (Cyrillic + design system).
 * Multi-page: pack whole blocks into A4 pages so text is never sliced mid-line.
 */
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { buildSmartGoal } from './algorithm'

const DOMAIN_NAMES = {
  activity: 'Активность',
  training: 'Тренировки',
  nutrition: 'Питание',
  recovery: 'Восстановление',
  stress: 'Стресс',
}

const REC_SECTIONS = [
  { key: 'training', title: 'Тренировки' },
  { key: 'nutrition', title: 'Питание' },
  { key: 'activity_recovery', title: 'Активность и восстановление' },
  { key: 'stress_health', title: 'Стресс и здоровье' },
  { key: 'summary', title: 'Итог месяца' },
]

/** CSS px width of PDF layout (≈ A4 @ 96dpi) */
const PAGE_W_PX = 794
/** Usable content height per page (A4 ratio minus safe padding) */
const PAGE_H_PX = Math.floor(PAGE_W_PX * (297 / 210)) // ~1123
const PAGE_INNER_H = PAGE_H_PX - 24 // small safety margin

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function levelColor(color) {
  if (color === 'red') return '#ff5c5c'
  if (color === 'green') return '#c8f542'
  return '#f5c542'
}

function buildBlocks(lead, algorithm) {
  const name = lead.name || algorithm?.name || 'Клиент'
  const goal = algorithm?.goal || lead.answers?.mainGoal || '—'
  const bmi = algorithm?.bmi ?? lead.bmi
  const bmiLabel = algorithm?.bmiLabel || ''
  const strategy = algorithm?.strategy || '—'
  const recs = lead.recommendations || algorithm?.recommendations || {}
  const domains = algorithm?.domains || {}
  const date = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const metrics = [
    { l: 'Ккал / день', v: algorithm?.kcal || '—' },
    { l: 'Белок', v: algorithm?.protein != null ? `${algorithm.protein} г` : '—' },
    { l: 'Шаги', v: algorithm?.steps || '—' },
    { l: 'Сон', v: algorithm?.sleep || '—' },
  ]

  const domainRows = Object.entries(DOMAIN_NAMES)
    .map(([key, label]) => {
      const d = domains[key] || {}
      const score = d.score != null ? `${d.score} / 5` : '—'
      const lvl = d.label || ''
      const c = levelColor(d.color)
      return `
        <div class="dom">
          <span class="dot" style="background:${c}"></span>
          <span class="dom-name">${esc(label)}</span>
          <span class="dom-score" style="color:${c}">${esc(score)}</span>
          <span class="dom-lvl">${esc(lvl)}</span>
        </div>`
    })
    .join('')

  const metricCards = metrics
    .map(
      (m) => `
      <div class="metric">
        <div class="metric-v">${esc(m.v)}</div>
        <div class="metric-l">${esc(m.l)}</div>
      </div>`
    )
    .join('')

  const blocks = []

  blocks.push({
    id: 'header',
    html: `
      <div class="pdf-block" data-block="header">
        <header class="head">
          <div class="logo">ДМ</div>
          <div>
            <div class="brand">MetaSystem</div>
            <div class="sub">Персональный план на первый месяц · ${esc(date)}</div>
          </div>
        </header>
        <h1 class="name">${esc(name)}</h1>
        <p class="meta">Цель: ${esc(goal)} · ИМТ: ${esc(bmi ?? '—')}${bmiLabel ? ` (${esc(bmiLabel)})` : ''}</p>
        <p class="meta">Стратегия: ${esc(strategy)}</p>
        <div class="metrics">${metricCards}</div>
      </div>`,
  })

  // SMART goal
  const smart = buildSmartGoal(lead.answers || {}, algorithm)
  const smartParts = [
    { letter: 'S', label: 'Конкретная', text: smart.specific },
    { letter: 'M', label: 'Измеримая', text: smart.measurable },
    { letter: 'A', label: 'Достижимая', text: smart.achievable },
    { letter: 'R', label: 'Значимая', text: smart.relevant },
    { letter: 'T', label: 'Ограниченная', text: smart.timeBound },
  ]
  const smartHtml = smartParts
    .map(
      (p) => `
      <div class="smart-row">
        <span class="smart-letter">${p.letter}</span>
        <span class="smart-label">${esc(p.label)}</span>
        <span class="smart-text">${esc(p.text)}</span>
      </div>`
    )
    .join('')

  blocks.push({
    id: 'smart-goal',
    html: `
      <div class="pdf-block" data-block="smart-goal">
        <h2 class="h2">SMART-цель</h2>
        <p class="smart-summary">${esc(smart.short)}</p>
        <div class="smart-block">${smartHtml}</div>
      </div>`,
  })

  blocks.push({
    id: 'domains',
    html: `
      <div class="pdf-block" data-block="domains">
        <h2 class="h2">Анализ ключевых сфер <span class="h2-hint">(Шкала 1–5)</span></h2>
        <div class="doms">${domainRows}</div>
      </div>`,
  })

  blocks.push({
    id: 'plan-title',
    html: `
      <div class="pdf-block" data-block="plan-title">
        <h2 class="h2">План на первый месяц</h2>
      </div>`,
  })

  REC_SECTIONS.forEach((sec) => {
    const text = recs[sec.key]
    if (!text) return
    // Prefer blank-line paragraphs; else pack by sentence length
    const paras = String(text)
      .replace(/\r\n/g, '\n')
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const pieces = paras.length > 1 ? paras : chunkTextForPages(String(text), sec.title)

    // One section: title + continuous body with paragraph spacing
    const bodyHtml = pieces.map((chunk) => `<p class="sec-para">${esc(chunk)}</p>`).join('')
    if (pieces.length <= 5) {
      blocks.push({
        id: sec.key,
        html: `
          <div class="pdf-block sec" data-block="${sec.key}">
            <div class="sec-title">${esc(sec.title)}</div>
            <div class="sec-body">${bodyHtml}</div>
          </div>`,
      })
    } else {
      let i = 0
      while (i < pieces.length) {
        const slice = pieces.slice(i, i + 4)
        blocks.push({
          id: `${sec.key}-${i}`,
          html: `
            <div class="pdf-block sec" data-block="${sec.key}-${i}">
              <div class="sec-title">${esc(sec.title)}${i > 0 ? ' · продолжение' : ''}</div>
              <div class="sec-body">${slice.map((chunk) => `<p class="sec-para">${esc(chunk)}</p>`).join('')}</div>
            </div>`,
        })
        i += 4
      }
    }
  })

  blocks.push({
    id: 'footer',
    html: `
      <div class="pdf-block" data-block="footer">
        <footer class="foot">
          MetaSystem · рекомендации для обсуждения с тренером · не медицинское назначение
        </footer>
      </div>`,
  })

  return blocks
}

/** Prefer keeping sections whole; if very long, split by sentences ~ every 450 chars */
function chunkTextForPages(text, _title) {
  const t = text.trim()
  if (t.length <= 520) return [t]
  const parts = []
  const sentences = t.split(/(?<=[.!?…])\s+/)
  let buf = ''
  for (const s of sentences) {
    if ((buf + ' ' + s).trim().length > 480 && buf) {
      parts.push(buf.trim())
      buf = s
    } else {
      buf = buf ? `${buf} ${s}` : s
    }
  }
  if (buf.trim()) parts.push(buf.trim())
  return parts.length ? parts : [t]
}

const PDF_CSS = `
.ms-pdf-page {
  width: ${PAGE_W_PX}px;
  min-height: ${PAGE_H_PX}px;
  box-sizing: border-box;
  padding: 40px 48px 36px;
  background: #0d0d0d;
  color: #f0f0ee;
  font-family: 'Golos Text', 'Segoe UI', system-ui, sans-serif;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
.ms-pdf-page * { box-sizing: border-box; }
.pdf-block { margin-bottom: 4px; }
.head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #c8f542;
  color: #0d0d0d;
  font-family: 'Unbounded', 'Golos Text', sans-serif;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.brand {
  font-family: 'Unbounded', 'Golos Text', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: #c8f542;
}
.sub {
  font-size: 12px;
  color: #8a8a82;
  margin-top: 2px;
}
.name {
  font-family: 'Unbounded', 'Golos Text', sans-serif;
  font-weight: 700;
  font-size: 26px;
  margin: 0 0 10px;
  letter-spacing: -0.02em;
  color: #f0f0ee;
}
.meta {
  margin: 0 0 6px;
  font-size: 14px;
  color: #8a8a82;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 18px 0 8px;
}
.metric {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 14px 12px;
  text-align: center;
}
.metric-v {
  font-family: 'Unbounded', 'Golos Text', sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #c8f542;
  margin-bottom: 4px;
  word-break: break-word;
}
.metric-l {
  font-size: 11px;
  color: #8a8a82;
}
.h2 {
  font-family: 'Unbounded', 'Golos Text', sans-serif;
  font-weight: 600;
  font-size: 14px;
  margin: 12px 0 12px;
  color: #f0f0ee;
}
.h2-hint {
  font-family: 'Golos Text', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #8a8a82;
}
.doms {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.dom {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 12px 14px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dom-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}
.dom-score {
  font-family: 'Unbounded', 'Golos Text', sans-serif;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}
.dom-lvl {
  font-size: 11px;
  color: #8a8a82;
  min-width: 72px;
  text-align: right;
}
.sec {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.sec-title {
  font-family: 'Unbounded', 'Golos Text', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #c8f542;
  margin-bottom: 8px;
}
.sec-body {
  font-size: 13px;
  color: #f0f0ee;
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.sec-para {
  margin: 0 0 8px;
  padding: 0;
  background: transparent;
  border: none;
  line-height: 1.45;
  font-size: 12px;
  color: #f0f0ee;
}
.sec-para:last-child { margin-bottom: 0; }
.foot {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.07);
  font-size: 11px;
  color: #444440;
}
.page-num {
  margin-top: 20px;
  text-align: right;
  font-size: 10px;
  color: #444440;
  font-family: 'Unbounded', 'Golos Text', sans-serif;
}
.smart-summary {
  margin: 0 0 12px;
  padding: 10px 14px;
  background: rgba(200,245,66,0.06);
  border-left: 3px solid #c8f542;
  border-radius: 0 8px 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: #f0f0ee;
  line-height: 1.5;
}
.smart-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.smart-row {
  display: grid;
  grid-template-columns: 24px 72px 1fr;
  gap: 8px;
  align-items: baseline;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.smart-row:last-child { border-bottom: none; }
.smart-letter {
  font-size: 16px;
  font-weight: 800;
  color: #c8f542;
  text-align: center;
}
.smart-label {
  font-size: 11px;
  font-weight: 600;
  color: #aaa;
}
.smart-text {
  font-size: 12px;
  color: #f0f0ee;
  line-height: 1.4;
}
`

function waitFonts() {
  if (document.fonts?.ready) return document.fonts.ready.catch(() => {})
  return Promise.resolve()
}

function measureBlocks(host, blocks) {
  const measureRoot = document.createElement('div')
  measureRoot.className = 'ms-pdf-page'
  measureRoot.style.cssText = `width:${PAGE_W_PX}px;position:absolute;left:0;top:0;visibility:hidden;`
  measureRoot.innerHTML = blocks.map((b) => b.html).join('')
  host.appendChild(measureRoot)

  const heights = [...measureRoot.querySelectorAll('.pdf-block')].map((el) => {
    const style = window.getComputedStyle(el)
    const mb = parseFloat(style.marginBottom) || 0
    return el.offsetHeight + mb
  })
  measureRoot.remove()
  return heights
}

/** Greedy pack whole blocks into pages */
function packPages(blocks, heights) {
  const pages = []
  let current = []
  let used = 0
  // content area inside padding
  const maxH = PAGE_INNER_H - 80 // top+bottom padding of .ms-pdf-page

  blocks.forEach((block, i) => {
    const h = heights[i] || 80
    if (current.length && used + h > maxH) {
      pages.push(current)
      current = []
      used = 0
    }
    // if single block taller than page, still put alone (chunkText should prevent this)
    current.push(block)
    used += h
  })
  if (current.length) pages.push(current)
  return pages
}

async function renderPageToCanvas(host, pageBlocks, pageIndex, pageCount) {
  const pageEl = document.createElement('div')
  pageEl.className = 'ms-pdf-page'
  pageEl.innerHTML =
    pageBlocks.map((b) => b.html).join('') +
    `<div class="page-num">${pageIndex + 1} / ${pageCount}</div>`
  host.appendChild(pageEl)

  // force layout
  void pageEl.offsetHeight

  const canvas = await html2canvas(pageEl, {
    backgroundColor: '#0d0d0d',
    scale: 2,
    useCORS: true,
    logging: false,
    width: PAGE_W_PX,
    windowWidth: PAGE_W_PX,
    height: Math.max(pageEl.scrollHeight, PAGE_H_PX),
    windowHeight: Math.max(pageEl.scrollHeight, PAGE_H_PX),
  })

  pageEl.remove()
  return canvas
}

/**
 * @returns {Promise<{ dataUrl: string, blob: Blob, doc: import('jspdf').jsPDF }>}
 */
export async function generateRecommendationsPdf(lead, algorithm) {
  await waitFonts()

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:794px;pointer-events:none;z-index:-1;opacity:1;'
  const style = document.createElement('style')
  style.textContent = PDF_CSS
  host.appendChild(style)
  document.body.appendChild(host)

  try {
    const blocks = buildBlocks(lead, algorithm)
    const heights = measureBlocks(host, blocks)
    const pages = packPages(blocks, heights)
    const pageCount = Math.max(pages.length, 1)

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    for (let i = 0; i < pageCount; i++) {
      const canvas = await renderPageToCanvas(host, pages[i] || [], i, pageCount)
      const imgData = canvas.toDataURL('image/jpeg', 0.93)

      if (i > 0) doc.addPage()

      // Full-bleed dark page, then image fit to width (never crop mid-text. whole page canvas)
      doc.setFillColor(13, 13, 13)
      doc.rect(0, 0, pageW, pageH, 'F')

      const imgW = pageW
      const imgH = (canvas.height * pageW) / canvas.width

      if (imgH <= pageH) {
        doc.addImage(imgData, 'JPEG', 0, 0, imgW, imgH, undefined, 'FAST')
      } else {
        // rare: block pack failed height. scale down slightly to fit
        const scale = pageH / imgH
        doc.addImage(imgData, 'JPEG', 0, 0, imgW * scale, pageH, undefined, 'FAST')
      }
    }

    const dataUrl = doc.output('datauristring')
    const blob = doc.output('blob')
    return { dataUrl, blob, doc }
  } finally {
    host.remove()
  }
}

export async function downloadPdf(lead, algorithm, existing) {
  const { doc } = existing || (await generateRecommendationsPdf(lead, algorithm))
  const safeName = (lead.name || 'client').replace(/[^\wа-яА-ЯёЁ-]+/gi, '_')
  doc.save(`MetaSystem_${safeName}_план.pdf`)
  return { doc }
}
