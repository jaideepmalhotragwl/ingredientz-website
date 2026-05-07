import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const LANGS = ["EN","FR","DE","ES"];

const T = {
  EN: { products:"Products", categories:"Categories", about:"About", contact:"Contact", login:"Login", quote:"Request Quote", langLabel:"Language" },
  FR: { products:"Produits", categories:"Catégories", about:"À propos", contact:"Contact", login:"Connexion", quote:"Demander un devis", langLabel:"Langue" },
  DE: { products:"Produkte", categories:"Kategorien", about:"Über uns", contact:"Kontakt", login:"Anmelden", quote:"Angebot anfordern", langLabel:"Sprache" },
  ES: { products:"Productos", categories:"Categorías", about:"Acerca de", contact:"Contacto", login:"Iniciar sesión", quote:"Solicitar cotización", langLabel:"Idioma" },
};

export function Navbar({ lang, setLang }) {
  const [showLogin, setShowLogin] = useState(false);
  const t = T[lang] || T.EN;

  return (
    <>
      {/* Language bar */}
      <div style={{ background: "#0D1F3C", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "5px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
          {LANGS.map((l, i) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10 }}>|</span>}
              <button onClick={() => setLang(l)} style={{
                background: lang === l ? "rgba(255,255,255,0.12)" : "none",
                border: "none", color: lang === l ? "white" : "rgba(255,255,255,0.4)",
                fontSize: 10, fontWeight: lang === l ? 500 : 400,
                padding: "2px 8px", borderRadius: 3, cursor: "pointer",
                letterSpacing: 1
              }}>{l}</button>
            </span>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ background: "white", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ height: 60, display: "flex", alignItems: "center", gap: 24 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <LogoMark size={30}/>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "var(--navy)", letterSpacing: -0.5 }}>Ingredientz</span>
          </Link>

          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {[["products", "/products"], ["categories", "/categories"], ["about", "/about"], ["contact", "/contact"]].map(([key, href]) => (
              <Link key={key} to={href} style={{ color: "var(--muted)", fontSize: 13, padding: "6px 12px", borderRadius: 6, transition: "all 0.15s" }}
                onMouseEnter={e => { e.target.style.color = "var(--navy)"; e.target.style.background = "var(--bg)"; }}
                onMouseLeave={e => { e.target.style.color = "var(--muted)"; e.target.style.background = "transparent"; }}>
                {t[key]}
              </Link>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={() => setShowLogin(true)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--navy)", borderRadius: 6, padding: "7px 16px", fontSize: 12 }}>
              {t.login}
            </button>
            <Link to="/enquiry">
              <button style={{ background: "var(--navy)", border: "none", color: "white", borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 500 }}>
                {t.quote}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} lang={lang}/>}
    </>
  );
}

function LoginModal({ onClose, lang }) {
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [step, setStep]       = useState("email"); // email | otp | done
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate = useNavigate();

  async function sendOtp() {
    if (!email.trim()) { setError("Please enter your email"); return; }
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
      if (error) throw error;
      setStep("otp");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function verifyOtp() {
    if (!otp.trim()) { setError("Please enter the OTP"); return; }
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
      if (error) throw error;
      setStep("done");
      setTimeout(() => { onClose(); navigate("/account"); }, 1200);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, color: "var(--light)", cursor: "pointer" }}>×</button>

        {step === "done" ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)" }}>Login successful</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Redirecting to your account…</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "var(--navy)", marginBottom: 6 }}>
              {step === "email" ? "Login to your account" : "Enter your OTP"}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
              {step === "email" ? "Enter your business email. We'll send you a one-time code." : `We sent a 6-digit code to ${email}`}
            </div>

            {step === "email" ? (
              <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && sendOtp()}
                type="email" placeholder="you@company.com"
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", marginBottom: 12 }}/>
            ) : (
              <input value={otp} onChange={e => setOtp(e.target.value)} onKeyDown={e => e.key === "Enter" && verifyOtp()}
                type="text" placeholder="123456" maxLength={6}
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 20, letterSpacing: 8, outline: "none", marginBottom: 12, textAlign: "center" }}/>
            )}

            {error && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</div>}

            <button onClick={step === "email" ? sendOtp : verifyOtp} disabled={loading}
              style={{ width: "100%", background: "var(--navy)", color: "white", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 500, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait…" : step === "email" ? "Send OTP →" : "Verify & Login →"}
            </button>

            {step === "otp" && (
              <button onClick={() => { setStep("email"); setOtp(""); }} style={{ width: "100%", background: "none", border: "none", color: "var(--muted)", fontSize: 12, marginTop: 10 }}>
                ← Use a different email
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LogoMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="#EEF4FF" stroke="#1877F2" strokeWidth="0.8"/>
      <circle cx="16" cy="16" r="4" fill="#1877F2"/>
      <line x1="16" y1="4" x2="16" y2="28" stroke="#0EA5A0" strokeWidth="1"/>
      <line x1="4" y1="16" x2="28" y2="16" stroke="#0EA5A0" strokeWidth="1"/>
      <ellipse cx="16" cy="16" rx="11" ry="6" stroke="#1877F2" strokeWidth="0.7" fill="none"/>
      <circle cx="10" cy="11" r="1.8" fill="#0D1F3C"/>
      <circle cx="22" cy="20" r="1.8" fill="#0D1F3C"/>
      <circle cx="21" cy="11" r="1.8" fill="#0D1F3C"/>
    </svg>
  );
}

// CSS variable helper
const var_navy = "#0D1F3C";

export { LogoMark };
