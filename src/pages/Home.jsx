import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Hls from 'hls.js'
import { supabase } from '../lib/supabase'

function Home() {
  // Gemini Chat State
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([]) // [{role: 'user'|'ai', text: '...', color: '...'}]
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [userColor, setUserColor] = useState('')

  // CCTV State - 월파 감시 CCTV
  const [cctv, setCctv] = useState(null)
  const [cctvLoading, setCctvLoading] = useState(true)
  const videoRef = useRef(null)

  // 마우스 커서 및 경로 State
  const [otherCursors, setOtherCursors] = useState({}) // {userId: {x, y, color}}
  const canvasRef = useRef(null)
  const lastPositionRef = useRef(null) // null로 초기화
  const pathsRef = useRef([]) // 경로 저장용 (3초 후 사라짐) - 모든 사용자 경로 포함

  // 랜덤 색상 생성 함수 (useEffect 전에 정의)
  function getRandomColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AAB7B8',
      '#F1948A', '#85929E', '#A569BD', '#48C9B0', '#F39C12'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // 사용자 ID 초기화 및 공유 채팅방 불러오기
  useEffect(() => {
    // 사용자 ID 가져오기 또는 생성
    let uid = localStorage.getItem('user_id')
    let color = localStorage.getItem('user_color')

    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('user_id', uid)
    }

    if (!color) {
      color = getRandomColor()
      localStorage.setItem('user_color', color)
    }

    setUserId(uid)
    setUserColor(color)

    // 모든 대화 내역 불러오기 (session_id 필터 제거)
    async function loadMessages() {
      try {
        console.log('📥 Loading messages from Supabase...')
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(100) // 최근 100개만

        if (error) {
          console.error('❌ Failed to load messages:', error)
          return
        }

        console.log('📨 Loaded messages:', data?.length || 0, 'messages')
        if (data && data.length > 0) {
          console.log('First message:', data[0])
          setMessages(data.map(msg => ({
            role: msg.role,
            text: msg.text,
            color: msg.color,
            userId: msg.user_id
          })))
        } else {
          console.log('📭 No messages found in database')
        }
      } catch (error) {
        console.error('❌ Failed to load messages:', error)
      }
    }

    loadMessages()

    // Realtime 구독 - 새 메시지 실시간 수신
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMsg = payload.new
        setMessages(prev => [...prev, {
          role: newMsg.role,
          text: newMsg.text,
          color: newMsg.color,
          userId: newMsg.user_id
        }])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 마우스 커서 실시간 공유
  useEffect(() => {
    if (!userId || !userColor) return

    // 다른 사용자들의 커서 위치 구독
    const cursorChannel = supabase
      .channel('active_cursors')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'active_cursors'
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const cursor = payload.new
          if (cursor.user_id !== userId) {
            setOtherCursors(prev => ({
              ...prev,
              [cursor.user_id]: {
                x: cursor.x,
                y: cursor.y,
                color: cursor.color
              }
            }))
          }
        } else if (payload.eventType === 'DELETE') {
          setOtherCursors(prev => {
            const newCursors = { ...prev }
            delete newCursors[payload.old.user_id]
            return newCursors
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(cursorChannel)
    }
  }, [userId, userColor])

  // 3초 후 사라지는 마우스 경로 처리 (Realtime Broadcast로 공유, DB 저장 안함)
  useEffect(() => {
    if (!userId || !userColor) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Realtime Broadcast 채널 생성
    const pathChannel = supabase.channel('mouse_paths_broadcast')

    // 다른 사용자의 경로 수신
    pathChannel.on('broadcast', { event: 'path' }, (payload) => {
      const { fromX, fromY, toX, toY, color, userId: senderId } = payload.payload
      if (senderId !== userId) {
        pathsRef.current.push({
          fromX,
          fromY,
          toX,
          toY,
          color,
          timestamp: Date.now()
        })
      }
    }).subscribe()

    // Canvas 그리기 함수
    function drawPaths() {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const now = Date.now()
      const filteredPaths = pathsRef.current.filter(path => now - path.timestamp < 3000)
      pathsRef.current = filteredPaths

      filteredPaths.forEach(path => {
        const age = now - path.timestamp
        const opacity = Math.max(0, 1 - age / 3000)

        ctx.strokeStyle = path.color
        ctx.lineWidth = 5
        ctx.globalAlpha = opacity * 0.8
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        ctx.moveTo(path.fromX, path.fromY)
        ctx.lineTo(path.toX, path.toY)
        ctx.stroke()
      })
    }

    // 마우스 이동 핸들러
    const handleMouseMove = (e) => {
      const x = e.clientX
      const y = e.clientY

      if (lastPositionRef.current) {
        const pathSegment = {
          fromX: lastPositionRef.current.x,
          fromY: lastPositionRef.current.y,
          toX: x,
          toY: y,
          color: userColor,
          timestamp: Date.now()
        }

        pathsRef.current.push(pathSegment)

        // Broadcast to other users
        pathChannel.send({
          type: 'broadcast',
          event: 'path',
          payload: { ...pathSegment, userId }
        })
      }

      lastPositionRef.current = { x, y }

      // 커서 위치만 Supabase에 업데이트 (throttle)
      updateCursorPosition(x, y)
    }

    // 터치 이벤트 핸들러 (채팅 입력창 영역은 제외)
    const handleTouchStart = (e) => {
      // 채팅 입력창 영역이면 무시
      const target = e.target
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('[data-chat-input]')) {
        return
      }

      e.preventDefault()
      const touch = e.touches[0]
      lastPositionRef.current = {
        x: touch.clientX,
        y: touch.clientY
      }
    }

    const handleTouchMove = (e) => {
      // 채팅 입력창 영역이면 무시
      const target = e.target
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('[data-chat-input]')) {
        return
      }

      e.preventDefault()
      const touch = e.touches[0]
      const x = touch.clientX
      const y = touch.clientY

      if (lastPositionRef.current) {
        const pathSegment = {
          fromX: lastPositionRef.current.x,
          fromY: lastPositionRef.current.y,
          toX: x,
          toY: y,
          color: userColor,
          timestamp: Date.now()
        }

        pathsRef.current.push(pathSegment)

        // Broadcast to other users
        pathChannel.send({
          type: 'broadcast',
          event: 'path',
          payload: { ...pathSegment, userId }
        })
      }

      lastPositionRef.current = { x, y }

      // 커서 위치만 Supabase에 업데이트
      updateCursorPosition(x, y)
    }

    const handleTouchEnd = () => {
      lastPositionRef.current = null
    }

    // Throttled cursor position update
    let cursorThrottle = null
    function updateCursorPosition(x, y) {
      if (!cursorThrottle) {
        cursorThrottle = setTimeout(async () => {
          try {
            await supabase
              .from('active_cursors')
              .upsert({
                user_id: userId,
                x: x,
                y: y,
                color: userColor,
                updated_at: new Date().toISOString()
              })
          } catch (error) {
            console.error('Failed to update cursor:', error)
          }
          cursorThrottle = null
        }, 50)
      }
    }

    // 이벤트 리스너 등록
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    // 애니메이션 루프 (경로 그리기 + 3초 후 삭제)
    const animationInterval = setInterval(drawPaths, 16) // ~60fps

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      clearInterval(animationInterval)
      if (cursorThrottle) clearTimeout(cursorThrottle)
      supabase.removeChannel(pathChannel)
    }
  }, [userId, userColor])

  // Canvas 크기 조정
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 월파 감시 CCTV 데이터 가져오기
  useEffect(() => {
    async function fetchCctv() {
      const cached = localStorage.getItem('waveover_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setCctv(data)
          setCctvLoading(false)
          return
        }
      }

      try {
        const r = await fetch('/api/waveover-cctv')
        const data = await r.json()
        setCctv(data.cctv)
        localStorage.setItem('waveover_cache', JSON.stringify({
          data: data.cctv,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Failed to fetch waveover CCTV:', error)
      } finally {
        setCctvLoading(false)
      }
    }
    fetchCctv()
  }, [])

  // HLS 스트림 설정
  useEffect(() => {
    if (!cctv || !cctv.cctvUrl) return

    const video = videoRef.current
    const proxiedUrl = `/api/cctv-proxy?url=${encodeURIComponent(cctv.cctvUrl)}`

    if (video && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        startLevel: -1,
        capLevelToPlayerSize: true,
      })
      hls.loadSource(proxiedUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls.levels.length > 0) {
          hls.currentLevel = 0
        }
        video.play().catch(err => console.log('Autoplay prevented:', err))
      })

      return () => {
        hls.destroy()
      }
    } else if (video && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxiedUrl
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => console.log('Autoplay prevented:', err))
      })
    }
  }, [cctv])

  // 색상 채도 낮추기 함수 (HSL 변환)
  function reduceSaturation(hexColor, amount = 30) {
    // HEX to RGB
    const r = parseInt(hexColor.slice(1, 3), 16) / 255
    const g = parseInt(hexColor.slice(3, 5), 16) / 255
    const b = parseInt(hexColor.slice(5, 7), 16) / 255

    // RGB to HSL
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    // 채도 낮추기
    s = Math.max(0, s - amount / 100)

    // HSL to RGB
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    let r2, g2, b2
    if (s === 0) {
      r2 = g2 = b2 = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r2 = hue2rgb(p, q, h + 1/3)
      g2 = hue2rgb(p, q, h)
      b2 = hue2rgb(p, q, h - 1/3)
    }

    // RGB to HEX
    const toHex = (x) => {
      const hex = Math.round(x * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return '#' + toHex(r2) + toHex(g2) + toHex(b2)
  }

  // Gemini Chat 함수
  async function ask() {
    if (!prompt.trim() || !userId) return

    const userMessage = {
      role: 'user',
      text: prompt,
      color: userColor,
      userId: userId
    }

    setLoading(true)
    const currentPrompt = prompt
    setPrompt('')

    // 사용자 메시지 저장 (Realtime으로 자동 추가됨)
    try {
      console.log('💾 Saving user message:', { userId, text: userMessage.text })
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          role: 'user',
          text: userMessage.text,
          color: userMessage.color
        })

      if (error) {
        console.error('❌ Insert error:', error)
      } else {
        console.log('✅ User message saved:', data)
      }
    } catch (error) {
      console.error('❌ Failed to save user message:', error)
    }

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      })
      const data = await r.json()
      const aiMessage = {
        role: 'ai',
        text: data.text || 'No response',
        color: reduceSaturation(userColor, 30) // 사용자 색상에서 채도 30% 낮춤
      }

      // AI 응답 저장 (Realtime으로 자동 추가됨)
      try {
        await supabase
          .from('chat_messages')
          .insert({
            user_id: 'ai',
            role: 'ai',
            text: aiMessage.text,
            color: aiMessage.color
          })
      } catch (error) {
        console.error('Failed to save AI message:', error)
      }
    } catch (error) {
      console.error('Failed to get response:', error)
      const errorMessage = {
        role: 'ai',
        text: 'Error: Failed to get response from AI',
        color: '#E74C3C'
      }

      // 에러 메시지도 저장 (Realtime으로 자동 추가됨)
      try {
        await supabase
          .from('chat_messages')
          .insert({
            user_id: 'ai',
            role: 'ai',
            text: errorMessage.text,
            color: errorMessage.color
          })
      } catch (error) {
        console.error('Failed to save error message:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '0', paddingBottom: '80px', margin: '0' }}>
      {/* Canvas for mouse paths */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 999
        }}
      />

      {/* 다른 사용자들의 커서 */}
      {Object.entries(otherCursors).map(([uid, cursor]) => (
        <div
          key={uid}
          style={{
            position: 'fixed',
            left: cursor.x,
            top: cursor.y,
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* 커서 원 */}
          <div
            style={{
              width: '20px',
              height: '20px',
              border: `3px solid ${cursor.color}`,
              borderRadius: '50%',
              backgroundColor: 'transparent'
            }}
          />
          {/* 사용자 ID 표시 */}
          <div
            style={{
              position: 'absolute',
              top: '25px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: cursor.color,
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {uid.substring(0, 8)}...
          </div>
        </div>
      ))}

      {/* 나머지 CCTV 보기 버튼 - 오른쪽 위 작게 */}
      <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1001 }}>
        <Link to="/more-cctvs">
          <button style={{
            padding: '5px 10px',
            fontSize: '12px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            다른 CCTV
          </button>
        </Link>
      </div>

      {/* CCTV 영상만 - 제목/설명 제거 */}
      {cctvLoading ? (
        <p style={{ padding: '20px' }}>Loading...</p>
      ) : !cctv || !cctv.cctvUrl ? (
        <p style={{ padding: '20px' }}>CCTV를 불러올 수 없습니다.</p>
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: 'auto',
            backgroundColor: '#000',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* AI 채팅 메시지 (벽돌 스타일) - 오른쪽 정렬, 일정한 높이 */}
      <div style={{
        position: 'fixed',
        top: '0',
        bottom: '80px',
        left: '20px',
        right: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: '10px',
        pointerEvents: 'none',
        paddingTop: '20px',
        paddingBottom: '20px',
        justifyContent: 'flex-end'
      }}>
        {messages.map((msg, idx) => {
          const words = msg.text.split(' ')
          const chunks = []
          const chunkSize = 15 // 한 벽돌당 단어 수

          for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '))
          }

          return chunks.map((chunk, chunkIdx) => (
            <div
              key={`${idx}-${chunkIdx}`}
              style={{
                position: 'relative',
                pointerEvents: 'auto',
                width: 'calc(33.33% - 10px)',
                minWidth: '200px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}
            >
              {/* 반투명 배경 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: msg.color,
                opacity: 0.5,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }} />
              {/* 불투명 텍스트 */}
              <div style={{
                position: 'relative',
                color: 'white',
                padding: '10px 15px',
                wordWrap: 'break-word',
                fontWeight: msg.role === 'user' ? 'bold' : 'normal',
                fontSize: window.innerWidth <= 768 ? '12px' : '16px',
                textAlign: 'right',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {chunk}
              </div>
            </div>
          ))
        })}
      </div>

      {/* AI 채팅 입력창 (제일 아래 고정) */}
      <div
        data-chat-input
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '2px solid #ddd',
          padding: '10px 20px',
          display: 'flex',
          gap: '10px',
          zIndex: 10001,
          touchAction: 'auto'
        }}
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && ask()}
          placeholder="질문을 입력하세요..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            WebkitAppearance: 'none',
            touchAction: 'auto'
          }}
        />
        <button
          onClick={ask}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {loading ? '처리 중...' : '전송'}
        </button>
      </div>
    </div>
  )
}

export default Home
