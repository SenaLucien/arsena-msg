import { useState, useEffect, useRef } from "react";

const DB_KEY = "anonmsg_db";

function getDB() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || { users: {}, messages: {} };
  } catch {
    return { users: {}, messages: {} };
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const G = {
  teal: "#7ECAC3",
  amber: "#F5A623",
  pink: "#FFB3C6",
  bg: "#F5F5F0",
  white: "#FFFFFF",
  black: "#111111",
  shadow: "4px 4px 0px #111111",
  shadowHover: "6px 6px 0px #111111",
  shadowSm: "2px 2px 0px #111111",
  radius: "16px",
  border: "2px solid #111111",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: ${G.bg};
    color: ${G.black};
    min-height: 100vh;
  }

  .app {
    max-width: 480px;
    margin: 0 auto;
    padding: 20px 16px 60px;
    min-height: 100vh;
  }

  .logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 22px;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo-dot {
    width: 10px; height: 10px;
    background: ${G.amber};
    border-radius: 50%;
    border: 2px solid ${G.black};
    display: inline-block;
  }

  .card {
    background: ${G.white};
    border: ${G.border};
    border-radius: ${G.radius};
    box-shadow: ${G.shadow};
    padding: 24px;
    margin-bottom: 16px;
  }

  .card-teal { background: ${G.teal}; }
  .card-amber { background: ${G.amber}; }
  .card-pink { background: ${G.pink}; }

  .btn {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 15px;
    border: ${G.border};
    border-radius: 12px;
    box-shadow: ${G.shadow};
    padding: 12px 24px;
    cursor: pointer;
    transition: all 0.1s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: ${G.shadowHover};
  }

  .btn:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  .btn-amber { background: ${G.amber}; color: ${G.black}; }
  .btn-teal  { background: ${G.teal};  color: ${G.black}; }
  .btn-white { background: ${G.white}; color: ${G.black}; }
  .btn-black { background: ${G.black}; color: ${G.white}; }
  .btn-sm { padding: 8px 16px; font-size: 13px; border-radius: 8px; box-shadow: ${G.shadowSm}; }
  .btn-sm:hover { box-shadow: 4px 4px 0 #111; }
  .btn-full { width: 100%; }

  .input {
    width: 100%;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    border: ${G.border};
    border-radius: 12px;
    padding: 12px 16px;
    background: ${G.bg};
    outline: none;
    transition: box-shadow 0.15s;
  }
  .input:focus { box-shadow: ${G.shadow}; background: white; }

  .textarea {
    resize: none;
    min-height: 100px;
  }

  .h1 {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 28px;
    line-height: 1.1;
    letter-spacing: -1px;
  }

  .h2 {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: -0.3px;
  }

  .label {
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    display: block;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
    border-radius: 12px;
    border: ${G.border};
    box-shadow: ${G.shadowSm};
    text-align: center;
  }

  .stat-num {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 28px;
  }

  .stat-label {
    font-size: 12px;
    margin-top: 2px;
    opacity: 0.7;
  }

  .msg-bubble {
    background: white;
    border: ${G.border};
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    box-shadow: ${G.shadowSm};
    padding: 14px 16px;
    margin-bottom: 12px;
    position: relative;
    animation: popIn 0.25s ease;
  }

  @keyframes popIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to   { opacity: 1; transform: none; }
  }

  .msg-text {
    font-size: 15px;
    line-height: 1.5;
    color: #222;
  }

  .msg-meta {
    font-size: 11px;
    color: #888;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .anon-badge {
    background: ${G.teal};
    border: 1.5px solid #111;
    border-radius: 6px;
    padding: 1px 6px;
    font-size: 10px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .avatar {
    width: 72px; height: 72px;
    border-radius: 50%;
    border: ${G.border};
    box-shadow: ${G.shadow};
    object-fit: cover;
    background: ${G.teal};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    cursor: pointer;
    overflow: hidden;
    flex-shrink: 0;
  }

  .avatar img { width: 100%; height: 100%; object-fit: cover; }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #eee;
  }

  .back-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 22px;
    padding: 4px;
    display: flex;
    align-items: center;
  }

  .link-box {
    background: ${G.bg};
    border: ${G.border};
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    word-break: break-all;
  }

  .copy-ok {
    color: green;
    font-size: 12px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
  }

  .tag {
    display: inline-block;
    background: ${G.pink};
    border: 1.5px solid #111;
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #aaa;
  }

  .empty-state .emoji { font-size: 48px; margin-bottom: 12px; }

  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: ${G.black};
    color: white;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 14px;
    padding: 10px 20px;
    border-radius: 40px;
    border: 2px solid white;
    box-shadow: 4px 4px 0 #555;
    z-index: 999;
    animation: toastIn 0.2s ease;
    white-space: nowrap;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .divider {
    border: none;
    border-top: 2px dashed #ddd;
    margin: 20px 0;
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  .profile-info { flex: 1; }

  .new-dot {
    width: 8px; height: 8px;
    background: ${G.amber};
    border-radius: 50%;
    border: 2px solid #111;
    display: inline-block;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

// ─── PAGES ───────────────────────────────────────────────────────────────────

function Toast({ msg }) {
  return <div className="toast">{msg}</div>;
}

// HOME – create or enter username
function HomePage({ onEnter }) {
  const [username, setUsername] = useState("");
  const [err, setErr] = useState("");

  function handleSubmit() {
    const u = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!u || u.length < 3) { setErr("Min 3 karakter, hanya huruf/angka/_"); return; }
    if (u.length > 20) { setErr("Maksimal 20 karakter"); return; }
    onEnter(u);
  }

  return (
    <div className="app">
      <style>{css}</style>
      <nav className="nav">
        <div className="logo"><span className="logo-dot" /> whispr</div>
        <span className="tag">✦ anon</span>
      </nav>

      <div className="card card-teal" style={{ marginBottom: 20 }}>
        <div className="h1" style={{ marginBottom: 8 }}>Terima pesan<br />anonim. 🌊</div>
        <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.6 }}>
          Buat link pribadimu dan biarkan siapa saja kirim pesan tanpa identitas.
        </p>
      </div>

      <div className="card">
        <label className="label">Masukkan username</label>
        <input
          className="input"
          placeholder="contoh: namaKamu"
          value={username}
          onChange={e => { setUsername(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          maxLength={20}
          style={{ marginBottom: err ? 8 : 16 }}
        />
        {err && <p style={{ color: "red", fontSize: 12, marginBottom: 12 }}>{err}</p>}
        <button className="btn btn-amber btn-full" onClick={handleSubmit}>
          ✦ Buat Link Ku
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card card-amber">
          <div className="stat-num">100%</div>
          <div className="stat-label">Anonim</div>
        </div>
        <div className="stat-card card-pink">
          <div className="stat-num">0</div>
          <div className="stat-label">Data Tersimpan</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
          Tidak ada akun. Tidak ada login.<br />Tidak ada pelacakan IP.
        </p>
      </div>
    </div>
  );
}

// DASHBOARD – user's own page
function DashboardPage({ username, onSendPage, onViewInbox, onLogout, showToast }) {
  const db = getDB();
  const user = db.users[username] || {};
  const messages = db.messages[username] || [];
  const newMsgs = messages.filter(m => !m.read).length;
  const [copied, setCopied] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(user.avatar || "");
  const fileRef = useRef();

  const link = `https://arsena-msg.vercel.app/u/${username}`;

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Link disalin! 🎉");
    });
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target.result;
      setAvatarSrc(src);
      const db2 = getDB();
      if (!db2.users[username]) db2.users[username] = {};
      db2.users[username].avatar = src;
      saveDB(db2);
      showToast("Foto profil diperbarui!");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="app">
      <style>{css}</style>
      <nav className="nav">
        <div className="logo"><span className="logo-dot" /> whispr</div>
        <button className="btn btn-white btn-sm" onClick={onLogout}>Keluar</button>
      </nav>

      {/* Profile */}
      <div className="card card-teal">
        <div className="profile-header">
          <div className="avatar" onClick={() => fileRef.current.click()}>
            {avatarSrc ? <img src={avatarSrc} alt="avatar" /> : username[0].toUpperCase()}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          <div className="profile-info">
            <div className="h2">@{username}</div>
            <p style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Ketuk foto untuk ganti PP</p>
          </div>
        </div>
      </div>

      {/* Link */}
      <div className="card">
        <label className="label">Link anonimmu</label>
        <div className="link-box">
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            arsena-msg.vercel.app/u/{username}
          </span>
          <button className="btn btn-amber btn-sm" onClick={copyLink}>
            {copied ? "✓" : "Salin"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card card-amber">
          <div className="stat-num">{messages.length}</div>
          <div className="stat-label">Total Pesan</div>
        </div>
        <div className="stat-card card-pink">
          <div className="stat-num">{newMsgs}</div>
          <div className="stat-label">Belum Dibaca {newMsgs > 0 && <span className="new-dot" />}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button className="btn btn-black" style={{ flex: 1 }} onClick={onViewInbox}>
          📬 Lihat Inbox {newMsgs > 0 && `(${newMsgs})`}
        </button>
        <button className="btn btn-teal btn-sm" onClick={() => onSendPage(username)}>
          Kirim ke diri sendiri
        </button>
      </div>
    </div>
  );
}

