import { useState, useEffect, useCallback, useRef } from "react";

const WEBHOOK_URL = "https://voodoohr.app.n8n.cloud/webhook/nps-response";

const TEAMS = [
  { id: "ua", name: "User Acquisition", group: "Growth" },
  { id: "crea", name: "Creative", group: "Growth" },
  { id: "admonet", name: "Ad Monetization", group: "Growth" },
  { id: "infra", name: "Infrastructure", subtitle: "Building & maintaining our AWS infrastructure", group: "E&D" },
  { id: "centraldata", name: "Central Data", subtitle: "Data Core, VAN — Voodoo Analytics", group: "E&D" },
  { id: "databi", name: "Data & BI for UA", subtitle: "Bidding strategy, LTV prediction", group: "E&D" },
  { id: "tune", name: "Voodoo Tune", subtitle: "A/B testing, Segmentation", group: "E&D" },
  { id: "sauce", name: "Voodoo Sauce", group: "E&D" },
  { id: "gamingtech", name: "Gaming Tech", group: "E&D" },
  { id: "finance", name: "Finance", group: "Corporate" },
  { id: "legal", name: "Legal", group: "Corporate" },
  { id: "ta", name: "Talent Acquisition", group: "Corporate" },
  { id: "hr", name: "HR Management", group: "Corporate" },
  { id: "it", name: "IT", group: "Corporate" },
  { id: "workplace", name: "Workplace", group: "Corporate" },
  { id: "events", name: "Events", group: "Corporate" },
];

const BU_OPTIONS = ["Growth", "E&D", "Corporate", "Gaming", "Consumer Apps", "CEO Staff"];
const DEFAULT_FB = "N/A — no specific feedback";
const getNPSType = (s) => s <= 6 ? "detractor" : s <= 8 ? "passive" : "promoter";
const getNPSLabel = (s) => s <= 6 ? "Detractor" : s <= 8 ? "Passive" : "Promoter";

const AnimatedVLogo = ({ size = 120 }) => {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 300); return () => clearTimeout(t); }, []);
  return (
    <div style={{ width: size, height: size, margin: "0 auto", position: "relative" }}>
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" rx="24" fill="#000" />
        <path d="M36 30L60 90L84 30" stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 160, strokeDashoffset: drawn ? 0 : 160, transition: "stroke-dashoffset 1.2s cubic-bezier(0.65,0,0.35,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: -8, borderRadius: 32, border: "2px solid rgba(0,0,0,0.06)", opacity: drawn ? 1 : 0, transition: "opacity 0.6s 0.8s" }} />
    </div>
  );
};

const CelebBurst = ({ show }) => {
  if (!show) return null;
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const dist = 30 + Math.random() * 30;
    const x = Math.cos(angle * Math.PI / 180) * dist;
    const y = Math.sin(angle * Math.PI / 180) * dist;
    const s = 3 + Math.random() * 4;
    return (<div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: s, height: s, borderRadius: "50%", background: i % 3 === 0 ? "#000" : i % 3 === 1 ? "#666" : "#CCC", transform: `translate(${x}px, ${y}px) scale(0)`, animation: `burstP 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 25}ms forwards` }} />);
  });
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 200 }}>
      <style>{`@keyframes burstP { 0% { transform:scale(0); opacity:1 } 50% { opacity:1 } 100% { transform:scale(1); opacity:0 } }
        @keyframes checkDraw { to { stroke-dashoffset:0 } }
        @keyframes fadeScale { 0% { opacity:0; transform:scale(0.8) } 100% { opacity:1; transform:scale(1) } }
        @keyframes pulseRing { 0% { transform:scale(1); opacity:0.4 } 100% { transform:scale(1.6); opacity:0 } }
        @keyframes floatIn { 0% { opacity:0; transform:translateY(20px) } 100% { opacity:1; transform:translateY(0) } }
        @keyframes confetti { 0% { transform:translateY(0) rotate(0deg); opacity:1 } 100% { transform:translateY(120px) rotate(720deg); opacity:0 } }`}
      </style>
      <div style={{ position: "relative" }}>
        {particles}
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: "fadeScale 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <circle cx="24" cy="24" r="22" fill="#000" />
          <path d="M14 24L21 31L34 17" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "checkDraw 0.4s 0.2s forwards" }} />
        </svg>
      </div>
    </div>
  );
};

