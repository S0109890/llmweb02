import { useState, useRef, useCallback, useMemo } from 'react'
import './Comics.css'

const fixModules = import.meta.glob('../comics/fix/*.{png,jpg,jpeg,webp}', { eager: true })

const FIXED_FRAMES = Object.entries(fixModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod], i) => ({
    id: `fix-${String(i + 1).padStart(3, '0')}`,
    src: mod.default,
    order: i,
  }))

const DEFAULT_COLS = [
  6, 3, 3,
  4, 4, 4,
  12,
  6, 6,
  3, 3, 3, 3,
  8, 4,
  4, 8,
  3, 6, 3,
  12,
  4, 4, 4,
  6, 3, 3,
  6, 6,
]

const panels = FIXED_FRAMES.map((frame, i) => ({
  ...frame,
  col: DEFAULT_COLS[i] || 4,
}))

function groupIntoPages(panels, maxUnits = 36) {
  const pages = []
  let cur = []
  let units = 0

  for (const p of panels) {
    if (units + p.col > maxUnits && cur.length > 0) {
      pages.push(cur)
      cur = []
      units = 0
    }
    cur.push(p)
    units += p.col
  }
  if (cur.length > 0) pages.push(cur)
  return pages
}

function groupIntoSpreads(pages) {
  const spreads = []
  for (let i = 0; i < pages.length; i += 2) {
    spreads.push({
      left: pages[i],
      right: pages[i + 1] || null,
    })
  }
  return spreads
}

function Comics() {
  const [currentSpread, setCurrentSpread] = useState(0)
  const trackRef = useRef(null)
  const dragRef = useRef({ startX: 0, startTime: 0, dragging: false, moved: false })

  const pages = useMemo(() => groupIntoPages(panels, 36), [])
  const spreads = useMemo(() => groupIntoSpreads(pages), [pages])

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, spreads.length - 1))
    setCurrentSpread(clamped)
  }, [spreads.length])

  const onPointerDown = useCallback((e) => {
    dragRef.current = {
      startX: e.clientX,
      startTime: Date.now(),
      dragging: true,
      moved: false,
      currentX: e.clientX,
    }
    if (trackRef.current) trackRef.current.classList.add('dragging')
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return
    dragRef.current.currentX = e.clientX
    dragRef.current.moved = true

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

    const threshold = window.innerWidth * 0.15
    if (dx < -threshold || vx < -0.4) {
      goTo(currentSpread + 1)
    } else if (dx > threshold || vx > 0.4) {
      goTo(currentSpread - 1)
    } else {
      goTo(currentSpread)
    }

    if (trackRef.current) {
      trackRef.current.style.transform = ''
    }
  }, [currentSpread, goTo])

  const translateX = -currentSpread * 100

  let globalIndex = 0

  return (
    <div className="comics-reader">
      <div className="comics-reader-title">Marionettentheater — Comics</div>
      <div className="comics-page-counter">
        {currentSpread * 2 + 1}–{Math.min(currentSpread * 2 + 2, pages.length)} / {pages.length}
      </div>

      <div
        className="comics-track"
        ref={trackRef}
        style={{ transform: `translateX(${translateX}vw)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {spreads.map((spread, si) => (
          <div key={si} className="comics-spread">
            <PageHalf
              side="left"
              panels={spread.left}
              pageNum={si * 2 + 1}
              startIndex={(() => {
                let idx = 0
                for (let s = 0; s < si; s++) {
                  idx += (spreads[s].left?.length || 0) + (spreads[s].right?.length || 0)
                }
                return idx
              })()}
            />
            {spread.right ? (
              <PageHalf
                side="right"
                panels={spread.right}
                pageNum={si * 2 + 2}
                startIndex={(() => {
                  let idx = 0
                  for (let s = 0; s < si; s++) {
                    idx += (spreads[s].left?.length || 0) + (spreads[s].right?.length || 0)
                  }
                  return idx + (spread.left?.length || 0)
                })()}
              />
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

function PageHalf({ side, panels, pageNum, startIndex }) {
  if (!panels || panels.length === 0) {
    return (
      <div className={`comics-page-half ${side}`}>
        <div className="comics-empty-page" />
      </div>
    )
  }

  return (
    <div className={`comics-page-half ${side}`}>
      <div className="comics-page-grid">
        {panels.map((panel, i) => (
          <div
            key={panel.id}
            className="comics-frame"
            style={{ gridColumn: `span ${panel.col}` }}
          >
            <div className="comics-frame-num">
              {String(startIndex + i + 1).padStart(3, '0')}
            </div>
            <img src={panel.src} alt="" draggable={false} />
          </div>
        ))}
      </div>
      <div className="comics-page-num">{pageNum}</div>
    </div>
  )
}

export default Comics
