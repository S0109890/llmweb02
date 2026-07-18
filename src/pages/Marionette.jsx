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
  const [scrollY, setScrollY] = useState(0)

  const containerRef = useRef(null)

  // 텍스트 너비 계산
  const measureTextWidth = (text, fontSize = 11) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = `${fontSize}px Cardo, serif`
    return ctx.measureText(text).width + 16
  }

  // 오른쪽 영역 레이아웃 계산
  const calculateRightLayout = () => {
    const positions = []
    const RIGHT_START = window.innerWidth / 2
    const PADDING = 30
    const LINE_HEIGHT = 50

    let currentX = RIGHT_START + PADDING
    let currentY = 80
    let sentenceIdx = 0

    // CCTV 큰 박스 먼저
    positions.push({
      id: 'cctv-main',
      type: 'cctv',
      x: RIGHT_START + PADDING,
      y: currentY,
      width: 400,
      height: 300
    })
    currentY += 320

    // 텍스트 블록들
    while (sentenceIdx < Math.min(KLEIST_SENTENCES.length, 15)) {
      const sentence = KLEIST_SENTENCES[sentenceIdx]
      const textWidth = measureTextWidth(sentence, 11)

      if (currentX + textWidth > window.innerWidth - PADDING) {
        currentX = RIGHT_START + PADDING
        currentY += LINE_HEIGHT
      }

      // 랜덤으로 이미지 박스 삽입
      if (Math.random() < 0.2) {
        const imgWidth = Math.random() * 150 + 100
        const imgHeight = Math.random() * 100 + 60

        if (currentX + imgWidth > window.innerWidth - PADDING) {
          currentX = RIGHT_START + PADDING
          currentY += LINE_HEIGHT
        }

        positions.push({
          id: `img-${sentenceIdx}`,
          type: 'image',
          x: currentX + (Math.random() * 4 - 2),
          y: currentY + (Math.random() * 4 - 2),
          width: imgWidth,
          height: imgHeight
        })
        currentX += imgWidth + 10
      }

      if (currentX + textWidth > window.innerWidth - PADDING) {
        currentX = RIGHT_START + PADDING
        currentY += LINE_HEIGHT
      }

      const color = GERMAN_COLORS[sentenceIdx % GERMAN_COLORS.length]
      positions.push({
        id: `text-${sentenceIdx}`,
        type: 'text',
        sentence: sentence,
        x: currentX + (Math.random() * 4 - 2),
        y: currentY + (Math.random() * 4 - 2),
        width: textWidth,
        color: color,
        bgColor: color + '20', // 20% opacity
        sentenceIdx
      })

      currentX += textWidth + 8
      sentenceIdx++
    }

    return positions
  }

  const [rightLayout] = useState(calculateRightLayout())

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

  // 자동 스크롤
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollY(prev => prev + 0.5)
    }, 50)
    return () => clearInterval(interval)
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
      backgroundColor: '#f5f5f5',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Cardo", serif',
      display: 'flex'
    }}>
      {/* 왼쪽 영역 */}
      <div style={{
        width: '50%',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '30px'
      }}>
        {/* 왼쪽 위 타이틀 영역 */}
        <div style={{ marginBottom: 'auto' }}>
          <div style={{
            fontSize: '14px',
            fontFamily: '"D2Coding", monospace',
            marginBottom: '15px',
            letterSpacing: '0.5px',
            color: '#000'
          }}>
            <div>KLEIST / MARIONETTE</div>
            <div style={{ marginTop: '5px', fontSize: '11px', opacity: 0.6 }}>
              ÜBER DAS MARIONETTENTHEATER
            </div>
            <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.5 }}>
              {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>

          <div style={{
            marginTop: '20px',
            fontSize: '10px',
            lineHeight: '1.6',
            color: '#000',
            opacity: 0.7,
            maxWidth: '400px'
          }}>
            Q: cubic structure, rigidity and definition.<br/>
            b: base of a cube, built upon it, dynamic system.<br/>
            H: Mercury, fluidity. Mercury is heavy, dense.<br/>
            L: Liquid
          </div>
        </div>

        {/* 왼쪽 아래 AI 입력창 */}
        <div style={{
          marginTop: 'auto',
          width: '100%',
          maxWidth: '450px'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
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
                fontFamily: '"D2Coding", monospace',
                letterSpacing: '0.5px'
              }}
            >
              {loading ? '...' : 'SEND'}
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽 영역 - 스크롤 컨텐츠 */}
      <div
        ref={containerRef}
        style={{
          width: '50%',
          marginLeft: '50%',
          minHeight: '200vh',
          position: 'relative'
        }}
      >
        {rightLayout.map((item) => {
          if (item.type === 'cctv') {
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: item.x - window.innerWidth / 2,
                  top: item.y - scrollY,
                  width: item.width,
                  height: item.height,
                  border: '1px solid #000',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontFamily: '"D2Coding", monospace',
                  color: '#00000040',
                  transition: 'top 0.1s linear'
                }}
              >
                CCTV STREAM
              </div>
            )
          }

          if (item.type === 'image') {
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: item.x - window.innerWidth / 2,
                  top: item.y - scrollY,
                  width: item.width,
                  height: item.height,
                  border: '1px solid #00000020',
                  backgroundColor: '#fff',
                  transition: 'top 0.1s linear'
                }}
              />
            )
          }

          if (item.type === 'text') {
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: item.x - window.innerWidth / 2,
                  top: item.y - scrollY,
                  fontSize: '11px',
                  lineHeight: '1.4',
                  color: '#000',
                  fontFamily: '"Cardo", serif',
                  transition: 'top 0.1s linear',
                  whiteSpace: 'nowrap',
                  padding: '3px 6px',
                  backgroundColor: item.bgColor,
                  letterSpacing: '0.01em'
                }}
              >
                {item.sentence}
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}

export default Marionette
