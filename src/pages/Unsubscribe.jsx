import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// Calls the RPC endpoint directly rather than importing a shared client.
// This page is reached by people who may never have loaded the rest of
// the site, and it must not fail to build because a helper moved.
// The anon key is already public in the bundle, so nothing is exposed
// by having it here — and redeem_unsubscribe only ever acts on a token
// it is given, never on anything the caller chooses.
const SUPA_URL = "https://eytoryygkxjslfvsqanl.supabase.co";
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dG9yeXlna3hqc2xmdnNxYW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDA5MTUsImV4cCI6MjA5MDMxNjkxNX0.txYTl0Q06mKSfWGmWc8cOTmCN46tLcxF9_7RhBUHBRY";

/**
 * Unsubscribe — redeems the token from a follow-up email.
 *
 * Deliberately does NOT act on page load. Corporate mail scanners
 * pre-fetch every link in an incoming email, so an auto-redeeming
 * page would unsubscribe people who never clicked anything. The
 * button press is the consent.
 */

const C = {
  ink: "#0f172a", muted: "#64748b", faded: "#94a3b8",
  border: "#e2e8f0", blue: "#1877F2", green: "#1E7A46", red: "#E41E3F",
};

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const [state, setState] = useState("ready");   // ready | working | done | error | notoken
  const [result, setResult] = useState(null);

  useEffect(() => { if (!token) setState("notoken"); }, [token]);

  async function confirm() {
    setState("working");
    try {
      const res = await fetch(`${SUPA_URL}/rest/v1/rpc/redeem_unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPA_ANON,
          Authorization: `Bearer ${SUPA_ANON}`,
        },
        body: JSON.stringify({ p_token: token }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) { setState("error"); return; }
      setResult(data);
      setState("done");
    } catch (e) {
      console.error("unsubscribe failed:", e);
      setState("error");
    }
  }

  const wrap = {
    minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 22px", fontFamily: "Arial,Helvetica,sans-serif",
  };
  const card = {
    maxWidth: 460, width: "100%", background: "#fff", border: `1px solid ${C.border}`,
    borderRadius: 14, padding: "34px 34px 30px", textAlign: "center",
  };
  const h = { fontFamily: "'DM Serif Display',serif", fontSize: 26, color: C.ink, margin: "0 0 10px" };
  const p = { fontSize: 14.5, color: C.muted, lineHeight: 1.65, margin: "0 0 20px" };
  const btn = {
    background: C.blue, color: "#fff", border: 0, borderRadius: 9,
    padding: "11px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer",
  };

  return <div style={wrap}><div style={card}>

    {state === "notoken" && <>
      <h1 style={h}>Link not recognised</h1>
      <p style={p}>
        This unsubscribe link is incomplete. Copy it from your email again, or write to
        {" "}<a href="mailto:sales@ingredientz.co" style={{ color: C.blue }}>sales@ingredientz.co</a>
        {" "}and we'll take you off the list by hand.
      </p>
    </>}

    {(state === "ready" || state === "working") && <>
      <h1 style={h}>Unsubscribe</h1>
      <p style={p}>
        Confirm and we'll stop sending you follow-up emails about your enquiries.
      </p>
      <button onClick={confirm} disabled={state === "working"}
        style={{ ...btn, opacity: state === "working" ? 0.6 : 1,
                 cursor: state === "working" ? "wait" : "pointer" }}>
        {state === "working" ? "Just a moment…" : "Yes, unsubscribe me"}
      </button>
      <p style={{ ...p, fontSize: 12.5, margin: "18px 0 0", color: C.faded }}>
        Quotations, order updates and replies to your own emails will still reach you —
        this only stops the periodic check-ins.
      </p>
    </>}

    {state === "done" && <>
      <div style={{ fontSize: 38, marginBottom: 6 }}>✓</div>
      <h1 style={{ ...h, color: C.green }}>You're unsubscribed</h1>
      <p style={p}>
        {result?.email
          ? <>We won't send further follow-ups to <b style={{ color: C.ink }}>{result.email}</b>.</>
          : <>We won't send you further follow-ups.</>}
      </p>
      <p style={{ ...p, fontSize: 13 }}>
        If this was a mistake, or you'd like to hear from us again later, just reply to any
        of our emails or write to
        {" "}<a href="mailto:sales@ingredientz.co" style={{ color: C.blue }}>sales@ingredientz.co</a>.
      </p>
      <a href="/" style={{ color: C.blue, fontSize: 13 }}>← Back to ingredientz.co</a>
    </>}

    {state === "error" && <>
      <h1 style={{ ...h, color: C.red }}>That didn't work</h1>
      <p style={p}>
        We couldn't process this link — it may already have been used, or it may have expired.
      </p>
      <p style={{ ...p, fontSize: 13 }}>
        Write to <a href="mailto:sales@ingredientz.co" style={{ color: C.blue }}>sales@ingredientz.co</a>
        {" "}and we'll remove you straight away. You won't need to do anything else.
      </p>
    </>}

  </div></div>;
}
