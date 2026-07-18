import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// 클라이스트 독일어 원문 전체 (마침표 기준 분절)
const KLEIST_FULL_TEXT = `Was sag ich, tanzen? Der Kreis ihrer Bewegungen ist zwar beschränkt; doch diejenigen, die ihnen zu Gebote stehen, vollziehen sich mit einer Ruhe, Leichtigkeit und Anmut, die jedes denkende Gemüt in Erstaunen setzen. Ich äußerte, scherzend, daß er ja, auf diese Weise, seinen Mann gefunden habe. Denn derjenige Künstler, der einen so merkwürdigen Schenkel zu bauen imstande sei, würde ihm unzweifelhaft auch eine ganze Marionette, seinen Forderungen gemäß, zusammensetzen können. Wie, fragte ich, da er seinerseits ein wenig betreten zur Erde sah: wie sind denn diese Forderungen, die Sie an die Kunstfertigkeit desselben zu machen gedenken, bestellt? Nichts, antwortete er, was sich nicht auch schon hier fände; Ebenmaß, Beweglichkeit, Leichtigkeit – nur alles in einem höheren Grade; und besonders eine naturgemäßere Anordnung der Schwerpunkte. Und der Vorteil, den diese Puppe vor lebendigen Tänzern voraus haben würde? Der Vorteil? Zuvörderst ein negativer, mein vortrefflicher Freund, nämlich dieser, daß sie sich niemals zierte. Denn Ziererei erscheint, wie Sie wissen, wenn sich die Seele (vis motrix) in irgendeinem andern Punkte befindet, als in dem Schwerpunkt der Bewegung. Da der Maschinist nun schlechthin, vermittelst des Drahtes oder Fadens, keinen andern Punkt in seiner Gewalt hat, als diesen: so sind alle übrigen Glieder, was sie sein sollen, tot, reine Pendel, und folgen dem bloßen Gesetz der Schwere; eine vortreffliche Eigenschaft, die man vergebens bei dem größesten Teil unsrer Tänzer sucht. Sehen Sie nur die P… an, fuhr er fort, wenn sie die Daphne spielt, und sich, verfolgt vom Apoll, nach ihm umsieht; die Seele sitzt ihr in den Wirbeln des Kreuzes; sie beugt sich, als ob sie brechen wollte, wie eine Najade aus der Schule Bernins. Sehen Sie den jungen F… an, wenn er, als Paris, unter den drei Göttinnen steht, und der Venus den Apfel überreicht; die Seele sitzt ihm gar (es ist ein Schrecken, es zu sehen) im Ellenbogen. Solche Mißgriffe, setzte er abbrechend hinzu, sind unvermeidlich, seitdem wir von dem Baum der Erkenntnis gegessen haben. Doch das Paradies ist verriegelt und der Cherub hinter uns; wir müssen die Reise um die Welt machen, und sehen, ob es vielleicht von hinten irgendwo wieder offen ist. Ich lachte. Allerdings, dachte ich, kann der Geist nicht irren, da, wo keiner vorhanden ist. Doch ich bemerkte, daß er noch mehr auf dem Herzen hatte, und bat ihn, fortzufahren. Zudem, sprach er, haben diese Puppen den Vorteil, daß sie antigrav sind. Von der Trägheit der Materie, dieser dem Tanze entgegenstrebendsten aller Eigenschaften, wissen sie nichts: weil die Kraft, die sie in die Lüfte erhebt, größer ist, als jene, die sie an der Erde fesselte. Was würde unsre gute G… darum geben, wenn sie sechzig Pfund leichter wäre, oder ein Gewicht von dieser Größe ihr bei ihren Entrechats und Pirouetten, zu Hülfe käme? Die Puppen brauchen den Boden nur, wie die Elfen, um ihn zu streifen, und den Schwung der Glieder, durch die augenblickliche Hemmung neu zu beleben; wir brauchen ihn, um darauf zu ruhen, und uns von der Anstrengung des Tanzes zu erholen: ein Moment, der offenbar selber kein Tanz ist, und mit dem sich weiter nichts anfangen läßt, als ihn möglichst verschwinden zu machen.`