const ProgressRing = ({ current, total }) => {
  const pct = current / total;
  const r = 14, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "fixed", top: 16, right: 20, zIndex: 100, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, color: "#BBB", fontWeight: 500 }}>{Math.round(pct * 100)}%</span>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#F0F0F0" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
      </svg>
    </div>
  );
};

const ProgressBar = ({ current, total }) => (
  <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 101, height: 3, background: "#F0F0F0" }}>
    <div style={{ height: "100%", background: "#000", width: `${(current / total) * 100}%`, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
  </div>
);

const Slide = ({ children, dir }) => {
  const [v, setV] = useState(false);
  useEffect(() => { setV(false); const t = setTimeout(() => setV(true), 20); return () => clearTimeout(t); }, []);
  return (
    <div style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0) scale(1)" : `translateY(${dir === "back" ? "-16px" : "16px"}) scale(0.99)`, transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)", width: "100%", maxWidth: 600, margin: "0 auto" }}>{children}</div>
  );
};

const Qnum = ({ n, total }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: "#BBB", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{n} / {total}</div>
);

const Tag = ({ group }) => (
  <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#000", color: "#fff", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>{group}</span>
);

const Btn = ({ children, onClick, variant = "primary", disabled, style: s }) => {
  const [hover, setHover] = useState(false);
  const base = { padding: "14px 32px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: disabled ? "default" : "pointer", border: "none", transition: "all 0.2s", opacity: disabled ? 0.3 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" };
  const primary = { ...base, background: hover && !disabled ? "#222" : "#000", color: "#fff", transform: hover && !disabled ? "translateY(-1px)" : "none", boxShadow: hover && !disabled ? "0 4px 16px rgba(0,0,0,0.15)" : "none" };
  const ghost = { ...base, background: hover ? "#EAEAEA" : "#F3F3F3", color: "#000" };
  const st = variant === "primary" ? primary : ghost;
  return <button style={{ ...st, ...s }} onClick={disabled ? undefined : onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>{children}</button>;
};

const Key = ({ label }) => (
  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginLeft: 4 }}>
    <kbd style={{ background: "rgba(255,255,255,0.15)", borderRadius: 3, padding: "1px 5px", fontSize: 10, fontFamily: "monospace" }}>{label}</kbd>
  </span>
);

const Badge = ({ name, bu }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#FAFAFA", borderRadius: 12, border: "1px solid #F0F0F0", marginBottom: 24 }}>
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
      {name.split(" ").map(w => w[0]).join("").slice(0, 2)}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#000" }}>{name}</div>
      <div style={{ fontSize: 11, color: "#999" }}>{bu} · Not anonymous</div>
    </div>
  </div>
);

const BackBtn = ({ onClick, show }) => {
  const [h, setH] = useState(false);
  if (!show) return null;
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: "fixed", top: 14, left: 16, zIndex: 102, display: "flex", alignItems: "center", gap: 5, background: h ? "#F3F3F3" : "transparent", border: "none", borderRadius: 10, padding: "8px 14px 8px 10px", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#999" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
      Back
    </button>
  );
};

