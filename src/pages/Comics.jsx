import { useState, useRef, useCallback, useMemo } from 'react'
import './Comics.css'

const fixModules = import.meta.glob('../comics/fix/*.{png,jpg,jpeg,webp}', { eager: true })

const IMAGES = Object.entries(fixModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => mod.default)

const PAGES = [
  // Page 1 — 7 panels (1 big establishing shot)
  // Row1: [6×2][3][3]  Row2: [cont][3][3]  Row3: [6][6]
  [
    { col: 6, row: 2 },
    { col: 3, row: 1 },
    { col: 3, row: 1 },
    { col: 3, row: 1 },
    { col: 3, row: 1 },
    { col: 6, row: 1 },
    { col: 6, row: 1 },
  ],
  // Page 2 — 8 panels (uniform)
  // Row1: [6][6]  Row2: [3][3][3][3]  Row3: [8][4]
  [
    { col: 6, row: 1 },
    { col: 6, row: 1 },
    { col: 3, row: 1 },
    { col: 3, row: 1 },
    { col: 3, row: 1 },
    { col: 3, row: 1 },
    { col: 8, row: 1 },
    { col: 4, row: 1 },
  ],
  // Page 3 — 7 panels (1 big panel)
  // Row1: [4][4][4]  Row2: [8×2][4]  Row3: [cont][4]
  [
    { col: 4, row: 1 },
    { col: 4, row: 1 },
    { col: 4, row: 1 },
    { col: 8, row: 2 },
    { col: 4, row: 1 },
    { col: 4, row: 1 },
    // 6 panels. Units: 12 + 16 + 4 + 4 = 36 ✓
  ],
  // Page 4 — 8 panels
  // Row1: [6][6]  Row2: [6][3][3]  Row3: [4][4][4]
  [
    { col: 6, row: 1 },
    { col: 6, row: 1 },
    { col: 6, row: 1 },
    { col: 3, row: 1 },
    { col: 3, row: 1 },
    { col: 4, row: 1 },
    { col: 4, row: 1 },
    { col: 4, row: 1 },
  ],
]

function Comics() {
  const [currentSpread, setCurrentSpread] = useState(0)
  const trackRef = useRef(null)
  const dragRef = useRef({ startX: 0, dragging: false })

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
            <PageHalf side="left" panels={spread.left} pageNum={si * 2 + 1} />
            {spread.right ? (
              <PageHalf side="right" panels={spread.right} pageNum={si * 2 + 2} />
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

function PageHalf({ side, panels, pageNum }) {
  return (
    <div className={`comics-page-half ${side}`}>
      <div className="comics-page-grid">
        {panels.map((panel) => (
          <div
            key={panel.globalIdx}
            className="comics-frame"
            style={{
              gridColumn: `span ${panel.col}`,
              gridRow: panel.row > 1 ? `span ${panel.row}` : undefined,
            }}
          >
            <div className="comics-frame-num">
              {String(panel.globalIdx + 1).padStart(3, '0')}
            </div>
            {panel.src && <img src={panel.src} alt="" draggable={false} />}
          </div>
        ))}
      </div>
      <div className="comics-page-num">{pageNum}</div>
    </div>
  )
}

export default Comics
