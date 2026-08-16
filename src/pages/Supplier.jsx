import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { LoginModal } from "../components/Navbar.jsx";
// status chip colours (reuse the portal's STAGE_COLORS palette)
const STATUS = {
  active:           { label: "Approved",      bg: "#F0FDF4", color: "#166534", border: "#bbf7d0" },
  pending_approval: { label: "Pending review",bg: "#FFF7ED", color: "#c2410c", border: "#fed7aa" },
  rejected:         { label: "Needs changes", bg: "#FFF1F2", color: "#be123c", border: "#fecdd3" },
  inactive:         { label: "Not offered",   bg: "#F1F5F9", color: "#475569", border: "#e2e8f0" },
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

// Same list the CRM uses on Add Contact. Free-typed country names were arriving
// as "india", "INDIA", "Bharat" and similar, which then broke geocoding and
// territory assignment downstream — so both ends now pick from one vocabulary.
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina",
  "Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia","Costa Rica",
  "Croatia","Cuba","Cyprus","Czechia","Denmark","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Estonia","Ethiopia","Finland","France","Georgia","Germany","Ghana","Greece",
  "Guatemala","Honduras","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kosovo","Kuwait","Latvia",
  "Lebanon","Libya","Lithuania","Luxembourg","Malaysia","Malta","Mexico","Moldova","Morocco",
  "Myanmar","Nepal","Netherlands","New Zealand","Nigeria","North Macedonia","Norway","Oman",
  "Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","Slovenia","South Africa",
  "South Korea","Spain","Sri Lanka","Sweden","Switzerland","Syria","Taiwan","Tanzania",
  "Thailand","Tunisia","Turkey","UAE","Uganda","Ukraine","United Kingdom","United States",
  "Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zimbabwe"
];

// Type-ahead rather than a 115-option select: on a phone at a trade show,
// scrolling a native picker to "United Kingdom" is genuinely slow.
function CountrySelect({ value, onChange, style }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const matches = COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase())).slice(0, 8);
  return (
    <div style={{ position: "relative" }}>
      <input
        style={style}
        value={open ? search : value}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => { setSearch(""); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="Start typing…"
        autoComplete="off"
      />
      {value && !open && (
        <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#0EA5A0", fontWeight: 600 }}>✓</span>
      )}
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "white", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 10px 28px rgba(13,31,60,.12)", zIndex: 30, maxHeight: 220, overflowY: "auto" }}>
          {matches.length === 0
            ? <div style={{ padding: "10px 13px", fontSize: 12.5, color: "#94a3b8" }}>No match — check the spelling</div>
            : matches.map(c => (
                <div key={c} onMouseDown={() => { onChange(c); setSearch(""); setOpen(false); }}
                  style={{ padding: "9px 13px", cursor: "pointer", fontSize: 13, color: "#0D1F3C", background: c === value ? "#EEF4FF" : "white", fontWeight: c === value ? 600 : 400 }}>
                  {c}
                </div>
              ))}
        </div>
      )}
    </div>
  );
}

