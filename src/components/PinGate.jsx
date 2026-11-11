import { useEffect, useRef, useState } from "react";
import TiltCard from "./TiltCard.jsx";
import Logo from "./Logo.jsx";
import { api, setToken } from "../api.js";

// 6 visual boxes, ONE real (invisible) input on top. This is the most reliable way on phones:
// numeric keypad, backspace, paste and autofill all work on every Android / iOS keyboard.
export default function PinGate({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking | error | ok
  const [msg, setMsg] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const failAndReset = (text) => {
    setStatus("error");
    setMsg(text);
    setTimeout(() => {
      setPin("");
      setStatus("idle");
      inputRef.current?.focus();
    }, 800);
  };

  const submit = async (value) => {
    setStatus("checking");
    setMsg("");
    try {
      const res = await api("/auth", { method: "POST", body: JSON.stringify({ pin: value }) });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setStatus("ok");
        setTimeout(onSuccess, 450);
        return;
      }
      failAndReset(res.status === 429 ? "Too many attempts. Try again in a few minutes." : "Wrong PIN. Try again.");
    } catch {
      failAndReset("Cannot reach the server. Please try again.");
    }
  };

  const onChange = (e) => {
    if (status === "checking" || status === "ok") return;
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(v);
    if (v.length === 6) submit(v); // auto-submit, no Enter needed
  };

  const keepCaretAtEnd = (e) => {
    const l = e.target.value.length;
    e.target.setSelectionRange(l, l);
  };

  return (
    <div className="gate">
      <TiltCard className="glass pin-card" max={5}>
        <div className="gate-logo"><Logo size={44} /></div>
        <h1 className="title">Telugu Voice Studio</h1>
        <p className="sub">Enter your 6-digit PIN</p>

        <div className={`pin-boxes ${status}`} onClick={() => inputRef.current?.focus()}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`pin-box ${pin[i] ? "filled" : ""} ${status === "idle" && i === pin.length ? "active" : ""}`}
            >
              {pin[i] ? "●" : ""}
            </div>
          ))}
          <input
            ref={inputRef}
            className="pin-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={6}
            value={pin}
            disabled={status === "checking" || status === "ok"}
            onChange={onChange}
            onSelect={keepCaretAtEnd}
            aria-label="6-digit PIN"
          />
        </div>

        <div className="pin-msg">
          {status === "checking" && "Checking..."}
          {status === "ok" && "Welcome!"}
          {status === "error" && msg}
        </div>
      </TiltCard>
    </div>
  );
}
