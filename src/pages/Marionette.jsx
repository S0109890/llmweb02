import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// 클라이스트 독일어 원문 전체 (마침표 기준 분절)
const KLEIST_FULL_TEXT = `Was sag ich, tanzen? Der Kreis ihrer Bewegungen ist zwar beschränkt; doch diejenigen, die ihnen zu Gebote stehen, vollziehen sich mit einer Ruhe, Leichtigkeit und Anmut, die jedes denkende Gemüt in Erstaunen setzen. Ich äußerte, scherzend, daß er ja, auf diese Weise, seinen Mann gefunden habe. Denn derjenige Künstler, der einen so merkwürdigen Schenkel zu bauen imstande sei, würde ihm unzweifelhaft auch eine ganze Marionette, seinen Forderungen gemäß, zusammensetzen können. Wie, fragte ich, da er seinerseits ein wenig betreten zur Erde sah: wie sind denn diese Forderungen, die Sie an die Kunstfertigkeit desselben zu machen gedenken, bestellt? Nichts, antwortete er, was sich nicht auch schon hier fände; Ebenmaß, Beweglichkeit, Leichtigkeit – nur alles in einem höheren Grade; und besonders eine naturgemäßere Anordnung der Schwerpunkte. Und der Vorteil, den diese Puppe vor lebendigen Tänzern voraus haben würde? Der Vorteil? Zuvörderst ein negativer, mein vortrefflicher Freund, nämlich dieser, daß sie sich niemals zierte. Denn Ziererei erscheint, wie Sie wissen, wenn sich die Seele (vis motrix) in irgendeinem andern Punkte befindet, als in dem Schwerpunkt der Bewegung. Da der Maschinist nun schlechthin, vermittelst des Drahtes oder Fadens, keinen andern Punkt in seiner Gewalt hat, als diesen: so sind alle übrigen Glieder, was sie sein sollen, tot, reine Pendel, und folgen dem bloßen Gesetz der Schwere; eine vortreffliche Eigenschaft, die man vergebens bei dem größesten Teil unsrer Tänzer sucht. Sehen Sie nur die P… an, fuhr er fort, wenn sie die Daphne spielt, und sich, verfolgt vom Apoll, nach ihm umsieht; die Seele sitzt ihr in den Wirbeln des Kreuzes; sie beugt sich, als ob sie brechen wollte, wie eine Najade aus der Schule Bernins. Sehen Sie den jungen F… an, wenn er, als Paris, unter den drei Göttinnen steht, und der Venus den Apfel überreicht; die Seele sitzt ihm gar (es ist ein Schrecken, es zu sehen) im Ellenbogen. Solche Mißgriffe, setzte er abbrechend hinzu, sind unvermeidlich, seitdem wir von dem Baum der Erkenntnis gegessen haben. Doch das Paradies ist verriegelt und der Cherub hinter uns; wir müssen die Reise um die Welt machen, und sehen, ob es vielleicht von hinten irgendwo wieder offen ist. Ich lachte. Allerdings, dachte ich, kann der Geist nicht irren, da, wo keiner vorhanden ist. Doch ich bemerkte, daß er noch mehr auf dem Herzen hatte, und bat ihn, fortzufahren. Zudem, sprach er, haben diese Puppen den Vorteil, daß sie antigrav sind. Von der Trägheit der Materie, dieser dem Tanze entgegenstrebendsten aller Eigenschaften, wissen sie nichts: weil die Kraft, die sie in die Lüfte erhebt, größer ist, als jene, die sie an der Erde fesselte. Was würde unsre gute G… darum geben, wenn sie sechzig Pfund leichter wäre, oder ein Gewicht von dieser Größe ihr bei ihren Entrechats und Pirouetten, zu Hülfe käme? Die Puppen brauchen den Boden nur, wie die Elfen, um ihn zu streifen, und den Schwung der Glieder, durch die augenblickliche Hemmung neu zu beleben; wir brauchen ihn, um darauf zu ruhen, und uns von der Anstrengung des Tanzes zu erholen: ein Moment, der offenbar selber kein Tanz ist, und mit dem sich weiter nichts anfangen läßt, als ihn möglichst verschwinden zu machen. Ich sagte, daß, so geschickt er auch die Sache seiner Paradoxe führe, er mich doch nimmermehr glauben machen würde, daß in einem mechanischen Gliedermann mehr Anmut enthalten sein könne, als in dem Bau des menschlichen Körpers. Er versetzte, daß es dem Menschen schlechthin unmöglich wäre, den Gliedermann darin auch nur zu erreichen. Nur ein Gott könne sich, auf diesem Felde, mit der Materie messen; und hier sei der Punkt, wo die beiden Enden der ringförmigen Welt in einander griffen. Ich erstaunte immer mehr, und wußte nicht, was ich zu so sonderbaren Behauptungen sagen sollte. Es scheine, versetzte er, indem er eine Prise Tabak nahm, daß ich das dritte Kapitel vom ersten Buch Moses nicht mit Aufmerksamkeit gelesen; und wer diese erste Periode aller menschlichen Bildung nicht kennt, mit dem könne man nicht füglich über die folgenden, um wie viel weniger über die letzte, sprechen. Ich sagte, daß ich gar wohl wüßte, welche Unordnungen, in der natürlichen Grazie des Menschen, das Bewußtsein anrichtet. Ein junger Mann von meiner Bekanntschaft hätte, durch eine bloße Bemerkung, gleichsam vor meinen Augen, seine Unschuld verloren, und das Paradies derselben, trotz aller ersinnlichen Bemühungen, nachher niemals wieder gefunden. Doch, welche Folgerungen, setzte ich hinzu, können Sie daraus ziehen? Er fragte mich, welch einen Vorfall ich meine? Ich badete mich, erzählte ich, vor etwa drei Jahren, mit einem jungen Mann, über dessen Bildung damals eine wunderbare Anmut verbreitet war. Er mochte ohngefähr in seinem sechszehnten Jahre stehn, und nur ganz von fern ließen sich, von der Gunst der Frauen herbeigerufen, die ersten Spuren von Eitelkeit erblicken. Es traf sich, daß wir grade kurz zuvor in Paris den Jüngling gesehen hatten, der sich einen Splitter aus dem Fuße zieht; der Abguß der Statue ist bekannt und befindet sich in den meisten deutschen Sammlungen. Ein Blick, den er in dem Augenblick, da er den Fuß auf den Schemel setzte, um ihn abzutrocknen, in einen großen Spiegel warf, erinnerte ihn daran; er lächelte und sagte mir, welch eine Entdeckung er gemacht habe. In der Tat hatte ich, in eben diesem Augenblick, dieselbe gemacht; doch sei es, um die Sicherheit der Grazie, die ihm beiwohnte, zu prüfen, sei es, um seiner Eitelkeit ein wenig heilsam zu begegnen: ich lachte und erwiderte – er sähe wohl Geister! Er errötete, und hob den Fuß zum zweitenmal, um es mir zu zeigen; doch der Versuch, wie sich leicht hätte voraussehen lassen, mißglückte. Er hob verwirrt den Fuß zum dritten und vierten, er hob ihn wohl noch zehnmal: umsonst er war außerstande, dieselbe Bewegung wieder hervorzubringen – was sag ich? die Bewegungen, die er machte, hatten ein so komisches Element, daß ich Mühe hatte, das Gelächter zurückzuhalten: Von diesem Tage, gleichsam von diesem Augenblick an, ging eine unbegreifliche Veränderung mit dem jungen Menschen vor. Er fing an, tagelang vor dem Spiegel zu stehen; und immer ein Reiz nach dem anderen verließ ihn. Eine unsichtbare und unbegreifliche Gewalt schien sich, wie ein eisernes Netz, um das freie Spiel seiner Gebärden zu legen, und als ein Jahr verflossen war, war keine Spur mehr von der Lieblichkeit in ihm zu entdecken, die die Augen der Menschen sonst, die ihn umringten, ergötzt hatte. Noch jetzt lebt jemand, der ein Zeuge jenes sonderbaren und unglücklichen Vorfalls war, und ihn, Wort für Wort, wie ich ihn erzählt, bestätigen könnte. Bei dieser Gelegenheit, sagte Herr C… freundlich, muß ich Ihnen eine andere Geschichte erzählen, von der Sie leicht begreifen werden, wie sie hierher gehört. Ich befand mich, auf meiner Reise nach Rußland, auf einem Landgut des Herrn v. G…, eines livländischen Edelmanns, dessen Söhne sich eben damals stark im Fechten übten. Besonders der ältere, der eben von der Universität zurückgekommen war, machte den Virtuosen, und bot mir, da ich eines Morgens auf seinem Zimmer war, ein Rapier an. Wir fochten; doch es traf sich, daß ich ihm überlegen war; Leidenschaft kam dazu, ihn zu verwirren; fast jeder Stoß, den ich führte, traf, und sein Rapier flog zuletzt in den Winkel. Halb scherzend, halb empfindlich, sagte er, indem er das Rapier aufhob, daß er seinen Meister gefunden habe: doch alles auf der Welt finde den seinen, und fortan wolle er mich zu dem meinigen führen. Die Brüder lachten laut auf, und riefen: Fort! fort! In den Holzstall herab! und damit nahmen sie mich bei der Hand und führten mich zu einem Bären, den Herr v. G…, ihr Vater, auf dem Hofe auferziehen ließ. Der Bär stand, als ich erstaunt vor ihn trat, auf den Hinterfüßen, mit dem Rücken an einem Pfahl gelehnt, an welchem er angeschlossen war, die rechte Tatze schlagfertig erhoben, und sah mir ins Auge: das war seine Fechterpositur. Ich wußte nicht, ob ich träumte, da ich mich einem solchen Gegner gegenüber sah; doch: stoßen Sie! stoßen Sie! sagte Herr v. G… und versuchen Sie, ob Sie ihm eins beibringen können! Ich fiel, da ich mich ein wenig von meinem Erstaunen erholt hatte, mit dem Rapier auf ihn aus; der Bär machte eine ganz kurze Bewegung mit der Tatze und parierte den Stoß. Ich versuchte ihn durch Finten zu verführen; der Bär rührte sich nicht. Ich fiel wieder, mit einer augenblicklichen Gewandtheit, auf ihn aus, eines Menschen Brust würde ihn ohnfehlbar getroffen haben: der Bär machte eine ganz kurze Bewegung mit der Tatze und parierte den Stoß. Jetzt war ich fast in dem Fall des jungen Herrn v. G. . Der Ernst des Bären kam hinzu, mir die Fassung zu rauben, Stöße und Finten wechselten sich, mir triefte der Schweiß: umsonst! Nicht bloß, daß der Bär, wie der erste Fechter der Welt, alle meine Stöße parierte; auf Finten (was ihm kein Fechter der Welt nachmacht) ging er gar nicht einmal ein: Aug in Auge, als ob er meine Seele darin lesen könnte, stand er, die Tatze schlagfertig erhoben, und wenn meine Stöße nicht ernsthaft gemeint waren, so rührte er sich nicht. Glauben Sie diese Geschichte? Vollkommen! rief ich, mit freudigem Beifall; jedwedem Fremden, so wahrscheinlich ist sie; um wie viel mehr Ihnen! Nun, mein vortrefflicher Freund, sagte Herr C…, so sind Sie im Besitz von allem, was nötig ist, um mich zu begreifen. Wir sehen, daß in dem Maße, als in der organischen Welt, die Reflexion dunkler und schwächer wird, die Grazie darin immer strahlender und herrschender hervortritt. Doch so, wie sich der Durchschnitt zweier Linien, auf der einen Seite eines Punkts, nach dem Durchgang durch das Unendliche, plötzlich wieder auf der andern Seite einfindet, oder das Bild des Hohlspiegels, nachdem es sich in das Unendliche entfernt hat, plötzlich wieder dicht vor uns tritt: so findet sich auch, wenn die Erkenntnis gleichsam durch ein Unendliches gegangen ist, die Grazie wieder ein; so, daß sie, zu gleicher Zeit, in demjenigen menschlichen Körperbau am reinsten erscheint, der entweder gar keins, oder ein unendliches Bewußtsein hat, d. h. in dem Gliedermann, oder in dem Gott. Mithin, sagte ich ein wenig zerstreut, müßten wir wieder von dem Baum der Erkenntnis essen, um in den Stand der Unschuld zurückzufallen? Allerdings, antwortete er, das ist das letzte Kapitel von der Geschichte der Welt`

