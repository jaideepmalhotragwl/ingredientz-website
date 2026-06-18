import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { LoginModal } from "../components/Navbar.jsx";

const STAGE_COLORS = {
  "New Enquiry":      { bg:"#F1F5F9", color:"#64748b", border:"#e2e8f0" },
  "Sourcing Awaited": { bg:"#EEF4FF", color:"#1877F2", border:"#BFD6F6" },
  "Quotation Sent":   { bg:"#EEF4FF", color:"#1877F2", border:"#BFD6F6" },
  "Price Negotiation":{ bg:"#FFF7ED", color:"#c2410c", border:"#fed7aa" },
  "Awaiting PO":      { bg:"#FFF7ED", color:"#c2410c", border:"#fed7aa" },
  "PO Received":      { bg:"#F0FDF4", color:"#166534", border:"#bbf7d0" },
  "Lost":             { bg:"#FFF1F2", color:"#be123c", border:"#fecdd3" },
  "No Response":      { bg:"#F1F5F9", color:"#94a3b8", border:"#e2e8f0" },
  "On Hold":          { bg:"#F5F3FF", color:"#6d28d9", border:"#ddd6fe" },
};

// ── SEND EMAIL ─────────────────────────────────────────────────────────────────
// Routes through the server-side send-email Edge Function (RESEND_KEY lives there).
// No API key is ever shipped to the browser.
async function sendEmail({ to, subject, html }) {
  await supabase.functions.invoke("send-email", {
    body: {
      from: "Ingredientz <sales@mail.ingredientz.co>",
      to,
      reply_to: "sales@ingredientz.co",
      subject,
      html,
    },
  });
}

// ── MOBILE STYLES ──────────────────────────────────────────────────────────────
const styles = `
  @media (max-width: 768px) {
    .portal-grid { grid-template-columns: 1fr !important; }
    .portal-sidebar { display: none; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .quot-table-wrap { overflow-x: auto; }
    .quot-actions { flex-direction: column !important; }
    .enq-footer { flex-direction: column !important; gap: 8px !important; }
    .portal-header-inner { flex-direction: column !important; gap: 8px !important; }
    .mob-menu { display: flex !important; }
  }
  @media (min-width: 769px) {
    .mob-menu { display: none !important; }
  }
`;

