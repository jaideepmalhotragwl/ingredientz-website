import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { sendCustomerAcknowledgment } from "../lib/enquiryEmail.js";

export default function Enquiry({ lang, cart, onRemoveFromCart, onClearCart }) {
  const [form, setForm] = useState({ company:"", contact:"", email:"", phone:"", country:"", notes:"" });
  const [customProduct, setCustomProduct] = useState("");
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function setF(k,v) { setForm(f => ({...f,[k]:v})); }

  async function submit(e) {
    e.preventDefault();
    if (!form.email) { setError("Email is required"); return; }
    if (cart.length === 0 && !customProduct.trim()) { setError("Please add at least one product"); return; }
    setSubmitting(true); setError("");

    try {
      const products = [
        ...cart.map(p => ({ name: p.name, qty: quantities[p.id] || "", unit: p.unit || "kg", product_id: p.id })),
        ...(customProduct.trim() ? [{ name: customProduct.trim(), qty: "", unit: "kg" }] : [])
      ];

      // Create enquiry in CRM
      const { data: enquiry, error: enqErr } = await supabase.from("enquiries").insert({
        customer_name: form.company || form.email,
        contact_person: form.contact || form.company,
        email: form.email,
        phone: form.phone,
        country: form.country,
        stage: "New Enquiry",
        priority: "Medium",
        source: "Website",
        products,
        notes: form.notes,
        created_by: "Website Portal"
      }).select().single();

      if (enqErr) throw enqErr;

      // Send the customer an instant branded acknowledgment via Resend.
      // Wrapped so that even if the email hiccups, the enquiry is still saved
      // and the customer still sees the success screen.
      try {
        const greetingName = form.contact || form.company || "there";
        await sendCustomerAcknowledgment({
          toEmail: form.email,
          greetingName,
          products,
        });
      } catch (ackErr) {
        console.error("Acknowledgment email failed (enquiry still saved):", ackErr);
      }

      onClearCart();
      setDone(true);
    } catch(e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: 32 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✓</div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#0D1F3C", marginBottom: 12 }}>Enquiry Submitted!</h1>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
          Thank you. We've received your enquiry and sent a confirmation to <strong>{form.email}</strong>. Our team will respond with a commercial quotation within <strong>48 hours</strong>.
        </p>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
          You can track your enquiry by logging in with an OTP sent to your email.
        </p>
        <Link to="/products">
          <button style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "11px 28px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Continue Browsing
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "70vh" }}>
      <div style={{ background: "#0D1F3C", padding: "36px 0" }}>
        <div className="container">
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "white", fontWeight: 400, letterSpacing: -0.5 }}>Request a Quote</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 6 }}>Fill in your details and we'll respond within 48 hours</p>
        </div>
      </div>

      <div className="container" style={{ padding: "40px 32px" }}>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32 }}>

            {/* Left: contact form */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0D1F3C", marginBottom: 20 }}>Your Details</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {[["Company Name","company","text","Acme Nutrition Ltd"],["Contact Person","contact","text","John Smith"],["Business Email *","email","email","john@acmenutrition.com"],["Phone","phone","tel","+1 234 567 8900"],["Country","country","text","United States"]].map(([label,key,type,ph]) => (
                  <div key={key} style={{ gridColumn: key === "email" || key === "notes" ? "span 2" : "span 1" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>{label}</label>
                    <input type={type} value={form[key]} onChange={e => setF(key, e.target.value)} placeholder={ph}
                      style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none" }}/>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Additional Notes</label>
                <textarea value={form.notes} onChange={e => setF("notes", e.target.value)} rows={4} placeholder="Any specific requirements, certifications needed, delivery timeline…"
                  style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", resize: "vertical" }}/>
              </div>
            </div>

            {/* Right: cart summary */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0D1F3C", marginBottom: 20 }}>Your Enquiry ({cart.length} products)</h2>

              {cart.length === 0 && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>No products added yet. <Link to="/products" style={{ color: "#1877F2" }}>Browse catalogue →</Link></div>
                </div>
              )}

              {cart.map(p => (
                <div key={p.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{p.product_categories?.name}</div>
                  </div>
                  <input type="number" placeholder={`Qty (${p.unit||"kg"})`} value={quantities[p.id]||""}
                    onChange={e => setQuantities(q => ({...q,[p.id]:e.target.value}))}
                    style={{ width: 90, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 8px", fontSize: 11, outline: "none" }}/>
                  <button type="button" onClick={() => onRemoveFromCart(p.id)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
              ))}

              {/* Formula tool prompt — for customers sourcing a whole formula */}
              <Link to="/formula" style={{ display:"block", textDecoration:"none", marginBottom: 12 }}>
                <div style={{ background:"#f0fdfa", border:"1px solid #99f6e4", borderRadius:10, padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:20 }}>🔬</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#0D1F3C" }}>Sourcing a full formula?</div>
                    <div style={{ fontSize:11, color:"#0f766e" }}>Upload your product label — we'll quantify every ingredient. Label to Ingredients →</div>
                  </div>
                </div>
              </Link>

              {/* Custom product */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
                  Can't find your product? Add manually:
                </label>
                <input value={customProduct} onChange={e => setCustomProduct(e.target.value)}
                  placeholder="e.g. Curcumin 95% Extract, 100kg"
                  style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 12, outline: "none" }}/>
              </div>

              {error && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{error}</div>}

              <button type="submit" disabled={submitting}
                style={{ width: "100%", background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Submitting…" : "Submit Enquiry →"}
              </button>
              <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 10 }}>
                Your account will be created automatically. Login with OTP to track your enquiry.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
