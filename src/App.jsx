import { useEffect, useState } from "react";
import Scene from "./components/Scene.jsx";
import PinGate from "./components/PinGate.jsx";
import Studio from "./components/Studio.jsx";
import { getToken, clearToken } from "./api.js";

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const out = () => setAuthed(false);
    window.addEventListener("tts-logout", out);
    return () => window.removeEventListener("tts-logout", out);
  }, []);

  const lock = () => {
    clearToken();
    setAuthed(false);
  };

  return (
    <>
      <Scene active={busy} />
      <main className="app">
        {authed ? (
          <Studio onBusy={setBusy} onLock={lock} />
        ) : (
          <PinGate onSuccess={() => setAuthed(true)} />
        )}
      </main>
    </>
  );
}
