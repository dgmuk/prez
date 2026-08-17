import { useState, useCallback } from 'react'
import { PRODUCT_SCREENS } from '../data/productScreens'

/**
 * Service screenshot with phone/desktop frame.
 * Falls back to styled placeholder if file missing.
 * Tap to expand fullscreen.
 */
export default function ProductShot({ screenKey, className = '', style }) {
  const meta = PRODUCT_SCREENS[screenKey]
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const toggle = useCallback(() => setExpanded((p) => !p), [])

  if (!meta) return null

  const isPhone = meta.ratio === 'phone'

  return (
    <>
      {expanded && (
        <div className="shot-fullscreen-overlay" onClick={toggle}>
          <div className="shot-fullscreen-close">&times;</div>
          <figure className={`product-shot ${isPhone ? 'is-phone' : 'is-desktop'}`}>
            <div className="product-shot-frame">
              <div className="product-shot-bezel">
                {isPhone && <div className="product-shot-notch" aria-hidden />}
                <img src={meta.src} alt={meta.caption} className="product-shot-img" />
              </div>
            </div>
            {meta.caption && <figcaption className="product-shot-cap">{meta.caption}</figcaption>}
          </figure>
        </div>
      )}
      <figure
        className={`product-shot ${isPhone ? 'is-phone' : 'is-desktop'} ${className}`}
        style={style}
        onClick={toggle}
      >
        <div className="product-shot-frame">
          <div className="product-shot-bezel">
            {isPhone && <div className="product-shot-notch" aria-hidden />}
            {!failed ? (
              <img
                src={meta.src}
                alt={meta.caption}
                className="product-shot-img"
                loading="lazy"
                onError={() => setFailed(true)}
              />
            ) : (
              <div className="product-shot-placeholder">
                <div className="product-shot-ph-icon">▣</div>
                <div className="product-shot-ph-title">Скрин сервиса</div>
                <div className="product-shot-ph-path">{meta.src.replace('/screenshots/', '')}</div>
                <div className="product-shot-ph-hint">Файл в public/screenshots/</div>
              </div>
            )}
          </div>
        </div>
        {meta.caption && <figcaption className="product-shot-cap">{meta.caption}</figcaption>}
      </figure>
    </>
  )
}

export function ProductShotRow({ keys = [] }) {
  const list = (keys || []).filter((k) => PRODUCT_SCREENS[k])
  if (!list.length) return null
  return (
    <div className={`product-shot-row ${list.length > 1 ? 'multi' : 'single'}`}>
      {list.map((k, i) => (
        <ProductShot key={k} screenKey={k} className="anim-stagger" style={{ '--stagger': i }} />
      ))}
    </div>
  )
}
