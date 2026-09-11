import { useState, useRef, useCallback, useMemo } from 'react'
import './Comics.css'

const fixModules = import.meta.glob('../comics/fix/*.{png,jpg,jpeg,webp}', { eager: true })

const IMAGES = Object.entries(fixModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => mod.default)

const PAGES = [
  [
    { col: 6, row: 2 }, { col: 3, row: 1 }, { col: 3, row: 1 },
    { col: 3, row: 1 }, { col: 3, row: 1 },
    { col: 6, row: 1 }, { col: 6, row: 1 },
  ],
  [
    { col: 6, row: 1 }, { col: 6, row: 1 },
    { col: 3, row: 1 }, { col: 3, row: 1 }, { col: 3, row: 1 }, { col: 3, row: 1 },
    { col: 8, row: 1 }, { col: 4, row: 1 },
  ],
  [
    { col: 4, row: 1 }, { col: 4, row: 1 }, { col: 4, row: 1 },
    { col: 8, row: 2 }, { col: 4, row: 1 }, { col: 4, row: 1 },
  ],
  [
    { col: 6, row: 1 }, { col: 6, row: 1 },
    { col: 6, row: 1 }, { col: 3, row: 1 }, { col: 3, row: 1 },
    { col: 4, row: 1 }, { col: 4, row: 1 }, { col: 4, row: 1 },
  ],
]

function Comics() {
  const [currentSpread, setCurrentSpread] = useState(0)
  const [expanded, setExpanded] = useState(new Set())
  const trackRef = useRef(null)
  const dragRef = useRef({ startX: 0, dragging: false, didDrag: false })

  const spreads = useMemo(() => {
    const result = []
    let imgIdx = 0
    for (let i = 0; i < PAGES.length; i += 2) {
      const leftPage = PAGES[i].map(def => ({
        ...def,
        src: IMAGES[imgIdx] || null,
        globalIdx: imgIdx++,
      }))
      const rightDefs = PAGES[i + 1]
      const rightPage = rightDefs
        ? rightDefs.map(def => ({
            ...def,
            src: IMAGES[imgIdx] || null,
            globalIdx: imgIdx++,
          }))
        : null
      result.push({ left: leftPage, right: rightPage })
    }
    return result
  }, [])

  const totalPages = PAGES.length

  const goTo = useCallback((idx) => {
    setCurrentSpread(Math.max(0, Math.min(idx, spreads.length - 1)))
  }, [spreads.length])

  const onPointerDown = useCallback((e) => {
    dragRef.current = {
      startX: e.clientX,
      startTime: Date.now(),
      dragging: true,
      didDrag: false,
    }
    if (trackRef.current) trackRef.current.classList.add('dragging')
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    if (Math.abs(dx) > 8) dragRef.current.didDrag = true
    if (dragRef.current.didDrag && trackRef.current) {
      const base = -currentSpread * window.innerWidth
      trackRef.current.style.transform = `translateX(${base + dx}px)`
    }
  }, [currentSpread])

  const onPointerUp = useCallback((e) => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (trackRef.current) trackRef.current.classList.remove('dragging')

    if (dragRef.current.didDrag) {
      const dx = e.clientX - dragRef.current.startX
      const dt = Date.now() - dragRef.current.startTime
      const vx = dx / Math.max(dt, 1)

      if (dx < -window.innerWidth * 0.15 || vx < -0.4) {
        goTo(currentSpread + 1)
      } else if (dx > window.innerWidth * 0.15 || vx > 0.4) {
        goTo(currentSpread - 1)
      }
      if (trackRef.current) trackRef.current.style.transform = ''
    } else {
      const frame = e.target.closest('.comics-frame')
      if (frame) {
        const idx = parseInt(frame.dataset.idx, 10)
        if (!isNaN(idx)) {
          setExpanded(prev => {
            const next = new Set(prev)
            next.add(idx)
            return next
          })
        }
      }
    }
  }, [currentSpread, goTo])

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
            <PageHalf side="left" panels={spread.left} pageNum={si * 2 + 1}
              expanded={expanded} />
            {spread.right ? (
              <PageHalf side="right" panels={spread.right} pageNum={si * 2 + 2}
                expanded={expanded} />
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

function PageHalf({ side, panels, pageNum, expanded }) {
  return (
    <div className={`comics-page-half ${side}`}>
      <div className="comics-page-grid">
        {panels.map((panel) => {
          const isExpanded = expanded.has(panel.globalIdx)
          const rowSpan = isExpanded ? panel.row + 1 : panel.row
          return (
            <div
              key={panel.globalIdx}
              className={`comics-frame ${isExpanded ? 'expanded' : ''}`}
              data-idx={panel.globalIdx}
              style={{
                gridColumn: `span ${panel.col}`,
                gridRow: `span ${rowSpan}`,
              }}
            >
              <div className="comics-frame-num">
                {String(panel.globalIdx + 1).padStart(3, '0')}
              </div>
              {panel.src && <img src={panel.src} alt="" draggable={false} />}
            </div>
          )
        })}
      </div>
      <div className="comics-page-num">{pageNum}</div>
    </div>
  )
}

export default Comics
