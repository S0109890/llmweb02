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
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPositionRef = useRef({ x: 0, y: 0 })

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

  // 마우스 이동 이벤트 처리
  useEffect(() => {
    if (!userId || !userColor) return

    let throttleTimeout = null

    const handleMouseMove = (e) => {
      const x = e.clientX
      const y = e.clientY

      // Canvas에 경로 그리기
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        const lastPos = lastPositionRef.current

        if (lastPos.x !== 0 || lastPos.y !== 0) {
          ctx.strokeStyle = userColor
          ctx.lineWidth = 5
          ctx.globalAlpha = 0.8
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          ctx.beginPath()
          ctx.moveTo(lastPos.x, lastPos.y)
          ctx.lineTo(x, y)
          ctx.stroke()
        }

        lastPositionRef.current = { x, y }
      }

      // Supabase에 커서 위치 업데이트 (throttle)
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(async () => {
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
          throttleTimeout = null
        }, 50) // 50ms throttle
      }
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (throttleTimeout) clearTimeout(throttleTimeout)
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
        color: '#9B59B6' // AI 고정 색상
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
            width: '20px',
            height: '20px',
            border: `3px solid ${cursor.color}`,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'transparent'
          }}
        />
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
          controls
          muted
          playsInline
          style={{ width: '100%', height: '100vh', objectFit: 'cover', backgroundColor: '#000' }}
        />
      )}

      {/* AI 채팅 메시지 (줄 공책 스타일) */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        right: '20px',
        maxHeight: '60vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: msg.color,
              color: 'white',
              padding: '10px 15px',
              borderRadius: '8px',
              wordWrap: 'break-word',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontWeight: msg.role === 'user' ? 'bold' : 'normal',
              pointerEvents: 'auto',
              alignSelf: 'flex-start',
              maxWidth: '90%'
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* AI 채팅 입력창 (제일 아래 고정) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '2px solid #ddd',
        padding: '10px 20px',
        display: 'flex',
        gap: '10px',
        zIndex: 1000
      }}>
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
            borderRadius: '4px'
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
            borderRadius: '4px'
          }}
        >
          {loading ? '처리 중...' : '전송'}
        </button>
      </div>
    </div>
  )
}

export default Home
