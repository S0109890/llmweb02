import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// 클라이스트 독일어 원문 (마침표 기준 분절)
const KLEIST_TEXT = [
  "Was sag ich, tanzen?",
  "Der Kreis ihrer Bewegungen ist zwar beschränkt; doch diejenigen, die ihnen zu Gebote stehen, vollziehen sich mit einer Ruhe, Leichtigkeit und Anmut, die jedes denkende Gemüt in Erstaunen setzen.",
  "Ich äußerte, scherzend, daß er ja, auf diese Weise, seinen Mann gefunden habe.",
  "Denn derjenige Künstler, der einen so merkwürdigen Schenkel zu bauen imstande sei, würde ihm unzweifelhaft auch eine ganze Marionette, seinen Forderungen gemäß, zusammensetzen können.",
  "Wie, fragte ich, da er seinerseits ein wenig betreten zur Erde sah: wie sind denn diese Forderungen, die Sie an die Kunstfertigkeit desselben zu machen gedenken, bestellt?",
  "Nichts, antwortete er, was sich nicht auch schon hier fände; Ebenmaß, Beweglichkeit, Leichtigkeit – nur alles in einem höheren Grade; und besonders eine naturgemäßere Anordnung der Schwerpunkte.",
  "Und der Vorteil, den diese Puppe vor lebendigen Tänzern voraus haben würde?",
  "Der Vorteil?",
  "Zuvörderst ein negativer, mein vortrefflicher Freund, nämlich dieser, daß sie sich niemals zierte.",
  "Denn Ziererei erscheint, wie Sie wissen, wenn sich die Seele (vis motrix) in irgendeinem andern Punkte befindet, als in dem Schwerpunkt der Bewegung."
]

// 4개 색상 (독일어용)
const GERMAN_COLORS = ['#3da35d', '#aec5eb', '#dec0f1', '#59594a']

// AI 대화용 핑크 베리에이션
const AI_PINK_BASE = '#dec0f1'  // mauve를 핑크 베이스로
const AI_PINK_VARIATIONS = [
  '#dec0f1',
  '#e8c5f0',
  '#f2d0f5',
  '#d8b5e8',
  '#e5c0ee'
]

