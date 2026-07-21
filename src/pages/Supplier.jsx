import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { LoginModal } from "../components/Navbar.jsx";
// status chip colours (reuse the portal's STAGE_COLORS palette)
const STATUS = {
  active:           { label: "Approved",      bg: "#F0FDF4", color: "#166534", border: "#bbf7d0" },
  pending_approval: { label: "Pending review",bg: "#FFF7ED", color: "#c2410c", border: "#fed7aa" },
  rejected:         { label: "Needs changes", bg: "#FFF1F2", color: "#be123c", border: "#fecdd3" },
};
const styles = `
  @media (max-width: 768px) {
    .portal-grid { grid-template-columns: 1fr !important; }
    .portal-sidebar { display: none; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .sup-row2, .sup-row3 { grid-template-columns: 1fr !important; }
    .sup-table-wrap { overflow-x: auto; }
    .portal-header-inner { flex-direction: column !important; gap: 8px !important; }
  }
`;
const slugify = (s) =>
  (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// ── reusable bits ────────────────────────────────────────────────────────────
function Chip({ status }) {
  const s = STATUS[status] || STATUS.pending_approval;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}
function DocPill({ have, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 6, padding: "2px 8px",
      fontSize: 11, marginRight: 4,
      background: have ? "#EEF4FF" : "transparent",
      border: `1px solid ${have ? "#bfd6f6" : "#e2e8f0"}`,
      color: have ? "#1877F2" : "#94a3b8",
    }}>{children}</span>
  );
}
const inputStyle = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 11px", fontSize: 13, fontFamily: "DM Sans,sans-serif", color: "#0D1F3C", outline: "none" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 5px" };
const sectionStyle = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "#1877F2", margin: "22px 0 12px", paddingTop: 14, borderTop: "1px solid #f1f5f9" };
const slotStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px dashed #e2e8f0", borderRadius: 10, padding: "11px 13px", marginBottom: 10, background: "#fbfcfe" };
// ── ADD A PRODUCT FORM ─────────────────────────────────────────────────────────
function AddProduct({ supplier, email, categories, onAdded, onUseCatalogue }) {
  const [f, setF] = useState({ name: "", category_id: "", cas: "", hsn: "", unit: "kg", short: "", specs: "", price: "", lead: "", moq: "" });
  const [sug, setSug] = useState([]);
  const [saving, setSaving] = useState(false);
  const coaRef = useRef(null), msdsRef = useRef(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  // live catalogue suggestions
  useEffect(() => {
    const q = f.name.trim();
    if (q.length < 2) { setSug([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase.from("products")
        .select("id, name, cas_number, unit, product_categories(name)")
        .ilike("name", `%${q}%`).limit(4);
      if (!cancelled) setSug(data || []);
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [f.name]);
  async function uploadDoc(file, docType, supplierProductId) {
    const path = `products/${supplier.id}/${supplierProductId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("supplier-docs").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("supplier-docs").getPublicUrl(path);
    await supabase.from("supplier_product_documents").insert({
      supplier_product_id: supplierProductId, doc_type: docType,
      file_url: data.publicUrl, file_name: file.name, uploaded_by: email,
    });
  }
  async function submit() {
    if (!f.name.trim()) { alert("Please enter a product name."); return; }
    setSaving(true);
    try {
      // 1) create the product as pending approval
      const { data: prod, error: e1 } = await supabase.from("products").insert({
        name: f.name.trim(),
        slug: `${slugify(f.name)}-${Date.now()}`,
        category_id: f.category_id || null,
        short_description: f.short || null,
        specifications: f.specs ? { notes: f.specs } : null,
        cas_number: f.cas || null,
        hsn_code: f.hsn || null,
        unit: f.unit,
        status: "pending",
        created_by: email,
      }).select().single();
      if (e1) throw e1;
      // 2) link it to this supplier (pending approval)
      const { data: sp, error: e2 } = await supabase.from("supplier_products").insert({
        supplier_id: supplier.id, product_id: prod.id, submitted_by_supplier: true,
        status: "pending_approval",
        price_usd: f.price ? Number(f.price) : null,
        lead_time_days: f.lead ? Number(f.lead) : null,
        min_order_qty: f.moq ? Number(f.moq) : null,
        unit: f.unit,
      }).select().single();
      // if linking fails, remove the product we just created so nothing is left half-saved
      if (e2) { await supabase.from("products").delete().eq("id", prod.id); throw e2; }
      // 3) upload any documents (best effort — a doc hiccup won't undo the submission)
      try {
        if (coaRef.current?.files?.[0])  await uploadDoc(coaRef.current.files[0], "coa", sp.id);
        if (msdsRef.current?.files?.[0]) await uploadDoc(msdsRef.current.files[0], "msds", sp.id);
      } catch (docErr) { console.error("Document upload failed:", docErr); }
      // 4) notify the Ingredientz team that something is waiting for approval (best effort)
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            from: "Ingredientz <sales@mail.ingredientz.co>",
            to: "sales@ingredientz.co",
            reply_to: "sales@ingredientz.co",
            subject: `New supplier product pending — ${f.name.trim()} (${supplier.company || ""})`,
            html: `<p>A supplier submitted a new product for approval.</p>
                   <p><b>Supplier:</b> ${supplier.company || email}</p>
                   <p><b>Product:</b> ${f.name.trim()}</p>
                   <p>Review it in the CRM &rarr; Approvals.</p>`,
          },
        });
      } catch (notifyErr) { console.error("Admin notify failed:", notifyErr); }
      alert("Submitted for approval. We'll email you when it's reviewed.");
      onAdded();
    } catch (err) {
      alert("Something went wrong: " + err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
      <div className="sup-row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ marginBottom: 14, position: "relative" }}>
          <label style={labelStyle}>Product name</label>
          <input style={inputStyle} value={f.name} onChange={set("name")} autoComplete="off"
            placeholder="e.g. Ashwagandha Extract 5% Withanolides" />
          {sug.length > 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4, background: "white", border: "1px solid #1877F2", borderRadius: 10, overflow: "hidden", zIndex: 20, boxShadow: "0 10px 28px rgba(13,31,60,.12)" }}>
              <div style={{ fontSize: 10, letterSpacing: ".5px", textTransform: "uppercase", color: "#1877F2", padding: "9px 12px", borderBottom: "1px solid #f1f5f9", fontWeight: 600 }}>
                Similar products already in our catalogue — pick one to skip approval
              </div>
              {sug.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: "1px solid #f8fafc", fontSize: 12.5 }}>
                  <div>{p.name}<small style={{ display: "block", color: "#94a3b8", fontSize: 11 }}>{p.product_categories?.name || "—"}{p.cas_number ? ` · CAS ${p.cas_number}` : ""}</small></div>
                  <button onClick={() => onUseCatalogue(p)} style={{ background: "#1877F2", color: "white", border: "none", borderRadius: 6, padding: "5px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Use this</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Category</label>
          <select style={inputStyle} value={f.category_id} onChange={set("category_id")}>
            <option value="">Select a category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="sup-row3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>CAS number</label><input style={inputStyle} value={f.cas} onChange={set("cas")} placeholder="optional" /></div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>HSN code</label><input style={inputStyle} value={f.hsn} onChange={set("hsn")} placeholder="optional" /></div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Unit</label>
          <select style={inputStyle} value={f.unit} onChange={set("unit")}><option>kg</option><option>g</option><option>L</option><option>ton</option></select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}><label style={labelStyle}>Short description</label><input style={inputStyle} value={f.short} onChange={set("short")} placeholder="One line buyers will see" /></div>
      <div style={{ marginBottom: 14 }}><label style={labelStyle}>Specifications</label><textarea style={{ ...inputStyle, minHeight: 62, resize: "vertical" }} value={f.specs} onChange={set("specs")} placeholder="Assay, particle size, solvent, origin…" /></div>
      <div style={sectionStyle}>Your commercial terms</div>
      <div className="sup-row3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Your price (USD)</label><input style={inputStyle} value={f.price} onChange={set("price")} placeholder="28.00" /></div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Lead time (days)</label><input style={inputStyle} value={f.lead} onChange={set("lead")} placeholder="21" /></div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Min order qty</label><input style={inputStyle} value={f.moq} onChange={set("moq")} placeholder="100" /></div>
      </div>
      <div style={sectionStyle}>Product documents</div>
      <div style={slotStyle}>
        <div><b style={{ display: "block", fontSize: 13 }}>Certificate of Analysis (CoA)</b><span style={{ color: "#94a3b8", fontSize: 11.5 }}>PDF · recommended</span></div>
        <input type="file" ref={coaRef} accept=".pdf,.png,.jpg,.jpeg" style={{ fontSize: 12 }} />
      </div>
      <div style={slotStyle}>
        <div><b style={{ display: "block", fontSize: 13 }}>Safety Data Sheet (MSDS)</b><span style={{ color: "#94a3b8", fontSize: 11.5 }}>PDF · recommended</span></div>
        <input type="file" ref={msdsRef} accept=".pdf,.png,.jpg,.jpeg" style={{ fontSize: 12 }} />
      </div>
      <div style={{ marginTop: 18 }}>
        <button onClick={submit} disabled={saving}
          style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Submitting…" : "Submit for approval"}
        </button>
        <span style={{ color: "#94a3b8", marginLeft: 10, fontSize: 12 }}>We'll review and email you.</span>
      </div>
    </div>
  );
}
// ── ADD FROM CATALOGUE ───────────────────────────────────────────────────────
function Catalogue({ supplier, onAdded }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const query = supabase.from("products").select("id, name, cas_number, unit, product_categories(name)").limit(12);
      const { data } = q.trim() ? await query.ilike("name", `%${q.trim()}%`) : await query.order("name");
      if (!cancelled) setRows(data || []);
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);
  async function supplyThis(p) {
    setBusy(p.id);
    try {
      const { error } = await supabase.from("supplier_products").insert({
        supplier_id: supplier.id, product_id: p.id, submitted_by_supplier: true,
        status: "active", unit: p.unit || "kg",
      });
      if (error) throw error;
      alert(`Added "${p.name}" to your products.`);
      onAdded();
    } catch (err) {
      alert("Something went wrong: " + err.message);
    } finally { setBusy(null); }
  }
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
      <p style={{ marginBottom: 12, fontSize: 13, color: "#475569" }}>Already in our catalogue? Pick what you supply — no approval needed.</p>
      <div style={{ marginBottom: 14 }}><input style={inputStyle} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the Ingredientz catalogue…" /></div>
      {rows.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 13px", marginBottom: 8 }}>
          <div style={{ fontSize: 13 }}>{p.name}<br /><small style={{ color: "#94a3b8" }}>{p.product_categories?.name || "—"}{p.cas_number ? ` · CAS ${p.cas_number}` : ""}</small></div>
          <button onClick={() => supplyThis(p)} disabled={busy === p.id}
            style={{ background: "#1877F2", color: "white", border: "none", borderRadius: 6, padding: "5px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: busy === p.id ? 0.6 : 1 }}>
            {busy === p.id ? "Adding…" : "+ I supply this"}
          </button>
        </div>
      ))}
      {rows.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>No matches.</div>}
    </div>
  );
}
// ── COMPANY DOCUMENTS ──────────────────────────────────────────────────────────
function CompanyDocs({ supplier, email, docs, onChanged }) {
  const [busy, setBusy] = useState(false);
  async function upload(file, docType, label) {
    if (!file) return;
    setBusy(true);
    try {
      const path = `company/${supplier.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("supplier-docs").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("supplier-docs").getPublicUrl(path);
      await supabase.from("supplier_documents").insert({
        supplier_id: supplier.id, doc_type: docType, label,
        file_url: data.publicUrl, file_name: file.name, uploaded_by: email,
      });
      onChanged();
    } catch (err) { alert("Something went wrong: " + err.message); }
    finally { setBusy(false); }
  }
  const have = (t) => docs.find((d) => d.doc_type === t);
  const Slot = ({ type, title, hint }) => {
    const d = have(type);
    return (
      <div style={slotStyle}>
        <div><b style={{ display: "block", fontSize: 13 }}>{title}</b>
          <span style={{ color: d ? "#166534" : "#94a3b8", fontSize: 11.5 }}>{d ? `Uploaded · ${d.file_name}` : hint}</span></div>
        <label style={{ background: "none", color: "#0D1F3C", border: "1px solid #e2e8f0", borderRadius: 7, padding: "7px 13px", fontSize: 12, cursor: "pointer" }}>
          {d ? "Replace" : "Choose file"}
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} disabled={busy}
            onChange={(e) => upload(e.target.files?.[0], type, title)} />
        </label>
      </div>
    );
  };
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
      <p style={{ marginTop: 0, marginBottom: 14, fontSize: 12.5, color: "#94a3b8" }}>Shared across all your products. These also appear on your company profile.</p>
      <Slot type="gmp" title="GMP certificate" hint="Not uploaded" />
      <Slot type="iso" title="ISO certificate" hint="Not uploaded" />
      <Slot type="profile" title="Company profile / brochure" hint="Not uploaded" />
    </div>
  );
}
// ── APPLY TO SUPPLY (first-time onboarding) ─────────────────────────────────────
function ApplyForm({ email, onApplied, onLogout }) {
  const [f, setF] = useState({ company: "", contact_name: "", country: "", phone: "", website: "", description: "", doc_type: "gmp" });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  async function submit() {
    if (!f.company.trim()) { alert("Please enter your company name."); return; }
    if (!fileRef.current?.files?.[0]) { alert("Please attach your GMP certificate or manufacturing licence."); return; }
    setSaving(true);
    try {
      // 1) create the supplier profile as Pending
      const { data: sup, error: e1 } = await supabase.from("suppliers").insert({
        company: f.company.trim(),
        slug: `${slugify(f.company)}-${Date.now()}`,
        email,
        status: "pending",
        contact_name: f.contact_name || null,
        country: f.country || null,
        phone: f.phone || null,
        website: f.website || null,
        description: f.description || null,
      }).select().single();
      if (e1) throw e1;
      // 2) upload the one required document
      const file = fileRef.current.files[0];
      const path = `company/${sup.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("supplier-docs").upload(path, file);
      if (!upErr) {
        const { data: pub } = supabase.storage.from("supplier-docs").getPublicUrl(path);
        await supabase.from("supplier_documents").insert({
          supplier_id: sup.id, doc_type: f.doc_type,
          label: f.doc_type === "gmp" ? "GMP certificate" : "Manufacturing licence",
          file_url: pub.publicUrl, file_name: file.name, uploaded_by: email,
        });
      }
      // 3) notify the Ingredientz team (best effort)
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            from: "Ingredientz <sales@mail.ingredientz.co>",
            to: "sales@ingredientz.co", reply_to: "sales@ingredientz.co",
            subject: `New supplier application — ${f.company.trim()}`,
            html: `<p>A new supplier has applied and is awaiting approval.</p>
                   <p><b>Company:</b> ${f.company.trim()}</p>
                   <p><b>Contact:</b> ${f.contact_name || "—"} · ${email}</p>
                   <p><b>Country:</b> ${f.country || "—"}</p>
                   <p>Review in the CRM &rarr; Approvals.</p>`,
          },
        });
      } catch (notifyErr) { console.error("Notify failed:", notifyErr); }
      onApplied();
    } catch (err) {
      alert("Something went wrong: " + err.message);
    } finally { setSaving(false); }
  }
  return (
    <div style={{ minHeight: "70vh", background: "#f8fafc" }}>
      <style>{styles}</style>
      <div style={{ background: "#0D1F3C", padding: "28px 0" }}>
        <div className="container">
          <div style={{ padding: "0 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: "white", fontWeight: 400 }}>Become a supplier</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>{email}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/account?buyer=1"><button style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "white", borderRadius: 7, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>I'm a buyer</button></Link>
              <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 7, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>Logout</button>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: "28px 40px", maxWidth: 820, margin: "0 auto" }}>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 18 }}>
          Tell us about your company and attach one credential. We'll review your application — once approved, your products
          go live to buyers. You can start adding products straight after applying.
        </p>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div className="sup-row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Company name *</label><input style={inputStyle} value={f.company} onChange={set("company")} placeholder="e.g. Acme Botanicals Pvt. Ltd." /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Contact person</label><input style={inputStyle} value={f.contact_name} onChange={set("contact_name")} placeholder="Your name" /></div>
          </div>
          <div className="sup-row3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Country</label><input style={inputStyle} value={f.country} onChange={set("country")} placeholder="e.g. India" /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Phone</label><input style={inputStyle} value={f.phone} onChange={set("phone")} placeholder="optional" /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Website</label><input style={inputStyle} value={f.website} onChange={set("website")} placeholder="optional" /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>About your company</label><textarea style={{ ...inputStyle, minHeight: 62, resize: "vertical" }} value={f.description} onChange={set("description")} placeholder="What you make, capabilities, certifications…" /></div>
          <div style={sectionStyle}>One credential (required)</div>
          <div className="sup-row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "end" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Document type</label>
              <select style={inputStyle} value={f.doc_type} onChange={set("doc_type")}>
                <option value="gmp">GMP certificate</option>
                <option value="manufacturing_license">Manufacturing licence</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Upload file (PDF) *</label>
              <input type="file" ref={fileRef} accept=".pdf,.png,.jpg,.jpeg" style={{ fontSize: 12 }} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={submit} disabled={saving}
              style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Submitting…" : "Apply to supply"}
            </button>
            <span style={{ color: "#94a3b8", marginLeft: 10, fontSize: 12 }}>We'll review and email you.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
// ── MAIN SUPPLIER PAGE ──────────────────────────────────────────────────────────
export default function Supplier() {
  const [session, setSession]   = useState(null);
  const [supplier, setSupplier] = useState(undefined); // undefined = unknown, null = not a supplier
  const [products, setProducts] = useState([]);
  const [companyDocs, setCompanyDocs] = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [tab, setTab]           = useState("list"); // list | add | excel | cat
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) init(session.user.email); else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session?.user?.email) init(session.user.email);
    });
    return () => subscription.unsubscribe();
  }, []);
  async function init(email) {
    setLoading(true);
    const { data: sup } = await supabase.from("suppliers").select("*").ilike("email", email).maybeSingle();
    setSupplier(sup || null);
    if (sup) {
      await Promise.all([loadProducts(sup.id), loadCompanyDocs(sup.id), loadCategories()]);
    }
    setLoading(false);
  }
  async function loadProducts(supplierId) {
    const { data } = await supabase.from("supplier_products")
      .select("*, products(name, unit, product_categories(name)), supplier_product_documents(doc_type)")
      .eq("supplier_id", supplierId).order("created_at", { ascending: false });
    setProducts(data || []);
  }
  async function loadCompanyDocs(supplierId) {
    const { data } = await supabase.from("supplier_documents").select("*").eq("supplier_id", supplierId);
    setCompanyDocs(data || []);
  }
  async function loadCategories() {
    const { data } = await supabase.from("product_categories").select("id, name").order("name");
    setCategories(data || []);
  }
  function reload() { if (supplier) { loadProducts(supplier.id); loadCompanyDocs(supplier.id); } setTab("list"); }
  async function logout() { await supabase.auth.signOut(); setSession(null); setSupplier(undefined); setProducts([]); }
  // ── not logged in ──
  if (!session) return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{styles}</style>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "40px 32px", width: "100%", maxWidth: 400, textAlign: "center" }}>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: "#0D1F3C", fontWeight: 400, marginBottom: 8 }}>Supplier Portal</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.7 }}>Log in with your business email to manage your products, documents and quotations. <b>New supplier?</b> Just log in — you can apply to supply right after.</p>
        <button onClick={() => setShowLogin(true)} style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "12px 32px", fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" }}>Login with OTP →</button>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 12 }}>No password needed · OTP sent to your email</p>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
          <Link to="/account?buyer=1" style={{ color: "#1877F2", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            Are you a buyer? Buyer account →
          </Link>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} redirectTo="/supplier" />}
      </div>
    </div>
  );
  if (loading) return (<div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}><style>{styles}</style>Loading…</div>);
  // ── logged in but not a supplier yet → application form ──
  if (!supplier) return <ApplyForm email={session.user.email} onApplied={() => init(session.user.email)} onLogout={logout} />;
  // ── supplier dashboard ──
  const approved = products.filter((p) => p.status === "active").length;
  const pending  = products.filter((p) => p.status === "pending_approval").length;
  const rejected = products.filter((p) => p.status === "rejected").length;
  const TABS = [["list", "My list"], ["add", "Add a product"], ["excel", "Upload Excel"], ["cat", "Add from catalogue"]];
  const useCatalogueProduct = async (p) => {
    try {
      const { error } = await supabase.from("supplier_products").insert({
        supplier_id: supplier.id, product_id: p.id, submitted_by_supplier: true, status: "active", unit: p.unit || "kg",
      });
      if (error) throw error;
      alert(`Added "${p.name}" to your products.`); reload();
    } catch (err) { alert("Something went wrong: " + err.message); }
  };
  return (
    <div style={{ minHeight: "70vh", background: "#f8fafc" }}>
      <style>{styles}</style>
      {/* Header */}
      <div style={{ background: "#0D1F3C", padding: "28px 0" }}>
        <div className="container">
          <div className="portal-header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: "white", fontWeight: 400 }}>{supplier.company || session.user.email.split("@")[0]}</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>{session.user.email}</p>
              {supplier.status === "active" ? (
                <span style={{ display: "inline-block", background: "rgba(14,165,160,0.15)", border: "1px solid rgba(14,165,160,0.3)", color: "#2dd4bf", fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, marginTop: 8 }}>⚡ Verified Supplier</span>
              ) : (
                <span style={{ display: "inline-block", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#fbbf24", fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, marginTop: 8 }}>⏳ Awaiting approval</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setTab("add")} style={{ background: "#1877F2", color: "white", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>+ Add product</button>
              <button onClick={logout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 7, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>Logout</button>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: "28px 40px" }}>
        {supplier.status !== "active" && (
          <div style={{ background: "#FFF7ED", border: "1px solid #fed7aa", color: "#9a5413", borderRadius: 10, padding: "13px 16px", fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
            <b>Your supplier account is awaiting approval.</b> You can add products and complete your company details now —
            everything goes live to buyers once our team approves your account. We'll email you when you're approved.
          </div>
        )}
        {/* Stats */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
          {[["Approved", approved, "#22c55e"], ["Pending review", pending, "#f59e0b"], ["Needs changes", rejected, "#be123c"], ["Total products", products.length, "#1877F2"]].map(([label, val, color]) => (
            <div key={label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
        {pending > 0 && (
          <div style={{ background: "#FFF7ED", border: "1px solid #fed7aa", color: "#9a5413", borderRadius: 10, padding: "11px 14px", fontSize: 13, marginBottom: 22 }}>
            Pending products are awaiting Ingredientz approval — not visible to buyers yet. We'll email you when each is reviewed.
          </div>
        )}
        <div className="portal-grid" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
          {/* Sidebar */}
          <div className="portal-sidebar">
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, position: "sticky", top: 80 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Navigation</div>
              <button onClick={() => setTab("list")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, border: "none", background: tab === "list" ? "#EEF4FF" : "none", color: tab === "list" ? "#1877F2" : "#64748b", fontSize: 12, fontWeight: tab === "list" ? 600 : 400, cursor: "pointer", marginBottom: 2, textAlign: "left" }}>
                🧪 <span style={{ flex: 1 }}>My products</span>
                {products.length > 0 && <span style={{ background: "#1877F2", color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>{products.length}</span>}
              </button>
              <div style={{ height: 1, background: "#f1f5f9", margin: "12px 0" }} />
              <Link to="/account?buyer=1" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, color: "#64748b", fontSize: 12, textDecoration: "none" }}>👤 Buyer account</Link>
              <Link to="/products" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, color: "#64748b", fontSize: 12, textDecoration: "none" }}>🧪 Browse catalogue</Link>
            </div>
          </div>
          {/* Main */}
          <div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {TABS.map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ padding: "8px 15px", borderRadius: 8, border: `1px solid ${tab === id ? "#0D1F3C" : "#e2e8f0"}`, background: tab === id ? "#0D1F3C" : "white", color: tab === id ? "white" : "#64748b", fontSize: 12.5, fontWeight: tab === id ? 600 : 400, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            {tab === "list" && (
              products.length === 0 ? (
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🧪</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0D1F3C", marginBottom: 8 }}>No products yet</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Add a product, upload an Excel, or pick from our catalogue.</div>
                  <button onClick={() => setTab("add")} style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Add a product</button>
                </div>
              ) : (
                <div className="sup-table-wrap" style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: "#f8fafc" }}>
                      {["Product", "Category", "Your price", "Lead", "MOQ", "Docs", "Status"].map((h) => (
                        <th key={h} style={{ textAlign: "left", fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", padding: "11px 12px", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {products.map((sp) => {
                        const docTypes = (sp.supplier_product_documents || []).map((d) => d.doc_type);
                        return (
                          <tr key={sp.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 600, color: "#0D1F3C" }}>{sp.products?.name || "—"}</td>
                            <td style={{ padding: "11px 12px", fontSize: 13, color: "#64748b" }}>{sp.products?.product_categories?.name || "—"}</td>
                            <td style={{ padding: "11px 12px", fontSize: 13, color: "#64748b" }}>{sp.price_usd != null ? `$${sp.price_usd}/${sp.unit || "kg"}` : "—"}</td>
                            <td style={{ padding: "11px 12px", fontSize: 13, color: "#64748b" }}>{sp.lead_time_days != null ? `${sp.lead_time_days}d` : "—"}</td>
                            <td style={{ padding: "11px 12px", fontSize: 13, color: "#64748b" }}>{sp.min_order_qty != null ? `${sp.min_order_qty}${sp.unit || "kg"}` : "—"}</td>
                            <td style={{ padding: "11px 12px" }}>
                              <DocPill have={docTypes.includes("coa")}>CoA</DocPill>
                              <DocPill have={docTypes.includes("msds")}>MSDS</DocPill>
                            </td>
                            <td style={{ padding: "11px 12px" }}><Chip status={sp.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
            {tab === "add" && <AddProduct supplier={supplier} email={session.user.email} categories={categories} onAdded={reload} onUseCatalogue={useCatalogueProduct} />}
            {tab === "cat" && <Catalogue supplier={supplier} onAdded={reload} />}
            {tab === "excel" && (
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                <p style={{ marginBottom: 12, fontSize: 13, color: "#475569" }}>Bulk upload from an Excel file is coming in the next update.</p>
                <p style={{ fontSize: 12.5, color: "#94a3b8" }}>For now, add products one at a time under <b>Add a product</b>, or pick from our catalogue.</p>
              </div>
            )}
            <div style={{ ...sectionStyle, marginTop: 26 }}>Company documents</div>
            <CompanyDocs supplier={supplier} email={session.user.email} docs={companyDocs} onChanged={() => loadCompanyDocs(supplier.id)} />
          </div>
        </div>
      </div>
    </div>
  );
}