// ── ENQUIRY CARD ───────────────────────────────────────────────────────────────
function EnquiryCard({ enq, onSelect }) {
  const products = Array.isArray(enq.products) ? enq.products : [];
  const s = STAGE_COLORS[enq.stage] || STAGE_COLORS["New Enquiry"];
  const hasQuot = enq.stage === "Quotation Sent" || enq.stage === "Awaiting PO";

  return (
    <div style={{
      background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
      padding: "16px 18px", marginBottom: 10, transition: "all 0.15s"
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#c7d8f8"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1F3C", marginBottom: 2 }}>ENQ-{enq.id}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {new Date(enq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600 }}>
          {enq.stage}
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {products.slice(0, 3).map((p, i) => (
          <span key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 9px", fontSize: 11, color: "#475569" }}>
            {p.name}{p.qty ? ` — ${p.qty} ${p.unit || "kg"}` : ""}
          </span>
        ))}
        {products.length > 3 && <span style={{ fontSize: 11, color: "#94a3b8" }}>+{products.length - 3} more</span>}
      </div>

      <div className="enq-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: 11, color: "#64748b" }}>
          {enq.assigned_to ? <>Assigned: <strong>{enq.assigned_to}</strong></> : "Being reviewed"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {hasQuot && (
            <button onClick={() => onSelect(enq)}
              style={{ background: "#1877F2", color: "white", border: "none", borderRadius: 5, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              📄 View Quotation
            </button>
          )}
          <button onClick={() => onSelect(enq)}
            style={{ background: "none", border: "1px solid #e2e8f0", color: "#0D1F3C", borderRadius: 5, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QUOTATION DETAIL ───────────────────────────────────────────────────────────
function QuotationDetail({ enq, session, onBack, onPOCreated }) {
  const [accepting, setAccepting] = useState(false);
  const [revising, setRevising]   = useState(false);
  const [revision, setRevision]   = useState("");
  const [done, setDone]           = useState(false);
  const products = Array.isArray(enq.products) ? enq.products : [];

  async function acceptQuotation() {
    setAccepting(true);
    try {
      // 1. Create PO record in Supabase
      const { data: po, error } = await supabase.from("enquiry_pos").insert({
        enquiry_id: enq.id,
        customer_email: session.user.email,
        customer_name: enq.customer_name,
        products: enq.products,
        total_value: enq.quoted_value || null,
        currency: "USD",
        status: "PO Received",
        notes: `Accepted by customer via portal on ${new Date().toLocaleDateString()}`
      }).select().single();

      if (error) throw error;

      // 2. Update enquiry stage to PO Received
      await supabase.from("enquiries").update({ stage: "PO Received" }).eq("id", enq.id);

      // 3. Email to customer
      await sendEmail({
        to: session.user.email,
        subject: `Order Confirmed — ENQ-${enq.id} [PO-${po.id}]`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#0D1F3C;padding:24px 32px;">
              <div style="color:white;font-size:18px;font-weight:bold;">Order Confirmed ✓</div>
              <div style="color:rgba(255,255,255,0.6);font-size:12px;">ENQ-${enq.id} · PO Reference: PO-${po.id}</div>
            </div>
            <div style="padding:24px 32px;background:white;">
              <p style="font-size:14px;color:#444;">Dear <strong>${enq.customer_name || "Customer"}</strong>,</p>
              <p style="font-size:13px;color:#444;line-height:1.7;margin:12px 0;">Thank you for confirming your order. Our team will be in touch within 24 hours to arrange payment terms and shipping details.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr style="background:#f8fafc;"><th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0;">PRODUCT</th><th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0;">QTY</th></tr>
                ${products.map(p => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;">${p.name}</td><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${p.qty ? `${p.qty} ${p.unit || "kg"}` : "—"}</td></tr>`).join("")}
              </table>
              <p style="font-size:12px;color:#94a3b8;">Questions? Reply to this email or contact sales@ingredientz.co</p>
            </div>
          </div>`
      });

      // 4. Email to sales team
      await sendEmail({
        to: "sales@ingredientz.co",
        subject: `🎉 PO Received — ENQ-${enq.id} from ${enq.customer_name}`,
        html: `
          <p><strong>Customer:</strong> ${enq.customer_name} (${session.user.email})</p>
          <p><strong>Enquiry:</strong> ENQ-${enq.id}</p>
          <p><strong>PO ID:</strong> PO-${po.id}</p>
          <p><strong>Products:</strong></p>
          <ul>${products.map(p => `<li>${p.name} — ${p.qty || "?"} ${p.unit || "kg"}</li>`).join("")}</ul>
          <p>Login to CRM to process this order.</p>`
      });

      setDone(true);
      onPOCreated();
    } catch(e) {
      alert("Something went wrong: " + e.message);
    } finally {
      setAccepting(false);
    }
  }

  async function requestRevision() {
    if (!revision.trim()) return;
    setRevising(true);
    await sendEmail({
      to: "sales@ingredientz.co",
      subject: `Revision Request — ENQ-${enq.id} from ${enq.customer_name}`,
      html: `<p><strong>Customer:</strong> ${enq.customer_name} (${session.user.email})</p><p><strong>Revision request:</strong> ${revision}</p>`
    });
    await supabase.from("enquiries").update({ notes: (enq.notes || "") + `\n\nRevision request (${new Date().toLocaleDateString()}): ${revision}` }).eq("id", enq.id);
    setRevising(false);
    setRevision("");
    alert("Revision request sent. We'll update your quotation within 24 hours.");
  }

  if (done) return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: "#0D1F3C", marginBottom: 10 }}>Order Confirmed!</h2>
      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>
        Your order has been placed. We've sent a confirmation to <strong>{session.user.email}</strong>.<br/>
        Our team will contact you within 24 hours with payment and shipping details.
      </p>
      <button onClick={onBack} style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
        Back to Dashboard
      </button>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#1877F2", fontSize: 13, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
        ← Back to Enquiries
      </button>

      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
        {/* Header */}
        <div style={{ background: "#0D1F3C", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "white", fontSize: 15, fontWeight: 600 }}>Quotation for ENQ-{enq.id}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>
              {enq.assigned_to && <>Managed by: {enq.assigned_to} · </>}
              {new Date(enq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <span style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 600 }}>
            ✓ Active
          </span>
        </div>

        {/* Product table */}
        <div className="quot-table-wrap" style={{ padding: "0 24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Product", "Qty", "Unit"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 500, color: "#0D1F3C" }}>{p.name}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#64748b" }}>{p.qty || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#64748b" }}>{p.unit || "kg"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="quot-actions" style={{ display: "flex", gap: 10, padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
          <button onClick={acceptQuotation} disabled={accepting}
            style={{ background: "#22c55e", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: accepting ? "not-allowed" : "pointer", opacity: accepting ? 0.7 : 1 }}>
            {accepting ? "Processing…" : "✅ Accept & Place Order"}
          </button>
          <button onClick={() => setRevision(r => r ? "" : " ")}
            style={{ background: "none", border: "1px solid #e2e8f0", color: "#0D1F3C", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer" }}>
            💬 Request Revision
          </button>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", alignSelf: "center" }}>
            Questions? Email sales@ingredientz.co
          </span>
        </div>

        {/* Revision form */}
        {revision !== "" && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9" }}>
            <textarea value={revision} onChange={e => setRevision(e.target.value)} rows={3}
              placeholder="Describe what you'd like revised — pricing, quantity, lead time…"
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "DM Sans,sans-serif" }}/>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={requestRevision} disabled={revising}
                style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                {revising ? "Sending…" : "Send Revision Request"}
              </button>
              <button onClick={() => setRevision("")}
                style={{ background: "none", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 6, padding: "8px 16px", fontSize: 12, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F3C", marginBottom: 16 }}>Enquiry Timeline</div>
        {[
          { title: "Quotation Sent", desc: "Commercial quotation issued", color: "#1877F2", done: true },
          { title: "Sourcing Confirmed", desc: "Supplier confirmed availability", color: "#1877F2", done: true },
          { title: "Enquiry Assigned", desc: `Assigned to ${enq.assigned_to || "our team"}`, color: "#1877F2", done: true },
          { title: "Enquiry Received", desc: "Submitted via ingredientz.co", color: "#94a3b8", done: true },
        ].map((item, i, arr) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < arr.length - 1 ? 4 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0, marginTop: 2 }}/>
              {i < arr.length - 1 && <div style={{ width: 2, background: "#f1f5f9", flex: 1, minHeight: 24, margin: "3px 0" }}/>}
            </div>
            <div style={{ paddingBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0D1F3C" }}>{item.title}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ACCOUNT PAGE ──────────────────────────────────────────────────────────
export default function Account() {
  const [session, setSession]         = useState(null);
  const [enquiries, setEnquiries]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showLogin, setShowLogin]     = useState(false);
  const [activeView, setActiveView]   = useState("enquiries"); // enquiries | quotations | orders
  const [selectedEnq, setSelectedEnq] = useState(null);
  const [mobMenuOpen, setMobMenuOpen] = useState(false);
  const [isSupplier, setIsSupplier]   = useState(false); // also a supplier? -> show workspace switch

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Smart landing: a supplier with no buyer enquiries is sent to /supplier.
  // The ?buyer=1 flag (set by "Buyer account" links from the supplier side) opts out, so no redirect loop.
  useEffect(() => {
    if (!loading && session && isSupplier && enquiries.length === 0 && !searchParams.get("buyer")) {
      navigate("/supplier", { replace: true });
    }
  }, [loading, session, isSupplier, enquiries, searchParams, navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) { loadEnquiries(session.user.email); checkSupplier(session.user.email); }
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session?.user?.email) { loadEnquiries(session.user.email); checkSupplier(session.user.email); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadEnquiries(email) {
    setLoading(true);
    const { data } = await supabase.from("enquiries").select("*").eq("email", email).order("created_at", { ascending: false });
    setEnquiries(data || []);
    setLoading(false);
  }

  async function checkSupplier(email) {
    const { data } = await supabase.from("suppliers").select("id").ilike("email", email).maybeSingle();
    setIsSupplier(!!data);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null); setEnquiries([]); setIsSupplier(false);
  }

  if (!session) return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{styles}</style>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "40px 32px", width: "100%", maxWidth: 400, textAlign: "center" }}>
        <img src="/logo.png" alt="Ingredientz" style={{ height: 36, objectFit: "contain", marginBottom: 20 }}
          onError={e => { e.target.style.display = "none"; }}/>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: "#0D1F3C", fontWeight: 400, marginBottom: 8 }}>Your Account</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.7 }}>
          Login with your business email to track enquiries, view quotations and place orders.
        </p>
        <button onClick={() => setShowLogin(true)}
          style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "12px 32px", fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" }}>
          Login with OTP →
        </button>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 12 }}>No password needed · OTP sent to your email</p>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
          <Link to="/supplier" style={{ color: "#0EA5A0", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            Supplier? Enter the supplier portal →
          </Link>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)}/>}
      </div>
    </div>
  );

  const quotEnquiries = enquiries.filter(e => e.stage === "Quotation Sent" || e.stage === "Awaiting PO");
  const orderEnquiries = enquiries.filter(e => e.stage === "PO Received");
  const activeCount = enquiries.filter(e => !["Lost","No Response"].includes(e.stage)).length;

  const NAV_ITEMS = [
    { id: "enquiries", label: "My Enquiries", icon: "📋", count: enquiries.length },
    { id: "quotations", label: "Quotations", icon: "📄", count: quotEnquiries.length },
    { id: "orders", label: "Orders", icon: "📦", count: orderEnquiries.length },
  ];

  const filteredEnquiries = activeView === "enquiries" ? enquiries
    : activeView === "quotations" ? quotEnquiries
    : orderEnquiries;

  return (
    <div style={{ minHeight: "70vh", background: "#f8fafc" }}>
      <style>{styles}</style>

      {/* Header */}
      <div style={{ background: "#0D1F3C", padding: "28px 0" }}>
        <div className="container">
          <div className="portal-header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: "white", fontWeight: 400 }}>
                {session.user.email.split("@")[0]}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>{session.user.email}</p>
              <span style={{ display: "inline-block", background: "rgba(14,165,160,0.15)", border: "1px solid rgba(14,165,160,0.3)", color: "#2dd4bf", fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, marginTop: 8 }}>
                ⚡ Verified Buyer
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isSupplier && (
                <Link to="/supplier">
                  <button style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.35)", color: "#2dd4bf", borderRadius: 7, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Supplier workspace →
                  </button>
                </Link>
              )}
              <Link to="/enquiry">
                <button style={{ background: "#1877F2", color: "white", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                  + New Enquiry
                </button>
              </Link>
              <button onClick={logout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 7, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="mob-menu" style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 16px", overflowX: "auto", gap: 0 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => { setActiveView(item.id); setSelectedEnq(null); }}
            style={{ background: "none", border: "none", borderBottom: activeView === item.id ? "2px solid #1877F2" : "2px solid transparent", color: activeView === item.id ? "#1877F2" : "#64748b", padding: "12px 16px", fontSize: 12, fontWeight: activeView === item.id ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
            {item.icon} {item.label}
            {item.count > 0 && <span style={{ background: "#1877F2", color: "white", borderRadius: 20, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>{item.count}</span>}
          </button>
        ))}
      </div>

      <div className="container" style={{ padding: "28px 40px" }}>
        {/* Stats */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
          {[
            ["Total Enquiries", enquiries.length, "#1877F2"],
            ["Active Quotations", quotEnquiries.length, "#f59e0b"],
            ["Orders Placed", orderEnquiries.length, "#22c55e"],
            ["Active", activeCount, "#0D1F3C"],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>

        <div className="portal-grid" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
          {/* Sidebar */}
          <div className="portal-sidebar">
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, position: "sticky", top: 80 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Navigation</div>
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => { setActiveView(item.id); setSelectedEnq(null); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, border: "none", background: activeView === item.id ? "#EEF4FF" : "none", color: activeView === item.id ? "#1877F2" : "#64748b", fontSize: 12, fontWeight: activeView === item.id ? 600 : 400, cursor: "pointer", marginBottom: 2, textAlign: "left" }}>
                  <span>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.count > 0 && <span style={{ background: "#1877F2", color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>{item.count}</span>}
                </button>
              ))}
              <div style={{ height: 1, background: "#f1f5f9", margin: "12px 0" }}/>
              {isSupplier && (
                <Link to="/supplier" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, color: "#0EA5A0", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                  🏭 Supplier workspace
                </Link>
              )}
              <Link to="/products" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, color: "#64748b", fontSize: 12, textDecoration: "none" }}>
                🧪 Browse Products
              </Link>
              <Link to="/enquiry" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, color: "#64748b", fontSize: 12, textDecoration: "none" }}>
                + New Enquiry
              </Link>
            </div>
          </div>

          {/* Main */}
          <div>
            {selectedEnq ? (
              <QuotationDetail
                enq={selectedEnq}
                session={session}
                onBack={() => setSelectedEnq(null)}
                onPOCreated={() => { loadEnquiries(session.user.email); }}
              />
            ) : loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading…</div>
            ) : filteredEnquiries.length === 0 ? (
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>
                  {activeView === "quotations" ? "📄" : activeView === "orders" ? "📦" : "📋"}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0D1F3C", marginBottom: 8 }}>
                  {activeView === "quotations" ? "No quotations yet" : activeView === "orders" ? "No orders yet" : "No enquiries yet"}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                  {activeView === "enquiries" ? "Browse our catalogue and submit your first enquiry" : "Quotations appear here once your enquiry is processed"}
                </div>
                <Link to="/products">
                  <button style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    Browse Products
                  </button>
                </Link>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0D1F3C" }}>
                    {activeView === "quotations" ? "Active Quotations" : activeView === "orders" ? "My Orders" : "My Enquiries"}
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400, marginLeft: 8 }}>({filteredEnquiries.length})</span>
                  </div>
                </div>
                {filteredEnquiries.map(enq => (
                  <EnquiryCard key={enq.id} enq={enq} onSelect={setSelectedEnq}/>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
