import { useEffect, useRef, useState } from "react";
import TiltCard from "./TiltCard.jsx";
import Logo from "./Logo.jsx";
import { api, API, audioUrl } from "../api.js";

const MAX_CHARS = 5000;
const SAMPLE = "నమస్కారం, మీరు ఎలా ఉన్నారు? ఈ రోజు వాతావరణం చాలా బాగుంది.";

export default function Studio({ onBusy, onLock }) {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState(0);
  const [tab, setTab] = useState("Female");
  const [clips, setClips] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [autoPlayId, setAutoPlayId] = useState(null);
  const audioRefs = useRef({});
  const historyRef = useRef(null);

  const offline = "Cannot reach the server (" + API + "). Please try again.";
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const loadClips = async () => {
    try {
      const r = await api("/clips");
      if (r.ok) setClips(await r.json());
    } catch {
      setError(offline);
    }
  };

  useEffect(() => {
    api("/voices")
      .then((r) => (r.ok ? r.json() : []))
      .then(setVoices)
      .catch(() => setError(offline));
    loadClips();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (autoPlayId && audioRefs.current[autoPlayId]) {
      audioRefs.current[autoPlayId].play().catch(() => {}); // phones may block autoplay: user taps play
      setAutoPlayId(null);
    }
  }, [clips, autoPlayId]);

  const generate = async () => {
    setError("");
    setBusy(true);
    onBusy(true);
    document.activeElement?.blur?.(); // close the phone keyboard
    try {
      const r = await api("/tts", { method: "POST", body: JSON.stringify({ text, voice }) });
      if (!r.ok) throw new Error("Generation failed (" + r.status + ")");
      const clip = await r.json();
      setAutoPlayId(clip.id);
      await loadClips();
      historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setBusy(false);
      onBusy(false);
    }
  };

  const remove = async (id) => {
    await api(`/clips/${id}`, { method: "DELETE" });
    loadClips();
  };

  // Share the MP3 straight to WhatsApp etc. (phones); falls back to a normal download
  const share = async (c) => {
    try {
      const blob = await (await fetch(audioUrl(c.id))).blob();
      const file = new File([blob], `telugu-${c.id}.mp3`, { type: "audio/mpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Telugu voice" });
        return;
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
    }
    window.location.href = audioUrl(c.id);
  };

  const selected = voices.find((v) => v.index === voice);
  const shown = voices.filter((v) => v.gender === tab);
  const fmt = (iso) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="studio">
      <header className="top">
        <div className="brand">
          <Logo size={36} />
          <div>
            <h1 className="title">Telugu Voice Studio</h1>
            <p className="sub">Type Telugu, pick a voice, get natural speech.</p>
          </div>
        </div>
        <button className="ghost" onClick={onLock} aria-label="Lock">🔒<span className="hide-sm"> Lock</span></button>
      </header>

      <section className="glass panel">
        <div className="panel-head">
          <h2>Your text</h2>
          <div className="links">
            <button className="link" onClick={() => setText(SAMPLE)}>Sample</button>
            <button className="link" onClick={() => setText("")} disabled={!text}>Clear</button>
          </div>
        </div>
        <textarea
          rows={5}
          maxLength={MAX_CHARS}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="తెలుగు టెక్స్ట్ ఇక్కడ రాయండి..."
        />
        <div className="count">{text.length} / {MAX_CHARS}</div>
      </section>

      <section className="glass panel">
        <div className="panel-head">
          <h2>Choose a voice</h2>
          <div className="tabs">
            {["Female", "Male"].map((g) => (
              <button key={g} className={`tab ${tab === g ? "on" : ""}`} onClick={() => setTab(g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="voice-grid">
          {shown.map((v) => (
            <TiltCard
              as="button"
              key={v.index}
              max={14}
              className={`voice ${voice === v.index ? "active" : ""}`}
              onClick={() => setVoice(v.index)}
            >
              <span className="avatar">{v.name[0]}</span>
              <span className="vname">{v.name}</span>
              <span className="vstyle">{v.style}</span>
            </TiltCard>
          ))}
        </div>
        <p className="swipe-hint">Swipe sideways for more voices →</p>

        {error && <div className="error">{error}</div>}
      </section>

      <section className="history" ref={historyRef}>
        <h2>History <small>auto-deleted after 3 days</small></h2>
        {clips.length === 0 && <p className="muted">No clips yet. Generate your first one!</p>}
        {clips.map((c) => (
          <TiltCard key={c.id} className="glass clip" max={3}>
            <div className="clip-top">
              <span className="badge">{c.voice}</span>
              <span className="muted">{fmt(c.createdAt)}</span>
            </div>
            <p className="txt">{c.text.length > 140 ? c.text.slice(0, 140) + "..." : c.text}</p>
            <audio
              controls
              preload="none"
              ref={(el) => (audioRefs.current[c.id] = el)}
              src={audioUrl(c.id)}
            />
            <div className="actions">
              {canShare ? (
                <button className="chip" onClick={() => share(c)}>↗ Share</button>
              ) : (
                <a className="chip" href={audioUrl(c.id)} download={`telugu-${c.id}.mp3`}>⬇ Download</a>
              )}
              <button className="danger" onClick={() => remove(c.id)}>Delete</button>
            </div>
          </TiltCard>
        ))}
      </section>

      {/* Always-visible action bar (thumb reach) */}
      <div className="dock">
        <div className="dock-in glass">
          <div className="dock-voice">
            <span className="avatar sm">{selected ? selected.name[0] : "?"}</span>
            <div className="dock-text">
              <b>{selected ? selected.name : "Loading..."}</b>
              <span>{selected ? selected.style : ""}</span>
            </div>
          </div>
          <button className="big3d" onClick={generate} disabled={busy || !text.trim() || !selected}>
            {busy ? <span className="wave"><i /><i /><i /><i /><i /></span> : "▶ Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