// SEND MESSAGE page – public
function SendPage({ username, onBack, showToast }) {
  const db = getDB();
  const user = db.users[username] || {};
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function send() {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const db2 = getDB();
      if (!db2.messages[username]) db2.messages[username] = [];
      db2.messages[username].unshift({ id: genId(), text: text.trim(), ts: Date.now(), read: false });
      saveDB(db2);
      setText("");
      setSent(true);
      setLoading(false);
      showToast("Pesanmu terkirim! 🎉");
    }, 600);
  }

  if (sent) return (
    <div className="app">
      <style>{css}</style>
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>💌</div>
        <div className="h1" style={{ marginBottom: 12 }}>Terkirim!</div>
        <p style={{ color: "#666", marginBottom: 32 }}>Pesanmu sudah sampai ke @{username}</p>
        <button className="btn btn-amber" onClick={() => setSent(false)}>Kirim lagi</button>
        {onBack && <button className="btn btn-white" style={{ marginLeft: 12 }} onClick={onBack}>Kembali</button>}
      </div>
    </div>
  );

  return (
    <div className="app">
      <style>{css}</style>
      <nav className="nav">
        {onBack && <button className="back-btn" onClick={onBack}>←</button>}
        <div className="logo"><span className="logo-dot" /> whispr</div>
        <span className="tag">anon</span>
      </nav>

      <div className="card card-pink" style={{ textAlign: "center" }}>
        <div className="avatar" style={{ margin: "0 auto 12px", background: G.teal }}>
          {user.avatar ? <img src={user.avatar} alt="avatar" /> : username[0].toUpperCase()}
        </div>
        <div className="h2">@{username}</div>
        <p style={{ fontSize: 13, marginTop: 6, opacity: 0.8 }}>
          Kirim pesan anonim, tidak ada yang tahu kamu siapa 👀
        </p>
      </div>

      <div className="card">
        <label className="label">Pesan rahasiamu</label>
        <textarea
          className="input textarea"
          placeholder="Tulis apa saja... tidak ada yang tahu ini dari kamu 🤫"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={500}
        />
        <div style={{ textAlign: "right", fontSize: 11, color: "#aaa", marginBottom: 12 }}>{text.length}/500</div>
        <button className="btn btn-amber btn-full" onClick={send} disabled={!text.trim() || loading}>
          {loading ? "Mengirim..." : "✦ Kirim Anonim"}
        </button>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#888" }}>🔒 Identitasmu 100% terlindungi. IP tidak disimpan.</p>
      </div>
    </div>
  );
}

