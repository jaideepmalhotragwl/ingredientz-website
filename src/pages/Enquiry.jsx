import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import CountryPhoneFields from "../components/CountryPhone.jsx";

export default function Enquiry({ lang, cart, onRemoveFromCart, onClearCart }) {
  const [form, setForm] = useState({ company:"", contact:"", email:"", notes:"" });
  const [loc, setLoc] = useState({ iso2:null, name:"", dial:"", national:"" });
  const [customProduct, setCustomProduct] = useState("");
  const [customQty, setCustomQty] = useState("");
  const [customTBC, setCustomTBC] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [qtyTBC, setQtyTBC] = useState({});      // product id -> "quantity to confirm"
  const [flagQty, setFlagQty] = useState(false); // highlight rows after a failed submit
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function setF(k,v) { setForm(f => ({...f,[k]:v})); }

  // A product is answered if it has a positive quantity OR is explicitly marked to confirm.
  function qtyAnswered(id) {
    return qtyTBC[id] === true || Number(quantities[id]) > 0;
  }

  function toggleTBC(id) {
    setQtyTBC(t => {
      const next = { ...t, [id]: !t[id] };
      if (next[id]) setQuantities(q => ({ ...q, [id]: "" })); // clear the number when marking TBC
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    // Company name is required. Without it the enquiry lands with an email
    // address in the company field, which then has to be cleaned up by hand.
    if (!form.company.trim()) { setError("Company name is required"); return; }
    if (!form.email) { setError("Email is required"); return; }
    if (!loc.iso2) { setError("Please select your country"); return; }
    if (!loc.national.trim()) { setError("Phone number is required"); return; }
    if (cart.length === 0 && !customProduct.trim()) { setError("Please add at least one product"); return; }

    // Every product needs a quantity, or an explicit "to confirm".
    const missing = cart.filter(p => !qtyAnswered(p.id));
    if (missing.length > 0) {
      setFlagQty(true);
      setError(
        missing.length === 1
          ? `Add a quantity for ${missing[0].name}, or mark it "To confirm".`
          : `Add a quantity for ${missing.length} products, or mark them "To confirm".`
      );
      return;
    }
    if (customProduct.trim() && !customTBC && !(Number(customQty) > 0)) {
      setFlagQty(true);
      setError(`Add a quantity for "${customProduct.trim()}", or mark it "To confirm".`);
      return;
    }

    setSubmitting(true); setError(""); setFlagQty(false);

    try {
      const products = [
        ...cart.map(p => ({
          name: p.name,
          qty: qtyTBC[p.id] ? "" : (quantities[p.id] || ""),
          unit: p.unit || "kg",
          qty_status: qtyTBC[p.id] ? "to_confirm" : "specified",
          product_id: p.id
        })),
        ...(customProduct.trim() ? [{
          name: customProduct.trim(),
          qty: customTBC ? "" : (customQty || ""),
          unit: "kg",
          qty_status: customTBC ? "to_confirm" : "specified"
        }] : [])
      ];

      const phoneFull = `${loc.dial} ${loc.national}`.trim();

      // Match this buyer to an existing company and contact, or create both.
      // Same function the CRM and the inbound parser use, so the rule lives
      // in one place. A failure here must not lose the enquiry, so it is
      // wrapped — the enquiry still saves, just without the links.
      let companyId = null, customerId = null;
      try {
        const { data: match, error: matchErr } = await supabase.rpc(
          "resolve_company_and_contact",
          {
            p_email:        form.email.trim().toLowerCase(),
            p_company_name: form.company.trim(),
            p_contact_name: form.contact.trim() || null,
            p_country_iso2: loc.iso2,
            p_phone:        phoneFull || null,
            p_created_by:   "website",
          }
        );
        if (!matchErr && match) {
          companyId  = match.company_id  ?? null;
          customerId = match.customer_id ?? null;
        }
      } catch (mErr) {
        console.error("Company match failed (enquiry still saved):", mErr);
      }

      // Create enquiry in CRM.
      // The customer acknowledgment and the sales alert are BOTH sent by the
      // notify_new_enquiry() trigger on this table — do not send email from here.
      const { data: enquiry, error: enqErr } = await supabase.from("enquiries").insert({
        company_id: companyId,
        customer_id: customerId,
        customer_name: form.company.trim(),
        contact_person: form.contact || form.company,
        email: form.email,
        phone: phoneFull,
        phone_dial: loc.dial,
        phone_national: loc.national,
        country: loc.name,
        country_iso2: loc.iso2,
        stage: "New Enquiry",
        priority: "Medium",
        source: "Website",
        products,
        notes: form.notes,
        created_by: "Website Portal"
      }).select().single();

      if (enqErr) throw enqErr;

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
                {[["Company Name *","company","text","Acme Nutrition Ltd"],["Contact Person","contact","text","John Smith"],["Business Email *","email","email","john@acmenutrition.com"]].map(([label,key,type,ph]) => (
                  <div key={key} style={{ gridColumn: key === "email" ? "span 2" : "span 1" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>{label}</label>
                    <input type={type} value={form[key]} onChange={e => setF(key, e.target.value)} placeholder={ph}
                      style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none" }}/>
                  </div>
                ))}

                {/* Country + Phone — linked, both required */}
                <CountryPhoneFields value={loc} onChange={setLoc} />
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

              {cart.map(p => {
                const tbc = qtyTBC[p.id] === true;
                const needsQty = flagQty && !qtyAnswered(p.id);
                return (
                  <div key={p.id} style={{ background: "white", border: `1px solid ${needsQty ? "#ef4444" : "#e2e8f0"}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{p.product_categories?.name}</div>
                      </div>
                      <input type="number" min="0" disabled={tbc}
                        placeholder={tbc ? "To confirm" : `Qty (${p.unit||"kg"}) *`}
                        value={tbc ? "" : (quantities[p.id]||"")}
                        onChange={e => setQuantities(q => ({...q,[p.id]:e.target.value}))}
                        style={{ width: 96, border: `1px solid ${needsQty ? "#ef4444" : "#e2e8f0"}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, outline: "none", background: tbc ? "#f8fafc" : "white", color: tbc ? "#94a3b8" : "#0f172a" }}/>
                      <button type="button" onClick={() => onRemoveFromCart(p.id)}
                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 10.5, color: "#64748b", cursor: "pointer" }}>
                      <input type="checkbox" checked={tbc} onChange={() => toggleTBC(p.id)} style={{ cursor: "pointer", margin: 0 }}/>
                      I'll confirm this quantity later
                    </label>
                    {needsQty && (
                      <div style={{ fontSize: 10.5, color: "#ef4444", marginTop: 5 }}>
                        Enter a quantity, or tick the box above.
                      </div>
                    )}
                  </div>
                );
              })}

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
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={customProduct} onChange={e => setCustomProduct(e.target.value)}
                    placeholder="e.g. Curcumin 95% Extract"
                    style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 12, outline: "none" }}/>
                  <input type="number" min="0" disabled={customTBC}
                    value={customTBC ? "" : customQty}
                    onChange={e => setCustomQty(e.target.value)}
                    placeholder={customTBC ? "To confirm" : "Qty (kg)"}
                    style={{ width: 96, border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 10px", fontSize: 12, outline: "none", background: customTBC ? "#f8fafc" : "white" }}/>
                </div>
                {customProduct.trim() && (
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 10.5, color: "#64748b", cursor: "pointer" }}>
                    <input type="checkbox" checked={customTBC} onChange={() => { setCustomTBC(v => !v); setCustomQty(""); }} style={{ cursor: "pointer", margin: 0 }}/>
                    I'll confirm this quantity later
                  </label>
                )}
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
