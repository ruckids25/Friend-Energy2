import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ============================================================
// OYOSHI: Tag Your Good Energy Friend — Interactive Prototype
// ============================================================
// NOTE: This is a DEMO PROTOTYPE for presentation purposes only.
// It does not connect to Facebook or any external API.
// All interactions are simulated with local state.
// ============================================================

// --- Mock Data & Constants ---

const PERSONALITY_TYPES = [
  { type: "THE HYPE FRIEND", desc: "คนที่พร้อมเติมไฟให้คุณเสมอ", emoji: "🔥" },
  { type: "THE COMFORT FRIEND", desc: "ไม่ต้องพูดเยอะก็เข้าใจกัน", emoji: "🤗" },
  { type: "THE CHAOS FRIEND", desc: "อยู่ด้วยกันทีไร ไม่มีคำว่าสงบ", emoji: "🤪" },
  { type: "THE ADVENTURE FRIEND", desc: "คนที่พร้อมไปทุกที่ด้วยกัน", emoji: "🏔️" },
];

const MOCK_THAI_NAMES = [
  "น้องมิว", "พี่เจน", "เบนซ์", "แพรว", "กิ๊ฟ", "มายด์", "เอิร์ธ",
  "ฟลุ๊ค", "เฟิร์น", "ต้น", "ออม", "นัท", "มิ้นท์", "บีม", "ไอซ์",
  "พลอย", "แนน", "เจมส์", "โอ๊ค", "ปอ", "ก้อง", "แบม", "มุก",
];

const MOCK_COMMENTS = [
  { name: "Pim Pracha", text: "@มิ้นท์ เพื่อนตัวดีของฉัน! 💛" },
  { name: "Nong Beam", text: "@พี่เจน คนนี้เลย Good Energy ตลอด ⚡" },
  { name: "Fern K.", text: "@ต้น best friend forever 🌟" },
  { name: "James W.", text: "@แพรว Tag ไว้เลยย ✨" },
  { name: "Ploy S.", text: "@เอิร์ธ เพื่อนรักจัดไป ❤️" },
  { name: "Mint C.", text: "@บีม hype friend ตัวจริง! 🔥" },
  { name: "Oat P.", text: "@ออม ขาดเธอไม่ได้ 🥰" },
  { name: "Benz T.", text: "@นัท Good Energy สุดๆ ⚡💛" },
  { name: "Aom N.", text: "@ก้อง comfort friend ที่สุด 🤗" },
  { name: "Gift R.", text: "@มุก chaos friend 100% 🤪🎉" },
];

// Generates a random "profile picture" color
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
}