const KLEIST_SENTENCES = KLEIST_FULL_TEXT
  .split(/([.?!:])\s+/)
  .reduce((acc, part, idx, arr) => {
    if (idx % 2 === 0 && part.trim()) {
      const punctuation = arr[idx + 1] || ''
      acc.push((part + punctuation).trim())
    }
    return acc
  }, [])
  .filter(s => s.length > 10)

const GERMAN_COLORS = ['#3da35d', '#aec5eb', '#dec0f1', '#59594a']
const AI_PINK_BASE = '#dec0f1'
const AI_PINK_VARIATIONS = ['#dec0f1', '#e8c5f0', '#f2d0f5', '#d8b5e8', '#e5c0ee']

function Marionette() {
  console.log('🎭 Marionette component loaded')

  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [userColor, setUserColor] = useState('')
  const [cursorTrail, setCursorTrail] = useState([])
  const [otherCursors, setOtherCursors] = useState([])
  const [guideDots, setGuideDots] = useState([])

  const containerRef = useRef(null)

  // 가이드 점 계산 (모든 단어 끝) - 한번만 계산
  useEffect(() => {
    const timeout = setTimeout(() => {
      const dots = []
      const textElements = document.querySelectorAll('.word-span')
      const rightColumn = document.querySelector('.right-column')
      if (!rightColumn) return

      const columnRect = rightColumn.getBoundingClientRect()

      textElements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        dots.push({
          x: rect.right - columnRect.left,
          y: rect.top - columnRect.top + rect.height / 2,
          word: el.textContent
        })
      })
      setGuideDots(dots)
    }, 100)
    return () => clearTimeout(timeout)
  }, [messages.length])

  // 마우스 추적 및 자석 기능
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rightColumn = document.querySelector('.right-column')
      if (!rightColumn) return

      const columnRect = rightColumn.getBoundingClientRect()
      const mouseX = e.clientX - columnRect.left
      const mouseY = e.clientY - columnRect.top

      let finalX = e.clientX
      let finalY = e.clientY

      // 5px 이내 가이드 점 찾기
      const nearDot = guideDots.find(dot => {
        const dist = Math.sqrt(Math.pow(dot.x - mouseX, 2) + Math.pow(dot.y - mouseY, 2))
        return dist <= 5
      })

      if (nearDot) {
        finalX = nearDot.x + columnRect.left
        finalY = nearDot.y + columnRect.top
      }

      const now = Date.now()

      // 로컬 궤적 업데이트
      setCursorTrail(prev => [
        ...prev.filter(p => now - p.timestamp < 30000), // 30초 유지
        { x: finalX, y: finalY, timestamp: now }
      ])

      // Supabase에 커서 위치 업데이트 (throttle)
      if (userId && now % 100 === 0) { // 100ms마다
        supabase.from('marionette_cursors').upsert({
          user_id: userId,
          x: finalX,
          y: finalY,
          color: userColor,
          updated_at: new Date().toISOString()
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [guideDots, userId, userColor])

  // 다른 사용자 커서 구독
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('cursors')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marionette_cursors',
        filter: `user_id=neq.${userId}`
      }, (payload) => {
        setOtherCursors(prev => {
          const filtered = prev.filter(c => c.user_id !== payload.new.user_id)
          return [...filtered, payload.new]
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  useEffect(() => {
    console.log('🔧 Initializing user ID and color')
    let uid = localStorage.getItem('marionette_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('marionette_user_id', uid)
    }

    const color = AI_PINK_VARIATIONS[Math.floor(Math.random() * AI_PINK_VARIATIONS.length)]
    setUserId(uid)
    setUserColor(color)

    loadMessages()
  }, [])

  async function loadMessages() {
    try {
      const { data } = await supabase
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
      console.error('❌ Failed to load messages:', error)
    }
  }

  async function ask() {
    if (!prompt.trim()) return
    setLoading(true)
    const currentPrompt = prompt
    setPrompt('')

    try {
      await supabase.from('marionette_messages').insert({
        user_id: userId,
        role: 'user',
        text: currentPrompt,
        color: userColor
      })

      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      })
      const data = await r.json()

      await supabase.from('marionette_messages').insert({
        user_id: 'ai',
        role: 'ai',
        text: data.text || 'No response',
        color: AI_PINK_BASE
      })

      loadMessages()
    } catch (error) {
      console.error('❌ Failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#d1d5db',
      fontFamily: '"D2Coding", monospace',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: window.innerWidth >= 768 ? '1fr 1fr' : '1fr',
        gap: '30px',
        border: '1px solid #000'
      }}
      >
        {/* 왼쪽 컬럼 */}
        <div style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRight: '1px solid #000'
        }}>
          {/* 상단 이미지와 메타데이터 */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            {/* 이미지 플레이스홀더 */}
            <div style={{
              width: '96px',
              height: '96px',
              border: '1px solid #000',
              backgroundColor: '#f5f5f5',
              flexShrink: 0
            }} />

            {/* 메타데이터 그리드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '8px 16px',
              fontSize: '10px',
              alignContent: 'start'
            }}>
              <span style={{ fontWeight: 'bold' }}>PROJECT:</span>
              <span>KLEIST / MARIONETTE</span>

              <span style={{ fontWeight: 'bold' }}>DATE:</span>
              <span>{new Date().toLocaleDateString('ko-KR')}</span>

              <span style={{ fontWeight: 'bold' }}>TYPE:</span>
              <span>WEB ART / PERFORMANCE</span>

              <span style={{ fontWeight: 'bold' }}>STATUS:</span>
              <span>LAYER 1/5</span>
            </div>
          </div>

          {/* 설명 텍스트 */}
          <div style={{
            fontSize: '11px',
            lineHeight: '1.8',
            marginBottom: '30px',
            color: '#000',
            textAlign: 'left'
          }}>
            <p style={{ marginBottom: '12px' }}>
              <span style={{ textDecoration: 'underline' }}>ÜBER DAS MARIONETTENTHEATER</span> —
              Heinrich von Kleist, 1810
            </p>
            <p style={{ marginBottom: '12px' }}>
              Q: cubic structure, rigidity and definition.<br/>
              b: base of a cube, built upon it, dynamic system.<br/>
              H: Mercury, fluidity. Mercury is heavy, dense.<br/>
              L: Liquid
            </p>
            <p style={{ textAlign: 'left' }}>
              언어가 끈이야. German text as immutable bricks,
              AI conversations as temporary structures.
              The breath animates the marionette.
            </p>
          </div>

          {/* 다이어그램 영역 */}
          <div style={{
            width: '200px',
            height: '200px',
            margin: '30px 0',
            border: '1px solid #000',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            color: '#00000060'
          }}>
            DIAGRAM / STRUCTURE
          </div>

          {/* 하단 버튼들 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <button style={{
              padding: '6px 14px',
              fontSize: '9px',
              border: '1px solid #000',
              borderRadius: '20px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontFamily: '"D2Coding", monospace'
            }}>
              URL 1: READ
            </button>
            <button style={{
              padding: '6px 14px',
              fontSize: '9px',
              border: '1px solid #000',
              borderRadius: '20px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontFamily: '"D2Coding", monospace'
            }}>
              URL 2: CHAIN
            </button>
            <button style={{
              padding: '6px 14px',
              fontSize: '9px',
              border: '1px solid #000',
              borderRadius: '20px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontFamily: '"D2Coding", monospace'
            }}>
              URL 3: CONTROL
            </button>
          </div>

          {/* AI 입력창 */}
          <div style={{
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px solid #00000020'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && ask()}
                placeholder="INPUT..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '10px',
                  border: '1px solid #000',
                  backgroundColor: '#fff',
                  fontFamily: '"D2Coding", monospace',
                  letterSpacing: '0.03em'
                }}
              />
              <button
                onClick={ask}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  fontSize: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  fontFamily: '"D2Coding", monospace'
                }}
              >
                {loading ? '...' : 'SEND'}
              </button>
            </div>
          </div>
        </div>

        {/* 오른쪽 컬럼 */}
        <div
          className="right-column"
          style={{
            backgroundColor: '#fff',
            padding: '30px',
            position: 'relative'
          }}
        >
          {/* 가이드 점들 */}
          {guideDots.map((dot, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: dot.x - 0.75,
                top: dot.y - 0.75,
                width: '1.5px',
                height: '1.5px',
                backgroundColor: '#ff0000',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 1000
              }}
            />
          ))}

          {/* 내 커서 궤적 */}
          {cursorTrail.map((point, idx) => (
            <div
              key={idx}
              style={{
                position: 'fixed',
                left: point.x - 2,
                top: point.y - 2,
                width: '4px',
                height: '4px',
                backgroundColor: userColor,
                borderRadius: '50%',
                opacity: 0.6,
                pointerEvents: 'none',
                zIndex: 999
              }}
            />
          ))}

          {/* 다른 사용자 커서들 */}
          {otherCursors.map((cursor) => (
            <div
              key={cursor.user_id}
              style={{
                position: 'fixed',
                left: cursor.x - 4,
                top: cursor.y - 4,
                width: '8px',
                height: '8px',
                backgroundColor: cursor.color,
                borderRadius: '50%',
                border: '2px solid #fff',
                pointerEvents: 'none',
                zIndex: 1001
              }}
            />
          ))}

          {/* CCTV 박스 */}
          <div style={{
            width: '100%',
            height: '250px',
            border: '1px solid #000',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: '#00000040',
            marginBottom: '20px'
          }}>
            CCTV STREAM
          </div>

          {/* 텍스트 블록들 - 클라이스트 원문 + AI 대화 섞기 */}
          <div style={{ fontSize: '11px', lineHeight: '1.8', textAlign: 'left' }}>
            {KLEIST_SENTENCES.slice(0, 8).map((sentence, sentenceIdx) => {
              const color = GERMAN_COLORS[sentenceIdx % GERMAN_COLORS.length]
              const words = sentence.split(' ')
              const elements = []

              // AI 메시지를 user-ai 쌍으로 그룹화
              const conversationPairs = []
              for (let i = 0; i < messages.length; i++) {
                if (messages[i].role === 'user' && messages[i + 1]?.role === 'ai') {
                  conversationPairs.push({
                    user: messages[i],
                    ai: messages[i + 1]
                  })
                  i++ // skip next ai message
                }
              }

              words.forEach((word, wIdx) => {
                // 고정된 랜덤 값 사용 (시드 기반)
                const highlightSeed = (sentenceIdx * 1000 + wIdx) % 100
                const shouldHighlight = highlightSeed < 15

                const insertConvSeed = (sentenceIdx * 1000 + wIdx) % 100
                const shouldInsertConv = insertConvSeed < 20 && conversationPairs.length > 0

                // 단어 추가
                elements.push(
                  <span
                    key={`word-${sentenceIdx}-${wIdx}`}
                    className="word-span"
                    style={{
                      backgroundColor: shouldHighlight ? color + '40' : 'transparent',
                      padding: shouldHighlight ? '1px 3px' : '0',
                      position: 'relative'
                    }}
                  >
                    {word}{' '}
                  </span>
                )

                // 고정된 위치에 AI 대화 삽입
                if (shouldInsertConv) {
                  const pairIdx = (sentenceIdx + wIdx) % conversationPairs.length
                  const pair = conversationPairs[pairIdx]
                  const spaceCount = ((sentenceIdx * wIdx) % 5) + 1 // 1~5 공백

                  elements.push(
                    <span key={`space-${sentenceIdx}-${wIdx}`} style={{ display: 'inline-block', width: `${spaceCount * 10}px` }} />
                  )
                  elements.push(
                    <span
                      key={`conv-${sentenceIdx}-${wIdx}`}
                      style={{
                        backgroundColor: pair.user.color + '30',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontFamily: '"Noto Serif KR", serif',
                        fontSize: '10px',
                        marginRight: '4px'
                      }}
                    >
                      {pair.user.text} → {pair.ai.text}
                    </span>
                  )
                }
              })

              return (
                <p key={sentenceIdx} style={{
                  marginBottom: '4px',
                  fontFamily: '"Cardo", serif',
                  textAlign: 'left'
                }}>
                  {elements}
                </p>
              )
            })}
          </div>

        </div>
      </div>

    </div>
  )
}

export default Marionette
