import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import './VendingMachine.css'

import seesaw01 from '../mid/seesaw_01.png'
import seesaw02 from '../mid/seesaw_02.png'
import seesaw03 from '../mid/seesaw_03.png'

const TEST_IMAGES = [seesaw01, seesaw02, seesaw03]

const STRIPS = Array.from({ length: 8 }, (_, i) => ({
  id: `strip-${i}`,
  thumb: TEST_IMAGES[i % TEST_IMAGES.length],
  frames: TEST_IMAGES,
  label: String(i + 1).padStart(2, '0')
}))

const CYLINDER_FACES = 8
const CYLINDER_RADIUS = 40

function CylinderReel({ images, paused }) {
  const faces = useMemo(() => {
    const angle = 360 / CYLINDER_FACES
    return Array.from({ length: CYLINDER_FACES }, (_, i) => ({
      src: images[i % images.length],
      transform: `rotateX(${i * angle}deg) translateZ(${CYLINDER_RADIUS}px)`
    }))
  }, [images])

  return (
    <div className="vm-cylinder-wrap">
      <div className="vm-cylinder" style={paused ? { animationPlayState: 'paused' } : undefined}>
        {faces.map((face, i) => (
          <div key={i} className="vm-cylinder-face" style={{ transform: face.transform }}>
            <img src={face.src} alt="" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MutoscopeViewport({ frames, active, onSelectFrame }) {
  const viewportRef = useRef(null)
  const [vpWidth, setVpWidth] = useState(300)

  useEffect(() => {
    if (!viewportRef.current) return
    const obs = new ResizeObserver(([entry]) => {
      setVpWidth(entry.contentRect.width)
    })
    obs.observe(viewportRef.current)
    return () => obs.disconnect()
  }, [])

  const totalW = vpWidth * frames.length
  const scrollDuration = `${frames.length * 1.6}s`

  return (
    <div className="vm-viewport" ref={viewportRef}>
      <div className="vm-viewport-label">mutoscope</div>
      <div
        className={`vm-viewport-strip ${active ? 'playing' : ''}`}
        style={{
          '--viewport-w': `${vpWidth}px`,
          '--scroll-duration': scrollDuration,
          width: `${totalW}px`
        }}
      >
        {frames.map((src, i) => (
          <div
            key={i}
            className="vm-viewport-frame"
            style={{ '--viewport-w': `${vpWidth}px` }}
            onClick={() => onSelectFrame(i)}
          >
            <img src={src} alt="" />
          </div>
        ))}
      </div>

      <div className="vm-select-bar">
        {frames.map((src, i) => (
          <div
            key={i}
            className="vm-select-frame"
            onClick={() => onSelectFrame(i)}
          >
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

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

  const currentStrip = STRIPS.find(s => s.id === activeStrip) || STRIPS[0]

  const handleBtnClick = useCallback((stripId) => {
    if (droppingFrame) return
    setActiveStrip(stripId)
  }, [droppingFrame])

  const handleFrameSelect = useCallback((frameIndex) => {
    if (droppingFrame || !currentStrip) return

    const frame = {
      id: `${currentStrip.id}-${frameIndex}`,
      src: currentStrip.frames[frameIndex],
      color: '#333'
    }

    const trayRect = trayRef.current?.getBoundingClientRect()
    if (!trayRect) return

    setDroppingFrame({
      frame,
      strip: currentStrip,
      frameIndex,
      dropDist: 200
    })

    supabase.from('vending_selections').insert({
      user_id: userId,
      strip_id: currentStrip.id,
      frame_id: frame.id,
      frame_index: frameIndex,
      image_url: frame.src,
      color: frame.color
    }).then(({ error }) => {
      if (error) console.error('Save error:', error)
    })
  }, [droppingFrame, currentStrip, userId])

  const handleDropEnd = useCallback(() => {
    if (droppingFrame) {
      const { frame, strip } = droppingFrame
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
  }, [droppingFrame, userId])

  const leftStrips = STRIPS.slice(0, 4)
  const rightStrips = STRIPS.slice(4, 8)

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
      <div className="vm-body">
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid #333',
          background: 'linear-gradient(90deg, #1a1a1a, #222, #1a1a1a)'
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase' }}>
            Marionettentheater — Vending Machine
          </div>
          <div style={{ fontSize: '9px', color: '#444', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#3da35d', display: 'inline-block' }} />
            {savedFrames.length}
          </div>
        </div>

        {/* 나사 장식 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px' }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="vm-screw" />)}
        </div>

        {/* 메인: 좌 버튼열 | 중앙 뷰포트+원통 | 우 버튼열 */}
        <div className="vm-main">
          {/* 좌측 열 */}
          <div className="vm-column left">
            {leftStrips.map(strip => (
              <div
                key={strip.id}
                className={`vm-btn ${activeStrip === strip.id ? 'active' : ''}`}
                onClick={() => handleBtnClick(strip.id)}
              >
                <img src={strip.thumb} alt="" />
                <div style={{
                  position: 'absolute', bottom: '2px', right: '3px',
                  fontSize: '7px', color: 'rgba(255,255,255,0.3)',
                  fontFamily: '"D2Coding", monospace'
                }}>
                  {strip.label}
                </div>
              </div>
            ))}
            <div className="vm-circle" style={{ alignSelf: 'center', marginTop: '8px' }} />
          </div>

          {/* 중앙 */}
          <div className="vm-center">
            <div className="vm-perf" />

            <CylinderReel
              images={currentStrip.frames}
              paused={!!droppingFrame}
            />

            <MutoscopeViewport
              frames={currentStrip.frames}
              active={!droppingFrame}
              onSelectFrame={handleFrameSelect}
            />

            <div className="vm-perf" />
          </div>

          {/* 우측 열 */}
          <div className="vm-column right">
            {rightStrips.map(strip => (
              <div
                key={strip.id}
                className={`vm-btn ${activeStrip === strip.id ? 'active' : ''}`}
                onClick={() => handleBtnClick(strip.id)}
              >
                <img src={strip.thumb} alt="" />
                <div style={{
                  position: 'absolute', bottom: '2px', right: '3px',
                  fontSize: '7px', color: 'rgba(255,255,255,0.3)',
                  fontFamily: '"D2Coding", monospace'
                }}>
                  {strip.label}
                </div>
              </div>
            ))}
            <div className="vm-screw" style={{ alignSelf: 'center', marginTop: 'auto' }} />
          </div>
        </div>

        {/* 하단 나사 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px' }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="vm-screw" />)}
        </div>

        {/* 트레이 */}
        <div className="vm-tray" ref={trayRef}>
          <div style={{
            fontSize: '8px', letterSpacing: '0.15em', color: '#444',
            marginBottom: '8px', textTransform: 'uppercase'
          }}>
            Selection Tray
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
            {savedFrames.length === 0 ? (
              <div style={{ fontSize: '9px', color: '#333' }}>
                이미지를 선택하세요
              </div>
            ) : (
              savedFrames.map((frame, i) => (
                <div
                  key={frame.id}
                  className={i === savedFrames.length - 1 ? 'frame-landed' : ''}
                  style={{
                    width: '48px', height: '36px', flexShrink: 0,
                    border: '1px solid #333', overflow: 'hidden'
                  }}
                >
                  {frame.imageUrl ? (
                    <img src={frame.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: frame.color }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 드롭 애니메이션 */}
      {droppingFrame && (
        <div
          className="frame-dropping"
          style={{
            left: '50%',
            top: '50%',
            width: '72px',
            height: '54px',
            marginLeft: '-36px',
            '--drop-dist': `${droppingFrame.dropDist}px`
          }}
          onAnimationEnd={handleDropEnd}
        >
          <img
            src={droppingFrame.frame.src}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  )
}

export default VendingMachine