// ── Draft autosave ────────────────────────────────────────────────────────────
// Keeps a half-finished "Add a product" form on the device so nothing is lost to
// a refresh, a crash, or a stray navigation. Wrapped in try/catch because
// private-browsing modes can throw on localStorage access.
const DRAFT_KEY = "ingredientz.supplier.productDraft";
const BLANK_PRODUCT = { name: "", category_id: "", cas: "", hsn: "", unit: "kg", short: "", specs: "", price: "", lead: "", moq: "" };
function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    // ignore anything older than 7 days, and anything genuinely empty
    if (!d || !d.savedAt || Date.now() - d.savedAt > 7 * 86400000) return null;
    const hasContent = Object.keys(BLANK_PRODUCT).some((k) => (d.values?.[k] || "") !== (BLANK_PRODUCT[k] || ""));
    return hasContent ? d.values : null;
  } catch (e) { return null; }
}
function writeDraft(values) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), values })); } catch (e) {}
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
}

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
  // start from a saved draft if there is one
  const [f, setF] = useState(() => ({ ...BLANK_PRODUCT, ...(readDraft() || {}) }));
  const [restored, setRestored] = useState(() => !!readDraft());
  const [savedAt, setSavedAt] = useState(null);
  const [sug, setSug] = useState([]);
  const [saving, setSaving] = useState(false);
  const coaRef = useRef(null), msdsRef = useRef(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  // persist the draft as they type (debounced so we're not writing on every keystroke)
  useEffect(() => {
    const empty = Object.keys(BLANK_PRODUCT).every((k) => (f[k] || "") === (BLANK_PRODUCT[k] || ""));
    if (empty) return;
    const t = setTimeout(() => { writeDraft(f); setSavedAt(new Date()); }, 600);
    return () => clearTimeout(t);
  }, [f]);

  function discardDraft() {
    clearDraft();
    setF({ ...BLANK_PRODUCT });
    setRestored(false);
    setSavedAt(null);
  }

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
      let docFailed = false;
      try {
        if (coaRef.current?.files?.[0])  await uploadDoc(coaRef.current.files[0], "coa", sp.id);
        if (msdsRef.current?.files?.[0]) await uploadDoc(msdsRef.current.files[0], "msds", sp.id);
      } catch (docErr) { docFailed = true; console.error("Document upload failed:", docErr); }
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
      // the product is safely saved — the draft has done its job
      clearDraft();
      alert(docFailed
        ? "Product submitted for approval, but the document upload didn't go through. Open the product to attach it again."
        : "Submitted for approval. We'll email you when it's reviewed.");
      onAdded();
    } catch (err) {
      alert("Something went wrong: " + err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
      {restored && (
        <div style={{ background: "#EEF4FF", border: "1px solid #bfd6f6", color: "#1e40af", borderRadius: 9, padding: "10px 13px", fontSize: 12.5, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>We brought back what you'd typed last time.</span>
          <button onClick={discardDraft} style={{ background: "none", border: "1px solid #bfd6f6", color: "#1e40af", borderRadius: 6, padding: "4px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Start fresh</button>
        </div>
      )}
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
      <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 6 }}>
        Files aren't held in the draft — pick them again if you come back to a restored form.
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={submit} disabled={saving}
          style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Submitting…" : "Submit for approval"}
        </button>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>We'll review and email you.</span>
        {savedAt && <span style={{ color: "#94a3b8", fontSize: 11.5, marginLeft: "auto" }}>Draft saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
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
// ── SUPPLIER QUALIFICATION ─────────────────────────────────────────────────────
// The document set we need before a supplier is considered qualified. Grouped
// the way a supplier thinks about their own paperwork rather than the way the
// database stores it.
//
// The star rating derived from this is internal to Ingredientz — suppliers and
// buyers only ever see "Approved" (we've accepted them) and "Qualified" (the
// paperwork is complete). Nobody outside sees a number, so nobody games it.
const QUAL_GROUPS = [
  {
    key: "legal", title: "Legal and registration",
    slots: [
      { type: "incorporation", title: "Company incorporation certificate", hint: "Proof the company exists" },
      { type: "food_facility", title: "Food facility registration",        hint: "Where you manufacture" },
      { type: "fssai_fda",     title: "FSSAI or FDA registration",         hint: "Whichever applies in your market" },
    ],
  },
  {
    key: "safety", title: "Food safety",
    slots: [
      { type: "gmp",   title: "GMP certificate",             hint: "Good Manufacturing Practice" },
      { type: "haccp", title: "HACCP certificate or report", hint: "Hazard analysis" },
    ],
  },
  {
    key: "quality", title: "Quality system",
    slots: [
      { type: "quality_system", title: "ISO / BRC / FSSC / SQF", hint: "Any one is enough", standards: ["ISO 9001", "ISO 22000", "FSSC 22000", "BRC", "SQF"] },
    ],
  },
  {
    key: "organic", title: "Organic", organicOnly: true,
    slots: [
      { type: "organic_cert", title: "Organic certificate",  hint: "NOP, EU, India Organic…" },
      { type: "organic_list", title: "Organic product list", hint: "Which of your products are covered" },
    ],
  },
];

// Derived, never stored. A supplier whose GMP lapses should drop a star on its
// own — a number written into a column would sit there being wrong.
function qualify(supplier, docs) {
  const has = t => docs.some(d => d.doc_type === t);
  const organic = !!supplier?.sells_organic;
  const tiers = [
    { star: 1, ok: true },
    { star: 2, ok: has("incorporation") && has("fssai_fda") },
    { star: 3, ok: has("food_facility") && has("haccp") },
    { star: 4, ok: has("quality_system") },
    { star: 5, ok: has("facility_photo") && (!organic || (has("organic_cert") && has("organic_list"))) },
  ];
  let stars = 0;
  for (const t of tiers) { if (!t.ok) break; stars = t.star; }
  return { stars, qualified: stars >= 4 };
}

// ── COMPANY DOCUMENTS ──────────────────────────────────────────────────────────
function CompanyDocs({ supplier, email, docs, onChanged }) {
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const [standard, setStandard] = useState("ISO 9001");
  const organic = !!supplier.sells_organic;

  async function upload(file, docType, label, allowMany) {
    if (!file) return;
    setBusy(docType); setErr("");
    try {
      const path = `company/${supplier.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("supplier-docs").upload(path, file);
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("supplier-docs").getPublicUrl(path);
      const row = { supplier_id: supplier.id, doc_type: docType, label,
        file_url: pub.publicUrl, file_name: file.name, uploaded_by: email };

      const existing = !allowMany && docs.find(d => d.doc_type === docType);
      const { error } = existing
        ? await supabase.from("supplier_documents").update(row).eq("id", existing.id)
        : await supabase.from("supplier_documents").insert(row);
      if (error) throw error;
      onChanged();
    } catch (e) { setErr("Upload failed: " + (e.message || e)); }
    finally { setBusy(null); }
  }

  async function removeDoc(d) {
    if (!window.confirm(`Remove ${d.file_name || "this file"}?`)) return;
    setBusy(d.doc_type);
    await supabase.from("supplier_documents").delete().eq("id", d.id);
    onChanged();
    setBusy(null);
  }

  async function toggleOrganic(v) {
    await supabase.from("suppliers").update({ sells_organic: v }).eq("id", supplier.id);
    onChanged(true);
  }

  const mini = { border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 10px", fontSize: 11, color: "#64748b", cursor: "pointer", background: "white", fontFamily: "inherit" };

  function Slot({ s }) {
    const d = docs.find(x => x.doc_type === s.type);
    const working = busy === s.type;
    return (
      <div style={{ ...slotStyle, border: d ? "1px solid #e2e8f0" : "1px dashed #e2e8f0" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F3C" }}>{s.title}</div>
          <div style={{ fontSize: 11, color: d ? "#166534" : "#94a3b8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {working ? "Uploading…" : d ? `${d.label && d.label !== s.title ? d.label + " · " : ""}${d.file_name}` : s.hint}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          {s.standards && !d && (
            <select value={standard} onChange={e => setStandard(e.target.value)} style={{ ...mini, padding: "5px 6px" }}>
              {s.standards.map(x => <option key={x}>{x}</option>)}
            </select>
          )}
          {d && <button style={mini} onClick={() => window.open(d.file_url, "_blank")}>View</button>}
          <label style={{ ...mini, display: "inline-block" }}>
            {d ? "Replace" : "Choose file"}
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} disabled={working}
              onChange={e => { upload(e.target.files?.[0], s.type, s.standards ? standard : s.title); e.target.value = ""; }} />
          </label>
          {d && <button style={{ ...mini, color: "#be123c" }} onClick={() => removeDoc(d)}>✕</button>}
        </div>
      </div>
    );
  }

  function MultiSlot({ type, title, accept, note }) {
    const mine = docs.filter(d => d.doc_type === type);
    const working = busy === type;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ ...slotStyle, border: "1px dashed #e2e8f0" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F3C" }}>{title}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{working ? "Uploading…" : note}</div>
          </div>
          <label style={{ ...mini, display: "inline-block", flexShrink: 0 }}>
            + Add
            <input type="file" accept={accept} style={{ display: "none" }} disabled={working}
              onChange={e => { upload(e.target.files?.[0], type, title, true); e.target.value = ""; }} />
          </label>
        </div>
        {mine.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 2px 4px" }}>
            {mine.map(d => (
              <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EEF4FF", border: "1px solid #bfd6f6", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#1e40af", maxWidth: 240 }}>
                <span onClick={() => window.open(d.file_url, "_blank")} style={{ cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.file_name}</span>
                <button onClick={() => removeDoc(d)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
      <p style={{ marginTop: 0, marginBottom: 16, fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>
        Shared across all your products. Completing these makes you a <b style={{ color: "#0D1F3C" }}>Qualified Supplier</b> — buyers see the badge, and our team can quote you without chasing paperwork.
      </p>

      {QUAL_GROUPS.filter(g => !g.organicOnly || organic).map(g => (
        <div key={g.key} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#94a3b8", margin: "14px 0 8px" }}>{g.title}</div>
          {g.slots.map(s => <Slot key={s.type} s={s} />)}
        </div>
      ))}

      <label style={{ display: "flex", alignItems: "center", gap: 9, margin: "14px 0", fontSize: 12.5, color: "#475569", cursor: "pointer" }}>
        <input type="checkbox" checked={organic} onChange={e => toggleOrganic(e.target.checked)} style={{ width: 15, height: 15 }} />
        We supply certified organic products
      </label>

      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#94a3b8", margin: "14px 0 8px" }}>Your facility</div>
      <MultiSlot type="facility_photo" title="Facility photos" accept=".png,.jpg,.jpeg,.webp"
        note="Production floor, warehouse, QC lab — buyers trust what they can see" />

      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#94a3b8", margin: "14px 0 8px" }}>Anything else</div>
      <MultiSlot type="other" title="Other documents" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
        note="Company profile, price list, audit reports" />

      {err && <div style={{ color: "#be123c", fontSize: 12, marginTop: 10 }}>{err}</div>}
    </div>
  );
}
// ── PRODUCT DRAWER ─────────────────────────────────────────────────────────────
// Everything a supplier can change about a product they already listed. Their
// commercial terms and their paperwork — not the catalogue entry itself, which
// other suppliers may also be listed against and which goes back through
// Approvals if it changes.
const DOC_SLOTS = [
  { type: "coa",  title: "Certificate of Analysis", hint: "Buyers ask for this first" },
  { type: "msds", title: "Safety Data Sheet",       hint: "Required for shipping" },
  { type: "spec", title: "Spec sheet",              hint: "Assay, particle size, origin" },
];

function ProductDrawer({ sp, supplier, email, onClose, onSaved }) {
  const [f, setF] = useState({
    price: sp.price_usd ?? "", lead: sp.lead_time_days ?? "",
    moq: sp.min_order_qty ?? "", unit: sp.unit || "kg",
  });
  const [docs, setDocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [busyDoc, setBusyDoc] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { loadDocs(); /* eslint-disable-next-line */ }, [sp.id]);

  async function loadDocs() {
    const { data } = await supabase.from("supplier_product_documents")
      .select("*").eq("supplier_product_id", sp.id).order("created_at", { ascending: false });
    setDocs(data || []);
  }
  const docFor = t => docs.find(d => d.doc_type === t);

  async function saveTerms() {
    setSaving(true); setErr("");
    const patch = {
      price_usd: f.price === "" ? null : Number(f.price),
      lead_time_days: f.lead === "" ? null : Number(f.lead),
      min_order_qty: f.moq === "" ? null : Number(f.moq),
      unit: f.unit,
    };
    const { error } = await supabase.from("supplier_products").update(patch).eq("id", sp.id);
    setSaving(false);
    if (error) { setErr("Could not save: " + error.message); return; }
    onSaved();
    onClose();
  }

  // Uploading a document never sends the product back for review — a supplier
  // replacing an expired CoA shouldn't have their listing go dark while waiting.
  async function uploadDoc(file, docType, title) {
    if (!file) return;
    setBusyDoc(docType); setErr("");
    try {
      const path = `products/${supplier.id}/${sp.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("supplier-docs").upload(path, file);
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("supplier-docs").getPublicUrl(path);

      const existing = docFor(docType);
      if (existing) {
        const { error } = await supabase.from("supplier_product_documents")
          .update({ file_url: pub.publicUrl, file_name: file.name, uploaded_by: email, label: title })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("supplier_product_documents").insert({
          supplier_product_id: sp.id, doc_type: docType, label: title,
          file_url: pub.publicUrl, file_name: file.name, uploaded_by: email,
        });
        if (error) throw error;
      }
      await loadDocs();
      onSaved();
    } catch (e) {
      setErr("Upload failed: " + (e.message || e));
    } finally { setBusyDoc(null); }
  }

  async function removeDoc(d) {
    if (!window.confirm(`Remove ${d.file_name || "this document"}?`)) return;
    setBusyDoc(d.doc_type);
    await supabase.from("supplier_product_documents").delete().eq("id", d.id);
    await loadDocs();
    onSaved();
    setBusyDoc(null);
  }

  // Kept, not deleted — you want to know a supplier once offered something.
  async function setInactive() {
    if (!window.confirm("Stop offering this product? It disappears from buyers but stays on your record, and you can put it back later.")) return;
    setSaving(true);
    const { error } = await supabase.from("supplier_products").update({ status: "inactive" }).eq("id", sp.id);
    setSaving(false);
    if (error) { setErr("Could not update: " + error.message); return; }
    onSaved(); onClose();
  }
  async function reactivate() {
    setSaving(true);
    const { error } = await supabase.from("supplier_products").update({ status: "active" }).eq("id", sp.id);
    setSaving(false);
    if (error) { setErr("Could not update: " + error.message); return; }
    onSaved(); onClose();
  }

  const overlay = { position: "fixed", inset: 0, background: "rgba(13,31,60,0.45)", zIndex: 200, display: "flex", justifyContent: "flex-end" };
  const panel = { width: "min(440px, 100vw)", height: "100vh", background: "white", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(13,31,60,0.18)" };
  const secLbl = { fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#1877F2", margin: "20px 0 12px", paddingTop: 14, borderTop: "1px solid #f1f5f9" };
  const slot = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderRadius: 10, padding: "11px 13px", marginBottom: 9, background: "#fbfcfe" };
  const mini = { border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 10px", fontSize: 11, color: "#64748b", cursor: "pointer", background: "white", fontFamily: "inherit" };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0D1F3C" }}>{sp.products?.name || "Product"}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                {[sp.products?.product_categories?.name, sp.products?.cas_number ? `CAS ${sp.products.cas_number}` : null].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
          <div style={{ marginTop: 10 }}><Chip status={sp.status} /></div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {sp.status === "rejected" && sp.rejection_reason && (
            <div style={{ background: "#FFF1F2", border: "1px solid #fecdd3", color: "#9f1239", borderRadius: 9, padding: "11px 13px", fontSize: 12.5, marginBottom: 14, lineHeight: 1.55 }}>
              <b>What needs changing</b><br />{sp.rejection_reason}
            </div>
          )}
          {sp.status === "inactive" && (
            <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", borderRadius: 9, padding: "11px 13px", fontSize: 12.5, marginBottom: 14 }}>
              You've stopped offering this. Buyers can't see it.
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#1877F2", marginBottom: 12 }}>Your commercial terms</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={labelStyle}>Price (USD)</label>
              <input style={inputStyle} value={f.price} onChange={e => setF(p => ({ ...p, price: e.target.value }))} placeholder="28.00" inputMode="decimal" /></div>
            <div><label style={labelStyle}>Unit</label>
              <select style={inputStyle} value={f.unit} onChange={e => setF(p => ({ ...p, unit: e.target.value }))}>
                <option>kg</option><option>g</option><option>L</option><option>ton</option>
              </select></div>
            <div><label style={labelStyle}>Lead time (days)</label>
              <input style={inputStyle} value={f.lead} onChange={e => setF(p => ({ ...p, lead: e.target.value }))} placeholder="21" inputMode="numeric" /></div>
            <div><label style={labelStyle}>Min order qty</label>
              <input style={inputStyle} value={f.moq} onChange={e => setF(p => ({ ...p, moq: e.target.value }))} placeholder="100" inputMode="decimal" /></div>
          </div>

          <div style={secLbl}>Documents</div>
          {DOC_SLOTS.map(s => {
            const d = docFor(s.type);
            const busy = busyDoc === s.type;
            return (
              <div key={s.type} style={{ ...slot, border: d ? "1px solid #e2e8f0" : "1px dashed #e2e8f0" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F3C" }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: d ? "#166534" : "#94a3b8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {busy ? "Uploading…" : d ? d.file_name : s.hint}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {d && <button style={mini} onClick={() => window.open(d.file_url, "_blank")}>View</button>}
                  <label style={{ ...mini, display: "inline-block" }}>
                    {d ? "Replace" : "Choose file"}
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} disabled={busy}
                      onChange={e => { uploadDoc(e.target.files?.[0], s.type, s.title); e.target.value = ""; }} />
                  </label>
                  {d && <button style={{ ...mini, color: "#be123c" }} onClick={() => removeDoc(d)}>✕</button>}
                </div>
              </div>
            );
          })}

          <div style={{ background: "#EEF4FF", border: "1px solid #bfd6f6", borderRadius: 9, padding: "10px 12px", marginTop: 16, fontSize: 11.5, color: "#1e40af", lineHeight: 1.55 }}>
            Prices, lead times and documents update straight away. To change the product name or specification, add it again as a new product — the catalogue entry is shared with other suppliers.
          </div>

          {err && <div style={{ color: "#be123c", fontSize: 12, marginTop: 12 }}>{err}</div>}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveTerms} disabled={saving}
              style={{ flex: 1, background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1 }}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button onClick={onClose} style={{ border: "1px solid #d0d7e5", background: "white", borderRadius: 8, padding: "11px 16px", fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            {sp.status === "inactive"
              ? <button onClick={reactivate} style={{ background: "none", border: "none", color: "#1877F2", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Offer this product again</button>
              : <button onClick={setInactive} style={{ background: "none", border: "none", color: "#be123c", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Stop offering this product</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GETTING STARTED ────────────────────────────────────────────────────────────
// A newly approved supplier lands on four tabs and a table with nothing telling
// them what actually matters. Every step here is derived from data we already
// have, so nothing needs tracking, and the whole block disappears once done.
// None of it blocks selling — it's a nudge, not a gate.
function GettingStarted({ supplier, products, companyDocs, onGo }) {
  const hasProduct = products.length > 0;
  const hasCoa = products.some(p => (p.supplier_product_documents || []).some(d => d.doc_type === "coa"));
  const has = t => companyDocs.some(d => d.doc_type === t);
  const organic = !!supplier.sells_organic;

  const steps = [
    { done: true, label: "Apply to supply",
      hint: supplier.status === "active" ? "Approved" : "We're reviewing it now" },
    { done: hasProduct, label: "Add your first product",
      hint: "Buyers can't find you without one", cta: "Add", go: "add" },
    { done: hasCoa, label: "Attach a Certificate of Analysis",
      hint: "The first thing buyers ask for", cta: "Attach", go: "list" },
    { done: has("incorporation") && has("fssai_fda"),
      label: "Incorporation certificate and FSSAI / FDA",
      hint: "Proves who you are and where you're registered", cta: "Upload", go: "docs" },
    { done: has("food_facility") && has("haccp"),
      label: "Facility registration and HACCP",
      hint: "Where you make it, and how you keep it safe", cta: "Upload", go: "docs" },
    { done: has("quality_system"),
      label: "A quality system certificate",
      hint: "ISO, BRC, FSSC or SQF — any one", cta: "Upload", go: "docs" },
    { done: has("facility_photo") && (!organic || (has("organic_cert") && has("organic_list"))),
      label: organic ? "Facility photos and organic certification" : "Photos of your facility",
      hint: "Buyers trust what they can see", cta: "Add", go: "docs" },
  ];
  const done = steps.filter(s => s.done).length;
  if (done === steps.length) return null;

  const next = steps.find(s => !s.done);

  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7, gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#0D1F3C" }}>Become a Qualified Supplier</div>
        <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{done} of {steps.length}</div>
      </div>
      <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: `${(done / steps.length) * 100}%`, height: "100%", background: "#1877F2", transition: "width .3s" }} />
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid #f8fafc" }}>
          <span style={{ fontSize: 16, color: s.done ? "#16a34a" : "#cbd5e1", flexShrink: 0, lineHeight: 1 }}>{s.done ? "✓" : "○"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, color: s.done ? "#94a3b8" : "#0D1F3C", textDecoration: s.done ? "line-through" : "none" }}>{s.label}</div>
            {!s.done && s.hint && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{s.hint}</div>}
          </div>
          {!s.done && s.cta && (
            <button onClick={() => onGo(s.go)}
              style={{ background: s === next ? "#0D1F3C" : "white", color: s === next ? "white" : "#64748b", border: s === next ? "none" : "1px solid #d0d7e5", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              {s.cta}
            </button>
          )}
        </div>
      ))}
      <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid #f1f5f9", fontSize: 11.5, color: "#94a3b8", lineHeight: 1.6 }}>
        Nothing here stops you selling. Qualified suppliers get quoted faster because our team isn't chasing paperwork.
      </div>
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
      //    auth_user_id ties this company to the logged-in account, so document
      //    uploads and future edits can be checked against it.
      const { data: { user } } = await supabase.auth.getUser();
      const { data: sup, error: e1 } = await supabase.from("suppliers").insert({
        company: f.company.trim(),
        slug: `${slugify(f.company)}-${Date.now()}`,
        email,
        auth_user_id: user?.id || null,
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
      } else {
        console.error("Credential upload failed:", upErr);
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
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Country</label>
              <CountrySelect value={f.country} onChange={v => setF(p => ({ ...p, country: v }))} style={inputStyle} /></div>
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
  const [openProduct, setOpenProduct] = useState(null);   // row clicked in My list
  // Which account we've already loaded data for. Supabase fires auth events on
  // things that are NOT a login — a token refresh, or coming back to the tab —
  // and re-running init() on those wiped whatever the supplier had typed,
  // because init() flips `loading` and unmounts the whole dashboard.
  const loadedFor = useRef(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const em = session?.user?.email || null;
      if (em) { loadedFor.current = em; init(em); }
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const em = session?.user?.email || null;
      // Same account as we already loaded → nothing to do. This is the guard
      // that keeps a half-typed form alive across tab switches.
      if (em === loadedFor.current) return;
      loadedFor.current = em;
      if (em) {
        init(em);
      } else {
        setSupplier(undefined); setProducts([]); setCompanyDocs([]); setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  // `silent` refreshes data without blanking the screen, so open forms survive.
  async function init(email, { silent = false } = {}) {
    if (!silent) setLoading(true);
    const { data: sup } = await supabase.from("suppliers").select("*").ilike("email", email).maybeSingle();
    setSupplier(sup || null);
    if (sup) {
      await Promise.all([loadProducts(sup.id), loadCompanyDocs(sup.id), loadCategories()]);
    }
    if (!silent) setLoading(false);
  }
  async function loadProducts(supplierId) {
    const { data } = await supabase.from("supplier_products")
      .select("*, products(name, unit, cas_number, product_categories(name)), supplier_product_documents(doc_type)")
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
  async function logout() {
    loadedFor.current = null;
    await supabase.auth.signOut();
    setSession(null); setSupplier(undefined); setProducts([]); setCompanyDocs([]);
  }
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
  // Withdrawn products stay on the record but shouldn't pad the headline count —
  // otherwise the four tiles don't add up and it looks like something is missing.
  const listed   = products.filter((p) => p.status !== "inactive").length;
  const qual     = qualify(supplier, companyDocs);
  const TABS = [["list", "My list"], ["add", "Add a product"], ["excel", "Upload Excel"], ["cat", "Add from catalogue"]];
  const useCatalogueProduct = async (p) => {
    try {
      const { error } = await supabase.from("supplier_products").insert({
        supplier_id: supplier.id, product_id: p.id, submitted_by_supplier: true, status: "active", unit: p.unit || "kg",
      });
      if (error) throw error;
      clearDraft();
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
              {qual.qualified && (
                <span style={{ display: "inline-block", marginLeft: 7, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, marginTop: 8 }}>✓ Qualified</span>
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
        <GettingStarted
          supplier={supplier}
          products={products}
          companyDocs={companyDocs}
          onGo={target => {
            if (target === "docs") {
              document.getElementById("company-docs")?.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
              setTab(target);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        />
        {/* Stats */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
          {[["Approved", approved, "#22c55e"], ["Pending review", pending, "#f59e0b"], ["Needs changes", rejected, "#be123c"], ["Total products", listed, "#1877F2"]].map(([label, val, color]) => (
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
                      {["Product", "Category", "Your price", "Lead", "MOQ", "Docs", "Status", ""].map((h) => (
                        <th key={h} style={{ textAlign: "left", fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", padding: "11px 12px", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {products.map((sp) => {
                        const docTypes = (sp.supplier_product_documents || []).map((d) => d.doc_type);
                        return (
                          <tr key={sp.id} onClick={() => setOpenProduct(sp)}
                            style={{ borderBottom: "1px solid #f8fafc", cursor: "pointer", opacity: sp.status === "inactive" ? .55 : 1 }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
                            <td style={{ padding: "11px 12px", fontSize: 11.5, fontWeight: 600, color: "#1877F2", whiteSpace: "nowrap" }}>Edit →</td>
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
            <div id="company-docs" style={{ ...sectionStyle, marginTop: 26 }}>Company documents</div>
            <CompanyDocs supplier={supplier} email={session.user.email} docs={companyDocs}
              onChanged={(reloadSupplier) => {
                loadCompanyDocs(supplier.id);
                // Ticking the organic box changes which slots are required, so
                // the supplier row itself has to come back too.
                if (reloadSupplier) init(session.user.email, { silent: true });
              }} />
          </div>
        </div>
      </div>
      {openProduct && (
        <ProductDrawer
          sp={openProduct}
          supplier={supplier}
          email={session.user.email}
          onClose={() => setOpenProduct(null)}
          onSaved={() => loadProducts(supplier.id)}
        />
      )}
    </div>
  );
}
