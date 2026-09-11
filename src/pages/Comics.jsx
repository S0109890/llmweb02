import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './Comics.css'

const fixModules = import.meta.glob('../comics/fix/*.{png,jpg,jpeg,webp}', { eager: true })

const FIXED_FRAMES = Object.entries(fixModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod], i) => ({
    id: `fix-${String(i + 1).padStart(3, '0')}`,
    src: mod.default,
    order: i
  }))

const SIZE_OPTIONS = [
  { col: 3, label: '1/4' },
  { col: 4, label: '1/3' },
  { col: 6, label: '1/2' },
  { col: 8, label: '2/3' },
  { col: 12, label: 'full' },
]

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

function Comics() {
  const [panels, setPanels] = useState(() =>
    FIXED_FRAMES.map((frame, i) => ({
      ...frame,
      col: DEFAULT_COLS[i] || 4,
    }))
  )
  const [sizeMenu, setSizeMenu] = useState(null)
  const [justChanged, setJustChanged] = useState(null)
  const menuRef = useRef(null)
  const skipNextSync = useRef(false)

  useEffect(() => {
    async function loadLayout() {
      try {
        const { data, error } = await supabase
          .from('comic_layout')
          .select('panels')
          .eq('id', 'main')
          .single()

        if (!error && data?.panels?.length) {
          setPanels(prev => prev.map((p, i) => ({
            ...p,
            col: data.panels[i]?.col ?? p.col,
          })))
        }
      } catch (_) {}
    }

    loadLayout()

    const channel = supabase
      .channel('comics-layout-sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'comic_layout',
        filter: 'id=eq.main',
      }, (payload) => {
        if (skipNextSync.current) {
          skipNextSync.current = false
          return
        }
        const incoming = payload.new?.panels
        if (incoming?.length) {
          setPanels(prev => prev.map((p, i) => ({
            ...p,
            col: incoming[i]?.col ?? p.col,
          })))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setSizeMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const changeSize = useCallback((index, newCol) => {
    setPanels(prev => {
      const next = prev.map((p, i) =>
        i === index ? { ...p, col: newCol } : p
      )

      skipNextSync.current = true
      supabase
        .from('comic_layout')
        .upsert({
          id: 'main',
          panels: next.map(p => ({ col: p.col })),
          updated_at: new Date().toISOString(),
        })
        .then(() => {})
        .catch(() => {})

      return next
    })

    setSizeMenu(null)
    setJustChanged(index)
    setTimeout(() => setJustChanged(null), 400)
  }, [])

  const commaAfter = new Set([5, 12, 16, 20, 24])

  return (
    <div className="comics-page">
      <div className="comics-body">
        <div className="comics-header">
          <div className="comics-title">Marionettentheater — Comics</div>
          <div className="comics-count">{panels.length} panels</div>
        </div>

        <div className="comics-grid">
          {panels.map((panel, i) => (
            <ComicFrame
              key={panel.id}
              panel={panel}
              index={i}
              sizeMenu={sizeMenu}
              setSizeMenu={setSizeMenu}
              menuRef={menuRef}
              changeSize={changeSize}
              justChanged={justChanged === i}
              commaAfter={commaAfter.has(i)}
            />
          ))}
        </div>
      </div>

      <div className="comics-sql-hint">
        <details>
          <summary>Supabase SQL (comic_layout)</summary>
          <pre>{`CREATE TABLE comic_layout (
  id TEXT PRIMARY KEY DEFAULT 'main',
  panels JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
INSERT INTO comic_layout (id, panels) VALUES ('main', '[]');
ALTER TABLE comic_layout ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_read" ON comic_layout FOR SELECT USING (true);
CREATE POLICY "open_update" ON comic_layout FOR UPDATE USING (true);
CREATE POLICY "open_insert" ON comic_layout FOR INSERT WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE comic_layout;`}</pre>
        </details>
      </div>
    </div>
  )
}

function ComicFrame({ panel, index, sizeMenu, setSizeMenu, menuRef, changeSize, justChanged, commaAfter }) {
  return (
    <>
      <div
        className={`comics-frame ${justChanged ? 'just-placed' : ''}`}
        style={{
          gridColumn: `span ${panel.col}`,
        }}
      >
        <div className="comics-frame-num">
          {String(index + 1).padStart(3, '0')}
        </div>
        <img src={panel.src} alt="" draggable={false} />

        <div
          className="resize-handle"
          onClick={(e) => {
            e.stopPropagation()
            setSizeMenu(sizeMenu === index ? null : index)
          }}
        />

        {sizeMenu === index && (
          <div className="size-menu" ref={menuRef}>
            {SIZE_OPTIONS.map(opt => (
              <button
                key={opt.col}
                className={panel.col === opt.col ? 'active' : ''}
                onClick={(e) => {
                  e.stopPropagation()
                  changeSize(index, opt.col)
                }}
              >
                {opt.label} ({opt.col}/12)
              </button>
            ))}
          </div>
        )}
      </div>

      {commaAfter && <div className="comics-comma" />}
    </>
  )
}

export default Comics