// 마침표, 물음표, 느낌표 기준으로 문장 분절
const KLEIST_SENTENCES = KLEIST_FULL_TEXT
  .split(/([.?!:])\s+/)
  .reduce((acc, part, idx, arr) => {
    if (idx % 2 === 0 && part.trim()) {
      const punctuation = arr[idx + 1] || ''
      acc.push((part + punctuation).trim())
    }
    return acc
  }, [])
  .filter(s => s.length > 10) // 너무 짧은 조각 제거

console.log('📝 Total sentences:', KLEIST_SENTENCES.length)

// 4개 색상 (독일어용)
const GERMAN_COLORS = ['#3da35d', '#aec5eb', '#dec0f1', '#59594a']

// AI 대화용 핑크 베리에이션
const AI_PINK_BASE = '#dec0f1'
const AI_PINK_VARIATIONS = [
  '#dec0f1',
  '#e8c5f0',
  '#f2d0f5',
  '#d8b5e8',
  '#e5c0ee'
]

function Marionette() {
  console.log('🎭 Marionette component loaded')

  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [userColor, setUserColor] = useState('')
  const [scrollY, setScrollY] = useState(0)

  const containerRef = useRef(null)

  // 그리드 기반 위치 계산 (10x5 그리드)
  const calculateGridPositions = () => {
    const COLS = 10
    const CELL_WIDTH = window.innerWidth / COLS
    const CELL_HEIGHT = 80 // 셀 높이

    const positions = []
    const totalCells = KLEIST_SENTENCES.length + Math.floor(KLEIST_SENTENCES.length * 0.2) // 20% 빈 공간

    let row = 0
    let col = 0
    let sentenceIdx = 0

    for (let i = 0; i < totalCells; i++) {
      // 20% 확률로 빈 공간 (AI 대화용)
      const isEmpty = Math.random() < 0.15 && sentenceIdx < KLEIST_SENTENCES.length

      if (!isEmpty && sentenceIdx < KLEIST_SENTENCES.length) {
        positions.push({
          id: `sentence-${sentenceIdx}`,
          type: 'text',
          sentence: KLEIST_SENTENCES[sentenceIdx],
          x: col * CELL_WIDTH + 10,
          y: row * CELL_HEIGHT + scrollY,
          color: GERMAN_COLORS[sentenceIdx % GERMAN_COLORS.length],
          sentenceIdx
        })
        sentenceIdx++
      } else if (isEmpty) {
        positions.push({
          id: `empty-${i}`,
          type: 'empty',
          x: col * CELL_WIDTH + 10,
          y: row * CELL_HEIGHT + scrollY,
          sentenceIdx: -1
        })
      }

      col++
      if (col >= COLS) {
        col = 0
        row++
      }
    }

    console.log('📍 Grid positions calculated:', positions.length)
    return positions
  }

  const [textPositions] = useState(calculateGridPositions())

  // 사용자 ID 초기화
  useEffect(() => {
    console.log('🔧 Initializing user ID and color')
    let uid = localStorage.getItem('marionette_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('marionette_user_id', uid)
      console.log('✨ Created new user ID:', uid)
    } else {
      console.log('👤 Loaded existing user ID:', uid)
    }

    const color = AI_PINK_VARIATIONS[Math.floor(Math.random() * AI_PINK_VARIATIONS.length)]
    console.log('🎨 User color:', color)
    setUserId(uid)
    setUserColor(color)

    console.log('📥 Loading messages...')
    loadMessages()
  }, [])

  // 자동 스크롤 (위로 올라가기)
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollY(prev => prev + 0.5) // 천천히 위로 스크롤
    }, 50)

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
        console.log('✅ Loaded messages:', data.length)
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
    const userMessage = {
      role: 'user',
      text: prompt,
      color: userColor,
      userId: userId
    }

    const currentPrompt = prompt
    setPrompt('')

    try {
      console.log('💬 Sending message...')
      await supabase
        .from('marionette_messages')
        .insert({
          user_id: userId,
          role: 'user',
          text: userMessage.text,
          color: userMessage.color
        })

      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt }),
      })
      const data = await r.json()

      await supabase
        .from('marionette_messages')
        .insert({
          user_id: 'ai',
          role: 'ai',
          text: data.text || 'No response',
          color: AI_PINK_BASE
        })

      console.log('✅ Message sent successfully')
      loadMessages()
    } catch (error) {
      console.error('❌ Failed to get response:', error)
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
      {/* 독일어 원문 - 모눈종이 그리드 배치 */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          minHeight: '300vh'
        }}
      >
        {textPositions.map((pos, idx) => {
          if (pos.type === 'empty') {
            // 빈 공간 - AI 메시지가 들어갈 자리
            const aiMsg = messages[idx % messages.length]
            if (!aiMsg) return null

            return (
              <div
                key={pos.id}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y - scrollY,
                  maxWidth: window.innerWidth / 10 - 20,
                  backgroundColor: aiMsg.color,
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  lineHeight: '1.4',
                  fontFamily: aiMsg.role === 'ai' ? '"Noto Serif KR", serif' : '"D2Coding", monospace',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'top 0.1s linear'
                }}
              >
                <div style={{ fontSize: '8px', opacity: 0.7, marginBottom: '4px' }}>
                  {aiMsg.userId.substring(0, 8)}...
                </div>
                {aiMsg.text.substring(0, 80)}...
              </div>
            )
          }

          return (
            <div
              key={pos.id}
              data-sentence-id={pos.sentenceIdx}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y - scrollY,
                maxWidth: window.innerWidth / 10 - 20,
                fontSize: '12px',
                lineHeight: '1.6',
                color: pos.color,
                fontFamily: '"Cardo", serif',
                transition: 'top 0.1s linear',
                opacity: (pos.y - scrollY) > -100 && (pos.y - scrollY) < window.innerHeight + 100 ? 1 : 0.3
              }}
            >
              {pos.sentence}
            </div>
          )
        })}
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
    </div>
  )
}

export default Marionette