function getInitials(name) {
  return name.charAt(0).toUpperCase();
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// --- Avatar Component ---
function Avatar({ name, size = 40 }) {
  const bg = getAvatarColor(name);
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        minWidth: size,
        backgroundColor: bg,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.4,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// --- Simulated Facebook Post Header ---
function PostHeader() {
  return (
    <div className="post-header">
      <div className="post-header-avatar">
        <img
          src="https://placehold.co/44x44/ff6b35/white?text=OY"
          alt="OYOSHI"
          className="brand-avatar"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="brand-avatar-fallback" style={{ display: 'none' }}>OY</div>
      </div>
      <div className="post-header-info">
        <div className="post-header-name">
          OYOSHI Thailand
          <svg className="verified-badge" viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 2L14.09 4.26L17 3.6L17.34 6.54L20 8L18.82 10.74L20 13.46L17.34 14.92L17 17.86L14.09 17.2L12 19.46L9.91 17.2L7 17.86L6.66 14.92L4 13.46L5.18 10.74L4 8L6.66 6.54L7 3.6L9.91 4.26L12 2Z" fill="#1877F2"/>
            <path d="M10 14.5L7.5 12L8.91 10.59L10 11.67L15.09 6.59L16.5 8L10 14.5Z" fill="white"/>
          </svg>
        </div>
        <div className="post-header-meta">
          Sponsored · <svg viewBox="0 0 16 16" width="12" height="12" style={{display:'inline', verticalAlign:'middle'}}><path d="M8 0a8 8 0 110 16A8 8 0 018 0zm0 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 2a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" fill="#65676B"/></svg>
        </div>
      </div>
      <div className="post-header-dots">•••</div>
    </div>
  );
}

// --- Post Content ---
function PostContent() {
  return (
    <div className="post-content">
      <div className="post-image">
        <div className="post-image-inner">
          <div className="energy-orb"></div>
          <div className="energy-orb orb-2"></div>
          <div className="energy-orb orb-3"></div>
          <div className="post-image-text">
            <span className="zap-icon">⚡</span>
            <h2>TAG YOUR<br/>GOOD ENERGY<br/>FRIEND</h2>
            <p className="post-image-subtitle">Tag เพื่อนที่ทำให้ชีวิตคุณมี Good Energy</p>
            <div className="oyoshi-badge">OYOSHI</div>
          </div>
        </div>
      </div>
      <div className="post-caption">
        <span className="caption-bold">OYOSHI Thailand</span>{' '}
        ใครคือ Good Energy Friend ของคุณ? ⚡💛 Tag เพื่อนที่ทำให้ชีวิตคุณสดใสขึ้น แล้วมาดูกันว่าเพื่อนคุณเป็น Friend Type ไหน!
        <span className="hashtags"> #OYOSHI #GoodEnergy #TagYourFriend</span>
      </div>
    </div>
  );
}

// --- Reaction Bar ---
function ReactionBar({ participantCount }) {
  return (
    <div className="reaction-bar">
      <div className="reaction-icons">
        <span className="reaction-emoji r1">❤️</span>
        <span className="reaction-emoji r2">😆</span>
        <span className="reaction-emoji r3">👍</span>
        <span className="reaction-count">{participantCount.toLocaleString()}</span>
      </div>
      <div className="reaction-actions">
        <span>💬 {Math.floor(participantCount * 0.6)} Comments</span>
        <span>↗️ {Math.floor(participantCount * 0.3)} Shares</span>
      </div>
    </div>
  );
}

// --- Action Bar (Like, Comment, Share) ---
function ActionBar() {
  return (
    <div className="action-bar">
      <button className="action-btn">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M2 21L4.46 14.46C3.53 12.85 3 11.01 3 9.07 3 4.6 6.58 1 11.03 1c4.45 0 8.06 3.6 8.06 8.07 0 4.46-3.61 8.07-8.06 8.07-1.44 0-2.79-.38-3.97-1.04L2 21z" fill="none" stroke="#65676B" strokeWidth="1.5"/></svg>
        Like
      </button>
      <button className="action-btn">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M2 21L4.46 14.46C3.53 12.85 3 11.01 3 9.07 3 4.6 6.58 1 11.03 1c4.45 0 8.06 3.6 8.06 8.07 0 4.46-3.61 8.07-8.06 8.07-1.44 0-2.79-.38-3.97-1.04L2 21z" fill="none" stroke="#65676B" strokeWidth="1.5"/></svg>
        Comment
      </button>
      <button className="action-btn">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 12l-7 7v-4C7 15 4 18 2 22c0-8 3-14 12-14V4l7 8z" fill="none" stroke="#65676B" strokeWidth="1.5"/></svg>
        Share
      </button>
    </div>
  );
}

// --- Live Comment Feed (Social Proof) ---
function LiveCommentFeed({ comments }) {
  return (
    <div className="live-comments">
      {comments.map((c, i) => (
        <div key={i} className="live-comment" style={{ animationDelay: `${i * 0.1}s` }}>
          <Avatar name={c.name} size={32} />
          <div className="live-comment-bubble">
            <span className="live-comment-name">{c.name}</span>
            <span className="live-comment-text">{c.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Comment Input Box ---
function CommentInput({ value, onChange, onSubmit, disabled }) {
  return (
    <div className="comment-input-area">
      <Avatar name="You" size={32} />
      <form onSubmit={onSubmit} className="comment-form">
        <input
          type="text"
          className="comment-input"
          placeholder="Tag เพื่อนของคุณ เช่น @มิ้นท์"
          value={value}
          onChange={onChange}
          disabled={disabled}
          maxLength={30}
        />
        <button
          type="submit"
          className="comment-submit"
          disabled={!value.trim() || disabled}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill={value.trim() ? '#FF6B35' : '#BCC0C4'}/>
          </svg>
        </button>
      </form>
    </div>
  );
}

// --- Reveal Animation Overlay ---
function RevealAnimation({ phase, friendName, scrambleNames }) {
  const messages = [
    "ANALYZING YOUR FRIENDSHIP...",
    "SCANNING YOUR GOOD ENERGY...",
    "FINDING YOUR PERSON...",
  ];

  return (
    <div className="reveal-overlay">
      <div className="reveal-content">
        {phase <= 2 && (
          <div className="reveal-message" key={phase}>
            <div className="scan-ring"></div>
            <p className="reveal-text">{messages[phase]}</p>
            <div className="scan-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        {phase === 3 && (
          <div className="name-scramble">
            <div className="scramble-label">⚡ MATCHING...</div>
            <div className="scramble-name">{scrambleNames}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Reveal Card (Result) ---
function RevealCard({ friendName, personality, score, scoreAnimated, onSend, onReplay, sent }) {
  return (
    <div className="reveal-card-wrapper">
      <div className="reveal-card">
        <div className="card-glow"></div>
        <div className="card-header">
          <span className="card-zap">⚡</span>
          <h3 className="card-title">YOUR GOOD ENERGY FRIEND</h3>
        </div>

        <div className="card-friend-name-area">
          <div className="card-friend-avatar">
            <Avatar name={friendName} size={64} />
            <div className="avatar-ring"></div>
          </div>
          <h2 className="card-friend-name">{friendName}</h2>
        </div>

        <div className="card-personality">
          <span className="personality-emoji">{personality.emoji}</span>
          <h4 className="personality-type">{personality.type}</h4>
          <p className="personality-desc">{personality.desc}</p>
        </div>

        <div className="card-score">
          <div className="score-label">GOOD ENERGY SCORE</div>
          <div className="score-value">
            <span className="score-number">{scoreAnimated}</span>
            <span className="score-percent">%</span>
          </div>
          <div className="score-bar-bg">
            <div
              className="score-bar-fill"
              style={{ width: `${scoreAnimated}%` }}
            ></div>
          </div>
        </div>

        <div className="card-oyoshi-footer">
          <span className="footer-powered">Powered by</span>
          <span className="footer-brand">OYOSHI ⚡</span>
        </div>
      </div>

      <div className="card-actions">
        {!sent ? (
          <button className="btn-send" onClick={onSend}>
            <span>🎁</span> SEND OYOSHI TO {friendName.toUpperCase()}
          </button>
        ) : (
          <div className="sent-confirmation">
            <div className="sent-check">✓</div>
            <p>ส่ง OYOSHI ให้ {friendName} แล้ว!</p>
            <p className="sent-sub">เพื่อนของคุณจะได้รับ Good Energy เร็ว ๆ นี้ 💛</p>
            {/* TODO: Replace with real product delivery / coupon API call */}
          </div>
        )}
        <button className="btn-replay" onClick={onReplay}>
          🔄 TAG ANOTHER FRIEND
        </button>
      </div>
    </div>
  );
}

// --- Social Proof Counter ---
function SocialProofCounter({ count }) {
  return (
    <div className="social-proof">
      <div className="social-proof-dot"></div>
      <span>🌟 <strong>{count.toLocaleString()}</strong> people found their Good Energy Friend today</span>
    </div>
  );
}

// ============================================================
// MAIN APP COMPONENT
// ============================================================

export default function App() {
  // --- State ---
  const [friendName, setFriendName] = useState('');
  const [phase, setPhase] = useState('idle');
  // phases: idle | reveal-0 | reveal-1 | reveal-2 | reveal-3 | result
  const [personality, setPersonality] = useState(null);
  const [score, setScore] = useState(0);
  const [scoreAnimated, setScoreAnimated] = useState(0);
  const [scrambleName, setScrambleName] = useState('');
  const [sent, setSent] = useState(false);
  const [liveComments] = useState(MOCK_COMMENTS.slice(0, 5));
  const [participantCount, setParticipantCount] = useState(247);
  const [submittedName, setSubmittedName] = useState('');

  const timeoutsRef = useRef([]);
  const scrambleIntervalRef = useRef(null);


  // --- Clear all timeouts ---
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (scrambleIntervalRef.current) {
      clearInterval(scrambleIntervalRef.current);
      scrambleIntervalRef.current = null;
    }
  }, []);



  // --- Social Proof Counter ---
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipantCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // --- Score Animation ---
  useEffect(() => {
    if (phase === 'result' && scoreAnimated < score) {
      const step = Math.max(1, Math.floor((score - scoreAnimated) / 10));
      const timer = setTimeout(() => {
        setScoreAnimated(prev => Math.min(prev + step, score));
      }, 15);
      return () => clearTimeout(timer);
    }
  }, [phase, scoreAnimated, score]);

  // --- Handle Submit ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const name = friendName.trim().replace(/^@/, '');
    if (!name) return;

    setSubmittedName(name);
    setSent(false);

    // TODO: Replace with real Facebook Graph API call to validate tag
    // In real system: POST /api/tag { userId, taggedFriendName }

    // Pick random personality & score
    const p = PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)];
    const s = Math.floor(Math.random() * 15) + 85; // 85-99

    setPersonality(p);
    setScore(s);
    setScoreAnimated(0);

    // Start reveal sequence
    clearAllTimeouts();

    setPhase('reveal-0');

    const t1 = setTimeout(() => setPhase('reveal-1'), 900);
    const t2 = setTimeout(() => setPhase('reveal-2'), 1800);
    const t3 = setTimeout(() => {
      setPhase('reveal-3');
      // Start name scramble
      let count = 0;
      scrambleIntervalRef.current = setInterval(() => {
        const randName = MOCK_THAI_NAMES[Math.floor(Math.random() * MOCK_THAI_NAMES.length)];
        setScrambleName(randName);
        count++;
        if (count > 12) {
          // Slow down
          clearInterval(scrambleIntervalRef.current);
          scrambleIntervalRef.current = setInterval(() => {
            const randName2 = MOCK_THAI_NAMES[Math.floor(Math.random() * MOCK_THAI_NAMES.length)];
            setScrambleName(randName2);
            count++;
            if (count > 16) {
              clearInterval(scrambleIntervalRef.current);
              setScrambleName(name);
              setTimeout(() => setPhase('result'), 500);
            }
          }, 250);
        }
      }, 80);
    }, 2700);

    timeoutsRef.current = [t1, t2, t3];
  };

  // --- Handle Send ---
  const handleSend = () => {
    setSent(true);
    // TODO: Replace with real API call to send OYOSHI product/coupon to tagged friend
    // In real system: POST /api/send-oyoshi { userId, friendId, personalityType }
  };

  // --- Handle Replay ---
  const handleReplay = () => {
    clearAllTimeouts();
    setPhase('idle');
    setFriendName('');
    setSubmittedName('');
    setSent(false);
    setScoreAnimated(0);
  };

  const isRevealing = phase.startsWith('reveal');
  const revealPhaseNum = isRevealing ? parseInt(phase.split('-')[1]) : -1;

  return (
    <div className="app-wrapper">
      <div className="phone-frame">
        {/* Social Proof */}
        <SocialProofCounter count={participantCount} />

        {/* Facebook Post */}
        <div className="fb-post">
          <PostHeader />
          <PostContent />
          <ReactionBar participantCount={participantCount} />
          <ActionBar />

          {/* Live Comment Feed */}
          {/* TODO: In real system, fetch real comments from Facebook Graph API */}
          {/* GET /{post-id}/comments */}
          <LiveCommentFeed comments={liveComments} />

          {/* Comment Input */}
          {phase === 'idle' && (
            <CommentInput
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              onSubmit={handleSubmit}
              disabled={isRevealing}
            />
          )}
        </div>

        {/* Reveal Animation Overlay */}
        {isRevealing && (
          <RevealAnimation
            phase={revealPhaseNum}
            friendName={submittedName}
            scrambleNames={scrambleName}
          />
        )}

        {/* Result Card */}
        {phase === 'result' && personality && (
          <RevealCard
            friendName={submittedName}
            personality={personality}
            score={score}
            scoreAnimated={scoreAnimated}
            onSend={handleSend}
            onReplay={handleReplay}
            sent={sent}
          />
        )}
      </div>

      {/* Prototype Disclaimer */}
      <div className="disclaimer">
        ⚠️ PROTOTYPE ONLY — Demo Experience สำหรับพรีเซนต์ ไม่ได้เชื่อมต่อ Facebook จริง
      </div>
    </div>
  );
}
