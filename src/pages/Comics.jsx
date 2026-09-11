import { useState, useRef, useCallback, useMemo } from 'react'
import './Comics.css'

const fixModules = import.meta.glob('../comics/fix/*.{png,jpg,jpeg,webp}', { eager: true })

const IMAGES = Object.entries(fixModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => mod.default)

const PAGES = [
  // Page 1 — 7 panels (3 rows)
  [
    [{ w: 2 }, { w: 1 }, { w: 1 }],
    [{ w: 1 }, { w: 1 }],
    [{ w: 1 }, { w: 1 }],
  ],
  // Page 2 — 8 panels
  [
    [{ w: 1 }, { w: 1 }],
    [{ w: 1 }, { w: 1 }, { w: 1 }, { w: 1 }],
    [{ w: 2 }, { w: 1 }],
  ],
  // Page 3 — 6 panels
  [
    [{ w: 1 }, { w: 1 }, { w: 1 }],
    [{ w: 2 }, { w: 1 }],
    [{ w: 1 }],
  ],
  // Page 4 — 8 panels
  [
    [{ w: 1 }, { w: 1 }],
    [{ w: 2 }, { w: 1 }, { w: 1 }],
    [{ w: 1 }, { w: 1 }, { w: 1 }],
  ],
]

function Comics() {
  const [currentSpread, setCurrentSpread] = useState(0)
  const [expandedPanel, setExpandedPanel] = useState(null)
  const trackRef = useRef(null)
  const dragRef = useRef({ startX: 0, dragging: false })

  const spreads = useMemo(() => {
    const result = []
    let imgIdx = 0
    for (let pi = 0; pi < PAGES.length; pi += 2) {
      const buildPage = (pageDef) => {
        if (!pageDef) return null
        return pageDef.map(row =>
          row.map(cell => ({
            ...cell,
            src: IMAGES[imgIdx] || null,
            globalIdx: imgIdx++,
          }))
        )
      }
      result.push({
        left: buildPage(PAGES[pi]),
        right: buildPage(PAGES[pi + 1]),
      })
    }
    return result
  }, [])

  const totalPages = PAGES.length

  const goTo = useCallback((idx) => {
    setCurrentSpread(Math.max(0, Math.min(idx, spreads.length - 1)))
  }, [spreads.length])

  const onPointerDown = useCallback((e) => {
    if (e.target.closest('.comics-frame')) return
    dragRef.current = {
      startX: e.clientX,
      startTime: Date.now(),
      dragging: true,
    }
    if (trackRef.current) trackRef.current.classList.add('dragging')
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    if (trackRef.current) {
      const base = -currentSpread * window.innerWidth
      trackRef.current.style.transform = `translateX(${base + dx}px)`
    }
  }, [currentSpread])

  const onPointerUp = useCallback((e) => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (trackRef.current) trackRef.current.classList.remove('dragging')

    const dx = e.clientX - dragRef.current.startX
    const dt = Date.now() - dragRef.current.startTime
    const vx = dx / Math.max(dt, 1)

    if (dx < -window.innerWidth * 0.15 || vx < -0.4) {
      goTo(currentSpread + 1)
    } else if (dx > window.innerWidth * 0.15 || vx > 0.4) {
      goTo(currentSpread - 1)
    }

    if (trackRef.current) trackRef.current.style.transform = ''
  }, [currentSpread, goTo])

  const togglePanel = useCallback((globalIdx) => {
    setExpandedPanel(prev => prev === globalIdx ? null : globalIdx)
  }, [])

  return (
    <div className="comics-reader">
      <div className="comics-reader-title">Marionettentheater — Comics</div>
      <div className="comics-page-counter">
        {currentSpread * 2 + 1}–{Math.min(currentSpread * 2 + 2, totalPages)} / {totalPages}
      </div>

      <div
        className="comics-track"
        ref={trackRef}
        style={{ transform: `translateX(${-currentSpread * 100}vw)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {spreads.map((spread, si) => (
          <div key={si} className="comics-spread">
            <PageHalf side="left" rows={spread.left} pageNum={si * 2 + 1}
              expandedPanel={expandedPanel} onToggle={togglePanel} />
            {spread.right ? (
              <PageHalf side="right" rows={spread.right} pageNum={si * 2 + 2}
                expandedPanel={expandedPanel} onToggle={togglePanel} />
            ) : (
              <div className="comics-page-half right">
                <div className="comics-empty-page">fin</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="comics-nav">
        {spreads.map((_, i) => (
          <button
            key={i}
            className={`comics-dot ${i === currentSpread ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  )
}

function PageHalf({ side, rows, pageNum, expandedPanel, onToggle }) {
  return (
    <div className={`comics-page-half ${side}`}>
      <div className="comics-page-rows">
        {rows.map((row, ri) => {
          const totalW = row.reduce((s, c) => s + c.w, 0)
          const hasExpanded = row.some(c => c.globalIdx === expandedPanel)
          return (
            <div key={ri} className={`comics-row ${hasExpanded ? 'has-expanded' : ''}`}>
              {row.map((panel) => {
                const isExpanded = panel.globalIdx === expandedPanel
                const basePct = (panel.w / totalW) * 100
                const flexBasis = isExpanded ? '85%' : `${basePct}%`
                return (
                  <div
                    key={panel.globalIdx}
                    className={`comics-frame ${isExpanded ? 'expanded' : ''}`}
                    style={{ flexBasis, minWidth: isExpanded ? '85%' : undefined }}
                    onClick={() => onToggle(panel.globalIdx)}
                  >
                    <div className="comics-frame-num">
                      {String(panel.globalIdx + 1).padStart(3, '0')}
                    </div>
                    {panel.src && <img src={panel.src} alt="" draggable={false} />}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="comics-page-num">{pageNum}</div>
    </div>
  )
}

export default Comics
