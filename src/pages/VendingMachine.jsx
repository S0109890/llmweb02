import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import './VendingMachine.css'

const COLORS = [
  '#3da35d', '#aec5eb', '#dec0f1', '#59594a', '#e8fccf',
  '#c97b84', '#a2d2ff', '#ffd6a5', '#caffbf', '#bdb2ff',
  '#ffc6ff', '#fdffb6', '#9bf6ff', '#f1c0e8', '#cfbaf0',
  '#a3c4f3', '#90dbf4', '#8eecf5', '#98f5e1', '#b9fbc0',
  '#fbf8cc', '#fde4cf', '#ffcfd2', '#d0f4de'
]

const FILM_STRIPS = Array.from({ length: 24 }, (_, i) => ({
  id: `strip-${i}`,
  frames: Array.from({ length: 6 }, (_, j) => ({
    id: `${i}-${j}`,
    color: COLORS[(i * 6 + j) % COLORS.length],
    src: null
  }))
}))

function VendingMachine() {
  const [activeStrip, setActiveStrip] = useState(null)
  const [droppingFrame, setDroppingFrame] = useState(null)
  const [savedFrames, setSavedFrames] = useState([])
  const [userId, setUserId] = useState('')

  const trayRef = useRef(null)

  useEffect(() => {
    let uid = localStorage.getItem('vending_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('vending_user_id', uid)
    }
    setUserId(uid)
  }, [])

  useEffect(() => {
    if (!userId) return

    async function loadSaved() {
      const { data } = await supabase
        .from('vending_selections')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        setSavedFrames(data.map(d => ({
          id: d.id,
          frameId: d.frame_id,
          stripId: d.strip_id,
          color: d.color,
          imageUrl: d.image_url,
          userId: d.user_id
        })))
      }
    }

    loadSaved()

    const channel = supabase
      .channel('vending-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'vending_selections'
      }, (payload) => {
        const d = payload.new
        setSavedFrames(prev => {
          const exists = prev.some(f => f.frameId === d.frame_id && f.stripId === d.strip_id)
          if (exists) return prev
          return [...prev, {
            id: d.id,
            frameId: d.frame_id,
            stripId: d.strip_id,
            color: d.color,
            imageUrl: d.image_url,
            userId: d.user_id
          }]
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const handleSlotClick = useCallback((stripId) => {
    if (droppingFrame) return
    setActiveStrip(prev => prev === stripId ? null : stripId)
  }, [droppingFrame])

  const handleFrameSelect = useCallback((strip, frame, frameIndex, e) => {
    e.stopPropagation()
    if (droppingFrame) return

    const rect = e.currentTarget.getBoundingClientRect()
    const trayRect = trayRef.current?.getBoundingClientRect()
    if (!trayRect) return

    const dropDist = trayRect.top - rect.top

    setDroppingFrame({
      frame,
      strip,
      frameIndex,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      dropDist
    })

    supabase.from('vending_selections').insert({
      user_id: userId,
      strip_id: strip.id,
      frame_id: frame.id,
      frame_index: frameIndex,
      image_url: frame.src,
      color: frame.color
    }).then(({ error }) => {
      if (error) console.error('Save error:', error)
    })
  }, [droppingFrame, userId])

  const handleDropEnd = useCallback(() => {
    if (droppingFrame) {
      const { frame, strip, frameIndex } = droppingFrame
      setSavedFrames(prev => {
        const alreadySaved = prev.some(f => f.frameId === frame.id && f.stripId === strip.id)
        if (alreadySaved) return prev
        return [...prev, {
          id: `local-${Date.now()}`,
          frameId: frame.id,
          stripId: strip.id,
          color: frame.color,
          imageUrl: frame.src,
          userId
        }]
      })
    }
    setDroppingFrame(null)
    setActiveStrip(null)
  }, [droppingFrame, userId])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      fontFamily: '"D2Coding", "Courier New", monospace',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px'
    }}>
      {/* 자판기 본체 */}
      <div style={{
        width: '100%',
        maxWidth: '960px',
        background: 'linear-gradient(180deg, #2a2a2a 0%, #1e1e1e 50%, #151515 100%)',
        border: '2px solid #444',
        borderRadius: '4px',
        boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid #333',
          background: 'linear-gradient(90deg, #1a1a1a, #222, #1a1a1a)'
        }}>
          <div style={{
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: '#888',
            textTransform: 'uppercase'
          }}>
            Vending Machine
          </div>
          <div style={{
            fontSize: '10px',
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#3da35d',
              display: 'inline-block'
            }} />
            SAVED: {savedFrames.length}
          </div>
        </div>

        {/* 장식 나사 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 12px',
          height: '16px',
          alignItems: 'center'
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: '1px solid #444',
              background: 'radial-gradient(circle at 30% 30%, #555, #333)'
            }} />
          ))}
        </div>

        {/* 슬롯 그리드 */}
        <div className="vending-grid">
          {FILM_STRIPS.map((strip, stripIdx) => (
            <div
              key={strip.id}
              className={`film-slot ${activeStrip && activeStrip !== strip.id ? 'slot-dimmed' : ''}`}
              onClick={() => handleSlotClick(strip.id)}
              style={{
                aspectRatio: '3 / 4',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '2px'
              }}
            >
              {/* 상단 롤러 */}
              <div className="slot-roller" />

              {/* 스프로켓 홀 */}
              <div className="sprocket-strip left" />
              <div className="sprocket-strip right" />

              {/* 필름 프레임 영역 */}
              <div style={{
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                padding: '0 10px'
              }}>
                <div
                  className="film-strip-idle"
                  style={{
                    '--cycle-duration': `${3 + (stripIdx % 5) * 0.7}s`,
                    '--frame-h': '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    animationDelay: `${stripIdx * -0.5}s`
                  }}
                >
                  {/* 프레임을 2번 반복하여 매끄러운 루프 */}
                  {[...strip.frames, ...strip.frames].map((frame, fIdx) => (
                    <div
                      key={`${frame.id}-${fIdx}`}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        flexShrink: 0,
                        marginBottom: '2px'
                      }}
                    >
                      {frame.src ? (
                        <img
                          src={frame.src}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: frame.color,
                          opacity: 0.8
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 롤러 */}
              <div className="slot-roller" />

              {/* 슬롯 번호 */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '10px',
                fontSize: '8px',
                color: '#444',
                fontFamily: '"D2Coding", monospace'
              }}>
                {String(stripIdx + 1).padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>

        {/* 장식 나사 (하단) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 12px',
          height: '16px',
          alignItems: 'center'
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: '1px solid #444',
              background: 'radial-gradient(circle at 30% 30%, #555, #333)'
            }} />
          ))}
        </div>

        {/* 수집 트레이 */}
        <div
          ref={trayRef}
          style={{
            borderTop: '2px solid #333',
            padding: '16px 20px',
            background: 'linear-gradient(180deg, #181818, #111)',
            minHeight: '100px'
          }}
        >
          <div style={{
            fontSize: '8px',
            letterSpacing: '0.15em',
            color: '#444',
            marginBottom: '10px',
            textTransform: 'uppercase'
          }}>
            Selection Tray
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}>
            {savedFrames.length === 0 ? (
              <div style={{ fontSize: '10px', color: '#333' }}>
                click a slot, then select a frame
              </div>
            ) : (
              savedFrames.map((frame, i) => (
                <div
                  key={frame.id}
                  className={i === savedFrames.length - 1 ? 'frame-landed' : ''}
                  style={{
                    width: '52px',
                    height: '52px',
                    flexShrink: 0,
                    border: '1px solid #333',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}
                >
                  {frame.imageUrl ? (
                    <img
                      src={frame.imageUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: frame.color
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 확장 오버레이 */}
      {activeStrip && (
        <div
          className="expanded-overlay"
          onClick={() => setActiveStrip(null)}
        >
          {/* 닫기 */}
          <div
            onClick={() => setActiveStrip(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              fontSize: '14px',
              color: '#666',
              cursor: 'pointer',
              fontFamily: '"D2Coding", monospace',
              letterSpacing: '0.1em'
            }}
          >
            CLOSE [ESC]
          </div>

          {/* 스트립 ID */}
          <div style={{
            fontSize: '10px',
            color: '#555',
            letterSpacing: '0.15em',
            marginBottom: '16px',
            textTransform: 'uppercase'
          }}>
            Strip {activeStrip.replace('strip-', '')} — select a frame
          </div>

          {/* 가로 필름 스트립 */}
          <div
            className="expanded-strip"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 스프로켓 상단 */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '20px',
              right: '20px',
              height: '8px',
              background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 12px, #333 12px, #333 18px, transparent 18px, transparent 30px)',
              pointerEvents: 'none'
            }} />

            {FILM_STRIPS.find(s => s.id === activeStrip)?.frames.map((frame, fIdx) => (
              <div
                key={frame.id}
                className="expanded-frame"
                onClick={(e) => handleFrameSelect(
                  FILM_STRIPS.find(s => s.id === activeStrip),
                  frame,
                  fIdx,
                  e
                )}
                style={{
                  width: 'min(120px, 15vw)',
                  height: 'min(120px, 15vw)',
                  animation: `filmSlide 0.4s ease-out ${fIdx * 0.08}s both`
                }}
              >
                {frame.src ? (
                  <img
                    src={frame.src}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: frame.color
                  }} />
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  fontSize: '8px',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: '"D2Coding", monospace'
                }}>
                  {String(fIdx + 1).padStart(2, '0')}
                </div>
              </div>
            ))}

            {/* 스프로켓 하단 */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '20px',
              right: '20px',
              height: '8px',
              background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 12px, #333 12px, #333 18px, transparent 18px, transparent 30px)',
              pointerEvents: 'none'
            }} />
          </div>
        </div>
      )}

      {/* 드롭 애니메이션 오버레이 */}
      {droppingFrame && (
        <div
          className="frame-dropping"
          style={{
            left: droppingFrame.left,
            top: droppingFrame.top,
            width: droppingFrame.width,
            height: droppingFrame.height,
            '--drop-dist': `${droppingFrame.dropDist}px`
          }}
          onAnimationEnd={handleDropEnd}
        >
          {droppingFrame.frame.src ? (
            <img
              src={droppingFrame.frame.src}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: droppingFrame.frame.color,
              border: '2px solid #fff'
            }} />
          )}
        </div>
      )}
    </div>
  )
}

export default VendingMachine
