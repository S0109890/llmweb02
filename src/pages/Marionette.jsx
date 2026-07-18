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
        gridTemplateColumns: '1fr',
        gap: '30px',
        border: '1px solid #000'
      }}
      className="md-grid"
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
            color: '#000'
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
            <p>
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
        <div style={{
          backgroundColor: '#fff',
          padding: '30px'
        }}>
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

          {/* 텍스트 블록들 */}
          <div style={{ fontSize: '11px', lineHeight: '1.8' }}>
            {KLEIST_SENTENCES.slice(0, 8).map((sentence, idx) => {
              const color = GERMAN_COLORS[idx % GERMAN_COLORS.length]
              const words = sentence.split(' ')

              return (
                <p key={idx} style={{
                  marginBottom: '4px',
                  fontFamily: '"Cardo", serif'
                }}>
                  {words.map((word, wIdx) => {
                    const shouldHighlight = Math.random() < 0.15
                    return (
                      <span
                        key={wIdx}
                        style={{
                          backgroundColor: shouldHighlight ? color + '40' : 'transparent',
                          padding: shouldHighlight ? '1px 3px' : '0'
                        }}
                      >
                        {word}{' '}
                      </span>
                    )
                  })}
                </p>
              )
            })}
          </div>

          {/* AI 메시지들 */}
          {messages.length > 0 && (
            <div style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #00000020'
            }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    backgroundColor: msg.role === 'ai' ? msg.color + '20' : '#f5f5f5',
                    fontSize: '10px',
                    lineHeight: '1.6',
                    fontFamily: msg.role === 'ai' ? '"Noto Serif KR", serif' : '"D2Coding", monospace'
                  }}
                >
                  <span style={{ opacity: 0.6, fontSize: '9px' }}>
                    {msg.role === 'ai' ? 'AI' : msg.userId.slice(0, 8)}:
                  </span>
                  {' '}
                  {msg.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .md-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .md-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Marionette