const NPSScale = ({ value, onSelect }) => {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;
  return (
    <div>
      <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
        {[...Array(11)].map((_, i) => {
          const active = value === i;
          const isHov = hovered === i;
          const t = getNPSType(i);
          const bg = active ? "#000" : isHov ? (t === "promoter" ? "#E8F5E9" : t === "passive" ? "#FFF8E1" : "#FFEBEE") : "#fff";
          const border = active ? "#000" : isHov ? (t === "promoter" ? "#66BB6A" : t === "passive" ? "#FFB300" : "#EF5350") : "#E5E5E5";
          const color = active ? "#fff" : "#000";
          return (
            <button key={i} onClick={() => onSelect(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{ width: 47, height: 47, borderRadius: 12, border: `${active ? 2 : 1}px solid ${border}`, background: bg, color, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)", transform: active ? "scale(1.15)" : isHov ? "scale(1.08) translateY(-2px)" : "scale(1)", boxShadow: active ? "0 4px 16px rgba(0,0,0,0.2)" : isHov ? "0 2px 8px rgba(0,0,0,0.08)" : "none", fontFamily: "inherit", position: "relative" }}>
              {i}
              {active && <div style={{ position: "absolute", inset: -6, borderRadius: 16, border: "2px solid rgba(0,0,0,0.1)", animation: "pulseRing 1s ease-out" }} />}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px" }}>
        <span style={{ fontSize: 10, color: "#CCC", fontWeight: 500 }}>Very poor</span>
        {display !== null && display !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 700, animation: "fadeScale 0.3s ease", color: getNPSType(display) === "promoter" ? "#2E7D32" : getNPSType(display) === "passive" ? "#F57F17" : "#C62828" }}>
            {display}/10 · {getNPSLabel(display)}
          </span>
        )}
        <span style={{ fontSize: 10, color: "#CCC", fontWeight: 500 }}>Excellent</span>
      </div>
    </div>
  );
};

const FBField = ({ icon, label, hint, teamId, fieldKey, feedbackRef }) => {
  const ref = useRef(null);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 24, height: 24, borderRadius: 7, background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>{label}</span>
        <span style={{ fontSize: 10, color: "#CCC" }}>required</span>
      </div>
      <textarea ref={ref}
        defaultValue={feedbackRef.current[teamId]?.[fieldKey] ?? DEFAULT_FB}
        onChange={e => { feedbackRef.current[teamId] = { ...feedbackRef.current[teamId], [fieldKey]: e.target.value }; }}
        onFocus={e => { if (e.target.value === DEFAULT_FB) { e.target.value = ""; feedbackRef.current[teamId] = { ...feedbackRef.current[teamId], [fieldKey]: "" }; } e.target.style.borderColor = "#000"; e.target.style.color = "#000"; e.target.style.background = "#FAFAFA"; }}
        onBlur={e => { if (!e.target.value.trim()) { e.target.value = DEFAULT_FB; feedbackRef.current[teamId] = { ...feedbackRef.current[teamId], [fieldKey]: DEFAULT_FB }; e.target.style.color = "#CCC"; } e.target.style.borderColor = "#E5E5E5"; e.target.style.background = "#fff"; }}
        style={{ width: "100%", minHeight: 48, borderRadius: 10, border: "1px solid #E5E5E5", padding: "10px 14px", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", transition: "all 0.2s", color: "#CCC", background: "#fff" }}
      />
    </div>
  );
};

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("t");

  const [phase, setPhase] = useState(urlToken ? "loading" : "error");
  const [userData, setUserData] = useState(null);
  const [userBU, setUserBU] = useState(null);
  const [userName, setUserName] = useState("");
  const [token] = useState(urlToken || "");
  const [teamIdx, setTeamIdx] = useState(0);
  const [subStep, setSubStep] = useState("worked");
  const [answers, setAnswers] = useState({});
  const [stratRating, setStratRating] = useState(null);
  const [stratFeedback, setStratFeedback] = useState("");
  const [slideDir, setSlideDir] = useState("forward");
  const [slideKey, setSlideKey] = useState(0);
  const [showCeleb, setShowCeleb] = useState(false);
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const feedbackRef = useRef({});

  // For demo/testing: allow BU override via URL param
  const urlBU = urlParams.get("bu");
  const urlName = urlParams.get("name");

  useEffect(() => {
    if (!urlToken) return;
    // In production, you could validate token server-side here
    // For now, we use URL params for name/bu or show BU selector
    if (urlName && urlBU) {
      setUserName(urlName);
      setUserBU(urlBU);
      setPhase("welcome");
    } else if (urlName) {
      setUserName(urlName);
      setPhase("welcome");
    } else {
      setUserName("Team Member");
      setPhase("welcome");
    }
  }, [urlToken, urlName, urlBU]);

  const eligible = TEAMS.filter(t => t.group !== userBU);
  const total = eligible.length + 1;
  const step = phase === "strategy" ? eligible.length + 1 : teamIdx + 1;
  const team = eligible[teamIdx];

  const nav = useCallback((dir, p, idx, sub) => {
    setHistory(h => [...h, { phase, teamIdx, subStep }]);
    setSlideDir(dir);
    setSlideKey(k => k + 1);
    if (p) setPhase(p);
    if (idx !== undefined) setTeamIdx(idx);
    if (sub) setSubStep(sub);
  }, [phase, teamIdx, subStep]);

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setSlideDir("back");
    setSlideKey(k => k + 1);
    setPhase(prev.phase);
    setTeamIdx(prev.teamIdx);
    setSubStep(prev.subStep);
  }, [history]);

  const celebrate = () => {
    setShowCeleb(true);
    setTimeout(() => setShowCeleb(false), 800);
  };

  const handleWorked = (worked) => {
    if (!team) return;
    setAnswers(a => ({ ...a, [team.id]: { ...a[team.id], worked } }));
    if (worked) {
      if (!feedbackRef.current[team.id]) feedbackRef.current[team.id] = { start: DEFAULT_FB, keep: DEFAULT_FB, drop: DEFAULT_FB };
      nav("forward", null, undefined, "rating");
    } else {
      celebrate();
      setTimeout(() => goNext(), 500);
    }
  };

  const handleRating = (score) => {
    if (!team) return;
    setAnswers(a => ({ ...a, [team.id]: { ...a[team.id], rating: score } }));
    nav("forward", null, undefined, "feedback");
  };

  const handleFeedback = () => {
    if (!team) return;
    const fb = feedbackRef.current[team.id] || {};
    setAnswers(a => ({ ...a, [team.id]: { ...a[team.id], start: fb.start?.trim() || DEFAULT_FB, keep: fb.keep?.trim() || DEFAULT_FB, drop: fb.drop?.trim() || DEFAULT_FB } }));
    celebrate();
    setTimeout(() => goNext(), 500);
  };

  const goNext = () => {
    if (teamIdx < eligible.length - 1) nav("forward", null, teamIdx + 1, "worked");
    else nav("forward", "strategy");
  };

  const handleSubmit = async () => {
    if (stratRating === null) return;
    setSubmitting(true);
    const payload = {
      token,
      respondent: userName,
      bu: userBU,
      quarter: "Q2-2026",
      answers,
      strategy: { rating: stratRating, feedback: stratFeedback.trim() || DEFAULT_FB },
      submittedAt: new Date().toISOString()
    };
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        nav("forward", "thanks");
      } else {
        alert("Error: " + (data.error || "Submission failed. Please try again."));
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Network error. Please check your connection and try again.");
    }
    setSubmitting(false);
  };

  useEffect(() => {
    const h = (e) => {
      if (phase === "survey" && subStep === "worked") {
        if (e.key === "y" || e.key === "Y") { e.preventDefault(); handleWorked(true); }
        if (e.key === "n" || e.key === "N") { e.preventDefault(); handleWorked(false); }
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        if (phase === "survey" && subStep === "feedback") { e.preventDefault(); handleFeedback(); }
        if (phase === "strategy" && stratRating !== null) { e.preventDefault(); handleSubmit(); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // ERROR - no token
  if (phase === "error") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#fff" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <AnimatedVLogo size={80} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#000", margin: "24px 0 8px" }}>Invalid link</h1>
          <p style={{ fontSize: 14, color: "#999" }}>This survey link is missing a valid token. Please use the link you received via Slack.</p>
        </div>
      </div>
    );
  }

  // LOADING
  if (phase === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ fontSize: 14, color: "#999" }}>Loading...</div>
      </div>
    );
  }

  // WELCOME
  if (phase === "welcome") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "#fff" }}>
        <style>{`@keyframes burstP { 0% { transform:scale(0); opacity:1 } 50% { opacity:1 } 100% { transform:scale(1); opacity:0 } }
          @keyframes checkDraw { to { stroke-dashoffset:0 } }
          @keyframes fadeScale { 0% { opacity:0; transform:scale(0.8) } 100% { opacity:1; transform:scale(1) } }
          @keyframes pulseRing { 0% { transform:scale(1); opacity:0.4 } 100% { transform:scale(1.6); opacity:0 } }
          @keyframes floatIn { 0% { opacity:0; transform:translateY(20px) } 100% { opacity:1; transform:translateY(0) } }
          @keyframes confetti { 0% { transform:translateY(0) rotate(0deg); opacity:1 } 100% { transform:translateY(120px) rotate(720deg); opacity:0 } }`}
        </style>
        <Slide dir="forward" key="welcome">
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <AnimatedVLogo size={120} />
            <div style={{ animation: "floatIn 0.6s 0.8s both" }}>
              <h1 style={{ fontSize: 40, fontWeight: 800, color: "#000", margin: "32px 0 8px", lineHeight: 1.05, letterSpacing: -1.5 }}>Company<br/>Feedback</h1>
              <p style={{ fontSize: 14, color: "#999", margin: "0 0 4px", fontWeight: 500 }}>Q2 2026 · Quarterly NPS Survey</p>
              <div style={{ width: 40, height: 2, background: "#000", margin: "20px auto 24px" }} />
              <p style={{ fontSize: 15, color: "#555", lineHeight: 1.7, margin: "0 0 8px" }}>Rate your collaboration with transverse teams this quarter.</p>
              <p style={{ fontSize: 13, color: "#CCC", margin: "0 0 32px" }}>~5 min · Start / Keep / Drop format</p>
            </div>
            <div style={{ animation: "floatIn 0.6s 1s both" }}>
              <div style={{ background: "#FAFAFA", borderRadius: 14, padding: "18px 22px", marginBottom: 16, textAlign: "left", border: "1px solid #F0F0F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/><path d="M12 8v4M12 16h.01"/></svg>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>Not anonymous</span>
                </div>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>Your name will be attached to your responses to enable meaningful follow-up with team leads.</p>
              </div>
            </div>
            {!urlBU && (
              <div style={{ animation: "floatIn 0.6s 1.1s both" }}>
                <div style={{ background: "#FAFAFA", borderRadius: 14, padding: "18px 22px", marginBottom: 28, textAlign: "left", border: "1px solid #F0F0F0" }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#BBB", textTransform: "uppercase", letterSpacing: 1.5, display: "block", marginBottom: 12 }}>Select your BU</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {BU_OPTIONS.map(bu => (
                      <button key={bu} onClick={() => setUserBU(bu)} style={{ padding: "8px 14px", borderRadius: 8, border: userBU === bu ? "2px solid #000" : "1px solid #E5E5E5", background: userBU === bu ? "#000" : "#fff", color: userBU === bu ? "#fff" : "#888", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", transform: userBU === bu ? "scale(1.05)" : "scale(1)" }}>{bu}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div style={{ animation: "floatIn 0.6s 1.2s both" }}>
              <Btn onClick={() => { if (userBU) nav("forward", "survey"); }} disabled={!userBU} style={{ width: "100%", padding: "16px 32px", fontSize: 15, borderRadius: 14 }}>
                Start survey
              </Btn>
            </div>
          </div>
        </Slide>
      </div>
    );
  }

  // THANKS
  if (phase === "thanks") {
    const rated = Object.values(answers).filter(a => a.worked).length;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "#fff" }}>
        <Slide dir="forward" key="thanks">
          <div style={{ textAlign: "center", maxWidth: 440, position: "relative" }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} style={{ position: "absolute", top: -20, left: `${10 + Math.random() * 80}%`, width: 6, height: 6, borderRadius: i % 2 ? "50%" : 1, background: i % 4 === 0 ? "#000" : i % 4 === 1 ? "#666" : i % 4 === 2 ? "#CCC" : "#EEE", animation: `confetti ${1 + Math.random() * 1.5}s ${Math.random() * 0.5}s ease-out both` }} />
            ))}
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", animation: "fadeScale 0.5s cubic-bezier(0.16,1,0.3,1)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#000", margin: "0 0 8px", letterSpacing: -0.5 }}>Thank you{userName ? `, ${userName.split(" ")[0]}` : ""}!</h1>
            <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6, margin: "0 0 32px" }}>
              You rated <strong style={{ color: "#000" }}>{rated} team{rated > 1 ? "s" : ""}</strong> this quarter.
            </p>
            <div style={{ background: "#FAFAFA", borderRadius: 14, padding: "20px 24px", textAlign: "left", border: "1px solid #F0F0F0" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#000", margin: "0 0 6px" }}>What happens next?</p>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>Results will be compiled and shared with team leads within 2 weeks. Action plans will be presented at the next All Hands.</p>
            </div>
          </div>
        </Slide>
      </div>
    );
  }

  const surveyBg = "#fff";

  // STRATEGY
  if (phase === "strategy") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "56px 24px 24px", background: surveyBg }}>
        <ProgressBar current={step} total={total} />
        <ProgressRing current={step} total={total} />
        <BackBtn onClick={goBack} show={history.length > 0} />
        <CelebBurst show={showCeleb} />
        <Slide dir={slideDir} key="strategy">
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <Badge name={userName} bu={userBU} />
            <Qnum n={step} total={total} />
            <Tag group="Strategy" />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#000", margin: "0 0 6px", lineHeight: 1.3, letterSpacing: -0.3 }}>
              How aligned are you with the strategy at Voodoo and its overall execution?
            </h2>
            <p style={{ fontSize: 13, color: "#CCC", margin: "0 0 28px" }}>Last question — you're almost done.</p>
            <NPSScale value={stratRating} onSelect={setStratRating} />
            {stratRating !== null && (
              <div style={{ marginTop: 24, marginBottom: 24, animation: "fadeScale 0.3s ease" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#000", display: "block", marginBottom: 6 }}>How can we improve? <span style={{ color: "#CCC", fontWeight: 400 }}>required</span></label>
                <textarea value={stratFeedback}
                  onChange={e => setStratFeedback(e.target.value)}
                  onFocus={e => { if (e.target.value === DEFAULT_FB) setStratFeedback(""); e.target.style.borderColor = "#000"; }}
                  onBlur={e => { if (!e.target.value.trim()) setStratFeedback(DEFAULT_FB); e.target.style.borderColor = "#E5E5E5"; }}
                  style={{ width: "100%", minHeight: 90, borderRadius: 12, border: "1px solid #E5E5E5", padding: 14, fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", transition: "all 0.2s", color: stratFeedback === DEFAULT_FB || !stratFeedback ? "#CCC" : "#000" }} />
              </div>
            )}
            <Btn onClick={handleSubmit} disabled={stratRating === null || submitting} style={{ width: "100%", padding: "16px 32px", borderRadius: 14 }}>
              {submitting ? "Submitting..." : "Submit feedback"} <Key label="⌘↵" />
            </Btn>
          </div>
        </Slide>
      </div>
    );
  }

  // SURVEY TEAMS
  if (!team) return null;
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "56px 24px 24px", background: surveyBg }}>
      <ProgressBar current={step} total={total} />
      <ProgressRing current={step} total={total} />
      <BackBtn onClick={goBack} show={history.length > 0} />
      <CelebBurst show={showCeleb} />
      <Slide dir={slideDir} key={`${slideKey}-${team.id}-${subStep}`}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <Badge name={userName} bu={userBU} />
          <Qnum n={step} total={total} />
          <Tag group={team.group} />

          {subStep === "worked" && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#000", margin: "0 0 6px", lineHeight: 1.3, letterSpacing: -0.3 }}>
                Have you worked with <span style={{ borderBottom: "3px solid #000", paddingBottom: 1 }}>{team.name}</span> this quarter?
              </h2>
              {team.subtitle && <p style={{ fontSize: 13, color: "#BBB", margin: "0 0 32px" }}>{team.subtitle}</p>}
              {!team.subtitle && <div style={{ height: 28 }} />}
              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={() => handleWorked(true)} style={{ flex: 1, padding: "16px 32px", borderRadius: 14 }}>Yes <Key label="Y" /></Btn>
                <Btn onClick={() => handleWorked(false)} variant="ghost" style={{ flex: 1, padding: "16px 32px", borderRadius: 14 }}>No <span style={{ fontSize: 10, color: "#BBB", marginLeft: 4 }}><kbd style={{ background: "#E5E5E5", borderRadius: 3, padding: "1px 5px", fontSize: 10, fontFamily: "monospace" }}>N</kbd></span></Btn>
              </div>
            </>
          )}

          {subStep === "rating" && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#000", margin: "0 0 6px", lineHeight: 1.3, letterSpacing: -0.3 }}>
                Rate your collaboration with <span style={{ borderBottom: "3px solid #000", paddingBottom: 1 }}>{team.name}</span>
              </h2>
              <p style={{ fontSize: 13, color: "#BBB", margin: "0 0 28px" }}>0 = very poor · 10 = excellent</p>
              <NPSScale value={answers[team.id]?.rating} onSelect={handleRating} />
            </>
          )}

          {subStep === "feedback" && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#000", margin: "0 0 6px", lineHeight: 1.3, letterSpacing: -0.3 }}>
                How could <span style={{ borderBottom: "3px solid #000", paddingBottom: 1 }}>{team.name}</span> improve?
              </h2>
              <p style={{ fontSize: 13, color: "#BBB", margin: "0 0 24px" }}>All fields required — pre-filled with N/A if no feedback.</p>
              <FBField icon="→" label="Start" hint="What should the team start doing?" teamId={team.id} fieldKey="start" feedbackRef={feedbackRef} />
              <FBField icon="↻" label="Keep" hint="What's working well?" teamId={team.id} fieldKey="keep" feedbackRef={feedbackRef} />
              <FBField icon="×" label="Drop" hint="What should the team stop doing?" teamId={team.id} fieldKey="drop" feedbackRef={feedbackRef} />
              <Btn onClick={handleFeedback} style={{ width: "100%", marginTop: 8, padding: "16px 32px", borderRadius: 14 }}>
                Next team <Key label="⌘↵" />
              </Btn>
            </>
          )}
        </div>
      </Slide>
    </div>
  );
}
