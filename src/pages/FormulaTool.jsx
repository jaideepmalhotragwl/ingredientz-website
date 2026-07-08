/* =========================================================================
   FormulaTool.jsx — public label→ingredients→enquiry tool (ingredientz.co)
   ---------------------------------------------------------------------------
   Flow:
     1. Upload label (image or PDF)
     2. extract-label Edge Function (Claude vision) → ingredient breakdown
     3. Customer edits if needed, sets quantity (units OR batch weight)
     4. System multiplies mg × units → total kg per ingredient
     5. Choose: enquire ALL / pick specific / (CDMO — coming soon)
     6. Creates ONE enquiry with products jsonb [{name, qty, unit}], source "Formula Tool"
        → shared Supabase (eytoryygkxjslfvsqanl) → shows in CRM, auto-numbered by trigger,
          acknowledgement email fires via customer_email.

   Deps: src/lib/supabase.js (exports `supabase`); extract-label Edge Function deployed.
   Usage:  import FormulaSourcingTool from './components/FormulaSourcingTool.jsx';
   ========================================================================= */

import React, { useState, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const NAVY = '#0D1F3C', GOLD = '#C9A84C', GOLD_D = '#a8892f', PAPER = '#FAF6EE',
      LINE = '#e6ddc9', MUT = '#6b7385', INK = '#1a2233', GREEN = '#1E7A46';

const EDGE = 'https://eytoryygkxjslfvsqanl.supabase.co/functions/v1/extract-label';

export default function FormulaTool() {
  const [step, setStep] = useState(1);            // 1 upload · 2 review · 3 qty · 4 choice · 5 done
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState({ product_name: '', dosage_form: '', serving_size: '' });
  const [rows, setRows] = useState([]);           // [{ingredient, mg_per_unit, percent}]
  const [mode, setMode] = useState('units');
  const [units, setUnits] = useState('100000');
  const [batchKg, setBatchKg] = useState('50');
  const [picked, setPicked] = useState(new Set());
  const [form, setForm] = useState({ name: '', email: '', company: '', country: 'United States', phone: '' });
  const [enquiryRef, setEnquiryRef] = useState('');
  const fileRef = useRef();

  // ── file → base64 → extract ────────────────────────────────────────────────
  async function handleFile(f) {
    if (!f) return;
    setErr(''); setBusy(true); setStep(2);
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(',')[1]);
        r.onerror = () => rej(new Error('Could not read the file'));
        r.readAsDataURL(f);
      });
      const media = f.type || (f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      const resp = await fetch(EDGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_base64: b64, media_type: media }),
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'Could not read this label. Try a clearer photo or a PDF.');
      if (!data.ingredients || data.ingredients.length === 0) throw new Error('No ingredients found on this label. Try a clearer image.');
      setMeta({ product_name: data.product_name || '', dosage_form: data.dosage_form || '', serving_size: data.serving_size || '' });
      setRows(data.ingredients);
      setBusy(false);
    } catch (e) {
      setErr(e.message || String(e)); setBusy(false); setStep(1);
    }
  }

  // ── quantity math ───────────────────────────────────────────────────────────
  const totalMgPerUnit = useMemo(() => rows.reduce((a, r) => a + (Number(r.mg_per_unit) || 0), 0), [rows]);
  const effUnits = useMemo(() => {
    if (mode === 'units') return parseNum(units);
    const g = parseNum(batchKg) * 1000;                    // batch kg → g
    return totalMgPerUnit > 0 ? Math.round(g * 1000 / totalMgPerUnit) : 0;  // g→mg ÷ mg/unit
  }, [mode, units, batchKg, totalMgPerUnit]);

  const computed = useMemo(() => rows.map(r => ({
    ...r,
    totalKg: (Number(r.mg_per_unit) || 0) * effUnits / 1e6,
  })), [rows, effUnits]);
  const grandKg = useMemo(() => computed.reduce((a, r) => a + r.totalKg, 0), [computed]);

  // ── build products jsonb + submit ONE enquiry ───────────────────────────────
  async function submitEnquiry(onlyPicked) {
    setErr(''); setBusy(true);
    try {
      const source = computed.filter((_, i) => !onlyPicked || picked.has(i));
      const products = source
        .filter(r => r.totalKg > 0)
        .map(r => ({ name: r.ingredient, qty: String(round(r.totalKg)), unit: 'kg' }));
      if (products.length === 0) throw new Error('Select at least one ingredient.');

      const payload = {
        customer_name: form.company || form.name || 'Website formula enquiry',
        contact_person: form.name || null,
        email: form.email || null,
        customer_email: form.email || null,     // triggers acknowledgement email
        phone: form.phone || null,
        country: form.country || null,
        products,                                // jsonb array {name, qty, unit}
        source: 'Formula Tool',
        stage: 'New Enquiry',
        priority: 'Medium',
        enquiry_date: new Date().toISOString().slice(0, 10),
        notes: `Formula sourcing tool · ${meta.product_name || 'product'}${meta.dosage_form ? ' (' + meta.dosage_form + ')' : ''} · run size ${effUnits.toLocaleString()} units`,
      };

      const { data, error } = await supabase.from('enquiries').insert(payload).select('id, quarter_ref').single();
      if (error) throw error;
      setEnquiryRef(data?.quarter_ref ? `ENQ-${data.id} · ${data.quarter_ref}` : `ENQ-${data.id}`);
      setStep(5); setBusy(false);
    } catch (e) {
      setErr(e.message || String(e)); setBusy(false);
    }
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: INK, maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
      <Stepper step={step} />

      {err && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 13, margin: '14px 0' }}>{err}</div>
      )}

      {/* STEP 1 — upload */}
      {step === 1 && (
        <Card title="Upload your product label" sub="A photo or PDF of the supplement facts panel is all we need.">
          <div onClick={() => fileRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            style={{ border: `2px dashed ${LINE}`, borderRadius: 14, background: PAPER, padding: '44px 24px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: NAVY, marginBottom: 5 }}>Drop your label here, or click to browse</div>
            <div style={{ fontSize: 13, color: MUT }}>Capsules, tablets, powders, syrups, gummies — any supplement facts panel.</div>
            <div style={{ marginTop: 14, fontSize: 11, color: MUT }}>JPG · PNG · PDF · HEIC</div>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        </Card>
      )}

      {/* STEP 2 — review (or loading) */}
      {step === 2 && (
        <Card title="Review the extracted formula" sub="We read this from your label. Tap any value to correct it.">
          {busy ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase', color: GOLD_D, fontWeight: 600 }}>Reading your label…</div>
              <div style={{ height: 6, background: '#F2ECDE', borderRadius: 100, overflow: 'hidden', maxWidth: 340, margin: '18px auto 0' }}>
                <div style={{ height: '100%', width: '70%', background: `linear-gradient(90deg,${GOLD},${GOLD_D})`, borderRadius: 100 }} />
              </div>
            </div>
          ) : (
            <>
              {meta.product_name && (
                <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>{meta.product_name}</div>
                  <div style={{ fontSize: 12, color: MUT, marginTop: 2 }}>
                    {[meta.dosage_form, meta.serving_size && `Serving: ${meta.serving_size}`, `${rows.length} ingredients`].filter(Boolean).join(' · ')}
                  </div>
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead><tr>
                  <Th>Ingredient</Th><Th right>mg / unit</Th><Th right>% of formula</Th>
                </tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <Td><input value={r.ingredient} onChange={e => editRow(i, 'ingredient', e.target.value)} style={cellInput(true)} /></Td>
                      <Td right><input value={r.mg_per_unit ?? ''} onChange={e => editRow(i, 'mg_per_unit', e.target.value)} style={cellInput()} /></Td>
                      <Td right><input value={r.percent ?? ''} onChange={e => editRow(i, 'percent', e.target.value)} style={cellInput()} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Note>These values were read automatically. Anything look off? Edit it before we calculate quantities.</Note>
              <Actions back={() => setStep(1)} next={() => setStep(3)} nextLabel="Looks right — set quantity →" />
            </>
          )}
        </Card>
      )}

      {/* STEP 3 — quantity */}
      {step === 3 && (
        <Card title="How much are you making?" sub="We'll multiply each ingredient by your run size to get total raw material needed.">
          <div style={{ display: 'inline-flex', border: `1px solid ${LINE}`, borderRadius: 100, padding: 3, background: PAPER, marginBottom: 20 }}>
            {['units', 'batch'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                border: 'none', background: mode === m ? NAVY : 'none', color: mode === m ? PAPER : MUT,
                fontWeight: 600, fontSize: 13, padding: '7px 18px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit',
              }}>{m === 'units' ? 'By units' : 'By batch weight'}</button>
            ))}
          </div>
          <div style={{ marginBottom: 22 }}>
            {mode === 'units' ? (
              <Field label="Number of finished units"><input value={units} onChange={e => setUnits(e.target.value)} style={inp} /></Field>
            ) : (
              <Field label="Total batch weight (kg)"><input value={batchKg} onChange={e => setBatchKg(e.target.value)} style={inp} /></Field>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr><Th>Ingredient</Th><Th right>Per unit</Th><Th right>Total required</Th></tr></thead>
            <tbody>
              {computed.map((r, i) => (
                <tr key={i}>
                  <Td strong>{r.ingredient}</Td>
                  <Td right>{r.mg_per_unit ?? '—'} mg</Td>
                  <Td right><b style={{ color: GREEN }}>{fmt(r.totalKg)} kg</b></Td>
                </tr>
              ))}
              <tr><td style={totRow}>Total raw material</td><td style={totRow}></td><td style={{ ...totRow, color: GREEN, textAlign: 'right' }}>{fmt(grandKg)} kg</td></tr>
            </tbody>
          </table>
          <Note>For {mode === 'units' ? `${parseNum(units).toLocaleString()} units` : `a ${batchKg} kg batch (~${effUnits.toLocaleString()} units)`}, here's exactly how much of each raw material you'll need.</Note>
          <Actions back={() => setStep(2)} next={() => setStep(4)} nextLabel="Continue to sourcing →" />
        </Card>
      )}

      {/* STEP 4 — choice */}
      {step === 4 && (
        <Card title="How would you like to source this?" sub="Your quantified formula is ready. Choose what happens next.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            <Choice icon="📦" title="Enquire for all ingredients" desc={`Send us your complete formula — we'll quote all ${rows.length} raw materials.`}
              onClick={() => { setPicked(new Set(rows.map((_, i) => i))); setStep(41); }} go={`Enquire for all ${rows.length} →`} />
            <Choice icon="✓" title="Pick specific ingredients" desc="Only need a few from us? Select the ones you want quoted."
              onClick={() => { setPicked(new Set()); setStep(42); }} go="Choose ingredients →" />
            <Choice icon="🏭" title="Find a CDMO partner" desc="Want someone to manufacture the whole product? We'll match you to the right contract manufacturer." soon
              onClick={() => setStep(43)} go="Explore CDMO matching →" />
          </div>
        </Card>
      )}

      {/* STEP 41 — enquire all (contact form) */}
      {step === 41 && (
        <ContactStep title="Enquire for all ingredients"
          summary={`${products0(computed).length} ingredients · ${effUnits.toLocaleString()} units · ${fmt(grandKg)} kg total`}
          form={form} setForm={setForm} busy={busy}
          onBack={() => setStep(4)} onSubmit={() => submitEnquiry(false)}
          submitLabel={`Submit enquiry for ${products0(computed).length} ingredients`} />
      )}

      {/* STEP 42 — pick specific */}
      {step === 42 && (
        <Card title="Pick the ingredients you need" sub="Select what you'd like us to quote. Quantities carry over from your run.">
          {computed.map((r, i) => (
            <div key={i} onClick={() => togglePick(i)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              border: `1px solid ${picked.has(i) ? GOLD : LINE}`, background: picked.has(i) ? '#F2ECDE' : '#fff',
              borderRadius: 10, marginBottom: 8, cursor: 'pointer',
            }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${picked.has(i) ? GOLD : LINE}`, background: picked.has(i) ? GOLD : '#fff', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{picked.has(i) ? '✓' : ''}</div>
              <div style={{ flex: 1, fontWeight: 600, color: NAVY, fontSize: 14 }}>{r.ingredient}</div>
              <div style={{ fontSize: 13, color: MUT }}>{fmt(r.totalKg)} kg needed</div>
            </div>
          ))}
          <div style={{ fontSize: 13, color: MUT, margin: '6px 0 14px' }}><b style={{ color: NAVY }}>{picked.size}</b> selected</div>
          <Actions back={() => setStep(4)} next={() => picked.size ? setStep(421) : setErr('Select at least one ingredient.')} nextLabel="Continue →" />
        </Card>
      )}

      {/* STEP 421 — pick contact form */}
      {step === 421 && (
        <ContactStep title="Enquire for selected ingredients"
          summary={`${picked.size} of ${rows.length} ingredients · ${effUnits.toLocaleString()} units`}
          form={form} setForm={setForm} busy={busy}
          onBack={() => setStep(42)} onSubmit={() => submitEnquiry(true)}
          submitLabel={`Submit enquiry for ${picked.size} ingredients`} />
      )}

      {/* STEP 43 — CDMO (coming soon preview) */}
      {step === 43 && (
        <Card title="Find a CDMO partner" sub="Preview — CDMO matching launches once our manufacturer network is live.">
          <div style={{ background: '#FBF2E1', border: '1px solid #eBD9a8', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#8a5a12', lineHeight: 1.6 }}>
            🏭 Soon you'll be able to share your target market and preferred CDMO location, and we'll match your formula against our vetted contract-manufacturer network. <b>This goes live as manufacturers finish onboarding.</b>
          </div>
          <Actions back={() => setStep(4)} next={() => setStep(4)} nextLabel="Back to options" />
        </Card>
      )}

      {/* STEP 5 — done */}
      {step === 5 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E9F5EE', color: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 18px' }}>✓</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Your enquiry is in.</div>
            <div style={{ fontSize: 15, color: MUT, maxWidth: 440, margin: '0 auto' }}>Our sourcing team has your quantified formula and will come back with pricing and availability. We've emailed you a copy.</div>
            {enquiryRef && <div style={{ display: 'inline-block', marginTop: 14, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 16px', fontWeight: 700, color: NAVY }}>{enquiryRef}</div>}
            <div style={{ marginTop: 26 }}><button onClick={reset} style={btnPrimary}>Source another formula</button></div>
          </div>
        </Card>
      )}
    </div>
  );

  // helpers bound to state
  function editRow(i, key, val) {
    setRows(rs => rs.map((r, j) => j === i ? { ...r, [key]: key === 'ingredient' ? val : (val === '' ? null : Number(val)) } : r));
  }
  function togglePick(i) { setPicked(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; }); }
  function reset() {
    setStep(1); setErr(''); setRows([]); setMeta({ product_name: '', dosage_form: '', serving_size: '' });
    setUnits('100000'); setBatchKg('50'); setPicked(new Set()); setEnquiryRef('');
    setForm({ name: '', email: '', company: '', country: 'United States', phone: '' });
  }
}

/* ── small presentational helpers ─────────────────────────────────────────── */
const NAVY2 = '#0D1F3C', PAPER2 = '#FAF6EE', LINE2 = '#e6ddc9', MUT2 = '#6b7385';
const inp = { border: `1px solid ${LINE2}`, borderRadius: 10, padding: '11px 14px', fontSize: 15, fontFamily: 'inherit', width: 240, outline: 'none' };
const totRow = { padding: '11px 12px', background: PAPER2, fontWeight: 700, borderTop: `2px solid ${NAVY2}` };
const btnPrimary = { background: '#C9A84C', color: '#0D1F3C', border: 'none', borderRadius: 10, padding: '12px 24px', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
const btnGhost = { background: 'none', color: MUT2, border: `1px solid ${LINE2}`, borderRadius: 10, padding: '12px 24px', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
function cellInput(left) { return { border: '1px solid transparent', borderRadius: 6, padding: '4px 6px', fontSize: 13.5, fontFamily: 'inherit', width: left ? '100%' : 90, textAlign: left ? 'left' : 'right', outline: 'none', background: 'transparent' }; }

function Stepper({ step }) {
  const s = step >= 41 ? 4 : step;
  const labels = ['Upload label', 'Review formula', 'Set quantity', 'Source it'];
  return (
    <div style={{ display: 'flex', maxWidth: 620, margin: '0 auto 6px' }}>
      {labels.map((l, i) => {
        const n = i + 1, active = s === n, done = s > n;
        return (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: active ? 700 : 500, color: active ? NAVY2 : MUT2 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', margin: '0 auto 7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              background: active ? '#C9A84C' : done ? NAVY2 : '#fff', color: active ? NAVY2 : done ? PAPER2 : MUT2, border: `2px solid ${active ? '#C9A84C' : done ? NAVY2 : LINE2}` }}>{n}</div>
            {l}
          </div>
        );
      })}
    </div>
  );
}
function Card({ title, sub, children }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE2}`, borderRadius: 16, boxShadow: '0 6px 24px rgba(13,31,60,.06)', margin: '20px 0', overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${LINE2}` }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: NAVY2 }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: MUT2, marginTop: 2 }}>{sub}</div>}
        </div>
      )}
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}
function Th({ children, right }) { return <th style={{ textAlign: right ? 'right' : 'left', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: MUT2, fontWeight: 600, padding: '8px 12px', borderBottom: `1px solid ${LINE2}` }}>{children}</th>; }
function Td({ children, right, strong }) { return <td style={{ padding: '10px 12px', borderBottom: '1px solid #F2ECDE', textAlign: right ? 'right' : 'left', fontWeight: strong ? 600 : 400, color: strong ? NAVY2 : INK2() }}>{children}</td>; }
function INK2() { return '#1a2233'; }
function Note({ children }) { return <div style={{ fontSize: 12, color: MUT2, marginTop: 14, display: 'flex', gap: 7 }}><span style={{ color: '#a8892f' }}>✦</span><span>{children}</span></div>; }
function Actions({ back, next, nextLabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
      <button onClick={back} style={btnGhost}>← Back</button>
      <button onClick={next} style={btnPrimary}>{nextLabel}</button>
    </div>
  );
}
function Choice({ icon, title, desc, go, onClick, soon }) {
  return (
    <div onClick={onClick} style={{ position: 'relative', border: `1.5px solid ${LINE2}`, borderRadius: 14, padding: '22px 20px', cursor: 'pointer', background: '#fff', opacity: soon ? 0.85 : 1 }}>
      {soon && <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', background: '#FBF2E1', color: '#B7791F', borderRadius: 20, padding: '3px 10px' }}>Coming soon</span>}
      <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY2, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: MUT2, lineHeight: 1.5 }}>{desc}</div>
      <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: '#a8892f' }}>{go}</div>
    </div>
  );
}
function Field({ label, children }) { return <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1a2233', marginBottom: 6 }}>{label}</label>{children}</div>; }
function ContactStep({ title, summary, form, setForm, busy, onBack, onSubmit, submitLabel }) {
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <Card title={title} sub="Confirm your details and we'll get quotes moving.">
      <div style={{ background: PAPER2, border: `1px solid ${LINE2}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: NAVY2, fontWeight: 600 }}>{summary}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
        <Field label="Your name"><input value={form.name} onChange={set('name')} style={{ ...inp, width: '100%' }} placeholder="Jane Doe" /></Field>
        <Field label="Work email"><input value={form.email} onChange={set('email')} style={{ ...inp, width: '100%' }} placeholder="jane@brand.com" /></Field>
        <Field label="Company"><input value={form.company} onChange={set('company')} style={{ ...inp, width: '100%' }} placeholder="Your brand" /></Field>
        <Field label="Country">
          <select value={form.country} onChange={set('country')} style={{ ...inp, width: '100%' }}>
            {['United States', 'United Kingdom', 'Germany', 'France', 'Spain', 'India', 'UAE', 'Canada', 'Australia', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
        <button onClick={onBack} style={btnGhost}>← Back</button>
        <button onClick={onSubmit} disabled={busy || !form.email} style={{ ...btnPrimary, opacity: (busy || !form.email) ? 0.5 : 1 }}>{busy ? 'Submitting…' : submitLabel}</button>
      </div>
      {!form.email && <div style={{ fontSize: 11, color: MUT2, marginTop: 8, textAlign: 'right' }}>Email is required so we can send your quote.</div>}
    </Card>
  );
}

/* ── pure utils ───────────────────────────────────────────────────────────── */
function parseNum(s) { return parseFloat(String(s).replace(/,/g, '')) || 0; }
function round(n) { return n >= 1 ? Math.round(n * 10) / 10 : Math.round(n * 1000) / 1000; }
function fmt(n) { return round(n).toLocaleString(undefined, { maximumFractionDigits: n >= 1 ? 1 : 3 }); }
function products0(computed) { return computed.filter(r => r.totalKg > 0); }