// INBOX page
function InboxPage({ username, onBack }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const db = getDB();
    const msgs = db.messages[username] || [];
    // Mark all as read
    const db2 = getDB();
    if (db2.messages[username]) {
      db2.messages[username] = db2.messages[username].map(m => ({ ...m, read: true }));
      saveDB(db2);
    }
    setMessages(msgs);
  }, [username]);

  function deleteMsg(id) {
    const db2 = getDB();
    db2.messages[username] = (db2.messages[username] || []).filter(m => m.id !== id);
    saveDB(db2);
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  return (
    <div className="app">
      <style>{css}</style>
      <nav className="nav">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="logo"><span className="logo-dot" /> Inbox</div>
        <span className="tag">{messages.length} pesan</span>
      </nav>

      <div className="card card-amber" style={{ marginBottom: 16 }}>
        <div className="h2">📬 Pesanmu, @{username}</div>
        <p style={{ fontSize: 13, marginTop: 4, opacity: 0.8 }}>
          Semua pesan dari orang-orang misterius.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state card">
          <div className="emoji">🌵</div>
          <p style={{ fontFamily: "Syne", fontWeight: 700 }}>Belum ada pesan</p>
          <p style={{ fontSize: 13, marginTop: 6, color: "#aaa" }}>Bagikan linkmu dan tunggu kejutan!</p>
        </div>
      ) : (
        messages.map(msg => (
          <div className="msg-bubble" key={msg.id}>
            <p className="msg-text">{msg.text}</p>
            <div className="msg-meta">
              <span className="anon-badge">ANON</span>
              <span>{timeAgo(msg.ts)}</span>
              <span style={{ marginLeft: "auto" }}>
                <button
                  onClick={() => deleteMsg(msg.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: 0.5 }}
                  title="Hapus"
                >🗑</button>
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── APP ROUTER ───────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("home");
  const [activeUser, setActiveUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  // Parse hash for public send page
  useEffect(() => {
    function onHash() {
      const hash = window.location.hash;
      const m = hash.match(/^#\/u\/([a-z0-9_]+)$/);
      if (m) {
        setTargetUser(m[1]);
        setPage("send-public");
      }
    }
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function handleEnter(username) {
    const db = getDB();
    if (!db.users[username]) {
      db.users[username] = { createdAt: Date.now() };
      saveDB(db);
    }
    if (!db.messages[username]) {
      db.messages[username] = [];
      saveDB(db);
    }
    setActiveUser(username);
    setPage("dashboard");
  }

  if (page === "send-public" && targetUser) {
    return <>
      <SendPage username={targetUser} onBack={null} showToast={showToast} />
      {toast && <Toast msg={toast} />}
    </>;
  }

  if (page === "home") return <>
    <HomePage onEnter={handleEnter} />
    {toast && <Toast msg={toast} />}
  </>;

  if (page === "dashboard" && activeUser) return <>
    <DashboardPage
      username={activeUser}
      onSendPage={u => { setTargetUser(u); setPage("send-self"); }}
      onViewInbox={() => setPage("inbox")}
      onLogout={() => { setActiveUser(null); setPage("home"); }}
      showToast={showToast}
    />
    {toast && <Toast msg={toast} />}
  </>;

  if (page === "send-self" && targetUser) return <>
    <SendPage username={targetUser} onBack={() => setPage("dashboard")} showToast={showToast} />
    {toast && <Toast msg={toast} />}
  </>;

  if (page === "inbox" && activeUser) return <>
    <InboxPage username={activeUser} onBack={() => setPage("dashboard")} />
    {toast && <Toast msg={toast} />}
  </>;

  return <HomePage onEnter={handleEnter} />;
}