function Marionette() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [userColor, setUserColor] = useState('')

  // 마우스 궤적 (자석 기능용)
  const [mousePath, setMousePath] = useState([])
  const [otherCursors, setOtherCursors] = useState({})
  const [wordPositions, setWordPositions] = useState([])
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const animationRef = useRef(null)

  // 사용자 ID 초기화
  useEffect(() => {
    let uid = localStorage.getItem('marionette_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('marionette_user_id', uid)
    }

    // 핑크 베리에이션 중 랜덤 선택
    const color = AI_PINK_VARIATIONS[Math.floor(Math.random() * AI_PINK_VARIATIONS.length)]
    setUserId(uid)
    setUserColor(color)

    // 메시지 로드
    loadMessages()
  }, [])

  // 단어 위치 수집 (자석 기능용)
  useEffect(() => {
    if (!containerRef.current) return

    const words = []
    const sentenceElements = containerRef.current.querySelectorAll('[data-sentence-id]')

    sentenceElements.forEach((element) => {
      const text = element.textContent
      const rect = element.getBoundingClientRect()
      const wordsInSentence = text.split(/\s+/)
      const avgWordWidth = rect.width / wordsInSentence.length

      wordsInSentence.forEach((word, idx) => {
        if (word.trim()) {
          words.push({
            word: word.trim(),
            x: rect.left + (idx * avgWordWidth) + (avgWordWidth / 2),
            y: rect.top + (rect.height / 2) + window.scrollY,
            width: avgWordWidth
          })
        }
      })
    })

    setWordPositions(words)
  }, [messages])

  // Canvas 초기화 및 애니메이션
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = document.body.scrollHeight
    const ctx = canvas.getContext('2d')

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 내 마우스 궤적 그리기
      if (mousePath.length > 1) {
        ctx.strokeStyle = userColor
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.globalAlpha = 0.6

        ctx.beginPath()
        ctx.moveTo(mousePath[0].x, mousePath[0].y)
        for (let i = 1; i < mousePath.length; i++) {
          ctx.lineTo(mousePath[i].x, mousePath[i].y)
        }
        ctx.stroke()
      }

      // 다른 유저 커서 그리기
      Object.entries(otherCursors).forEach(([uid, cursor]) => {
        if (uid !== userId) {
          ctx.fillStyle = cursor.color
          ctx.globalAlpha = 0.8
          ctx.beginPath()
          ctx.arc(cursor.x, cursor.y, 8, 0, Math.PI * 2)
          ctx.fill()

          // 유저 ID 표시
          ctx.font = '10px "D2Coding", monospace'
          ctx.fillText(uid.substring(0, 8), cursor.x + 12, cursor.y + 4)
        }
      })

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mousePath, otherCursors, userId, userColor])

  // 마우스 이동 처리 (자석 기능)
  useEffect(() => {
    if (!userId) return

    const handleMouseMove = (e) => {
      const mouseX = e.clientX
      const mouseY = e.clientY + window.scrollY

      // 가장 가까운 단어 찾기 (자석 효과)
      let closestWord = null
      let minDistance = 80 // 자석 효과 범위 (픽셀)

      wordPositions.forEach((word) => {
        const dx = mouseX - word.x
        const dy = mouseY - word.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance) {
          minDistance = distance
          closestWord = word
        }
      })

      // 자석에 끌리는 위치 계산
      const targetX = closestWord ? closestWord.x : mouseX
      const targetY = closestWord ? closestWord.y : mouseY

      // 궤적 저장 (최근 50개만)
      setMousePath((prev) => {
        const newPath = [...prev, { x: targetX, y: targetY, timestamp: Date.now() }]
        return newPath.slice(-50)
      })

      // Supabase로 커서 위치 전송 (throttle: 50ms)
      const now = Date.now()
      if (!handleMouseMove.lastSent || now - handleMouseMove.lastSent > 50) {
        handleMouseMove.lastSent = now

        supabase
          .from('marionette_cursors')
          .upsert({
            user_id: userId,
            x: targetX,
            y: targetY,
            color: userColor,
            updated_at: new Date().toISOString()
          })
          .then()
          .catch((err) => console.error('Cursor update failed:', err))
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [userId, userColor, wordPositions])

  // 다른 유저 커서 구독
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('cursors')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marionette_cursors' },
        (payload) => {
          if (payload.new && payload.new.user_id !== userId) {
            setOtherCursors((prev) => ({
              ...prev,
              [payload.new.user_id]: {
                x: payload.new.x,
                y: payload.new.y,
                color: payload.new.color
              }
            }))
          }
        }
      )
      .subscribe()

    // 메시지 구독
    const messageChannel = supabase
      .channel('messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'marionette_messages' },
        () => {
          loadMessages()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      messageChannel.unsubscribe()
    }
  }, [userId])

  // 오래된 마우스 궤적 제거
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setMousePath((prev) => prev.filter((p) => now - p.timestamp < 3000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('marionette_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50)

      if (data) {
        setMessages(data.map(msg => ({
          role: msg.role,
          text: msg.text,
          color: msg.color,
          userId: msg.user_id
        })))
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  async function ask() {
    if (!prompt.trim()) return

    setLoading(true)
    const userMessage = {
      role: 'user',
      text: prompt,
      color: userColor,
      userId: userId
    }

    const currentPrompt = prompt
    setPrompt('')

    try {
      // 메시지 저장
      await supabase
        .from('marionette_messages')
        .insert({
          user_id: userId,
          role: 'user',
          text: userMessage.text,
          color: userMessage.color
        })

      // AI 응답 요청
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      })
      const data = await r.json()

      // AI 응답 저장
      await supabase
        .from('marionette_messages')
        .insert({
          user_id: 'ai',
          role: 'ai',
          text: data.text || 'No response',
          color: AI_PINK_BASE
        })
    } catch (error) {
      console.error('Failed to get response:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fff',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Cardo", serif'
    }}>
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

      {/* 독일어 원문 - 위에서 아래로 흐름 */}
      <div ref={containerRef} style={{
        padding: '100px 50px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {KLEIST_TEXT.map((sentence, idx) => (
          <div
            key={idx}
            data-sentence-id={idx}
            style={{
              fontSize: '24px',
              lineHeight: '1.8',
              marginBottom: '60px',
              color: GERMAN_COLORS[idx % GERMAN_COLORS.length],
              fontFamily: '"Cardo", serif',
              animation: `fadeInDown 1s ease-out ${idx * 0.3}s both`
            }}
          >
            {sentence}
          </div>
        ))}

        {/* AI 대화 박스들 - 빈 공간에 배치 */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              position: 'relative',
              backgroundColor: msg.color,
              color: '#fff',
              padding: '20px 30px',
              borderRadius: '12px',
              marginBottom: '40px',
              marginLeft: msg.role === 'user' ? '100px' : '50px',
              maxWidth: '600px',
              fontFamily: msg.role === 'ai' ? '"Noto Serif KR", serif' : '"D2Coding", monospace',
              fontSize: '18px',
              lineHeight: '1.6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              animation: `fadeInUp 0.5s ease-out ${idx * 0.2}s both`
            }}
          >
            <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.8 }}>
              {msg.userId.substring(0, 12)}...
            </div>
            {msg.text}
          </div>
        ))}
      </div>

      {/* AI 입력창 (하단 고정) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: AI_PINK_BASE,
          borderTop: `3px solid ${AI_PINK_BASE}`,
          padding: '20px 30px',
          display: 'flex',
          gap: '15px',
          zIndex: 10001
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
            padding: '15px 20px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'white',
            fontFamily: '"Noto Serif KR", serif'
          }}
        />
        <button
          onClick={ask}
          disabled={loading}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: 'white',
            color: AI_PINK_BASE,
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontFamily: '"Noto Serif KR", serif'
          }}
        >
          {loading ? '처리 중...' : '전송'}
        </button>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default Marionette
