import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabase.js";

/**
 * CountryPhoneFields
 *
 * Two linked, required fields: Country and Phone.
 * Picking a country sets the phone's dial prefix automatically.
 *
 * Props:
 *   value    { iso2, name, dial, national }
 *   onChange (next) => void   — called with the same shape
 *   error    string           — optional, shows red border + message
 *
 * Reads from the `countries` table. Nothing else in the app needs
 * to know about dial codes.
 */

const LABEL = {
  fontSize: 11, fontWeight: 600, color: "#475569",
  letterSpacing: 0.5, display: "block", marginBottom: 5,
};

const FIELD = {
  width: "100%", border: "1px solid #e2e8f0", borderRadius: 8,
  padding: "10px 12px", fontSize: 13, outline: "none",
  fontFamily: "DM Sans, sans-serif", background: "white",
};

export default function CountryPhoneFields({ value, onChange, error }) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState(0);

  const boxRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // ---- load countries once ------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from("countries")
        .select("iso2, name, dial_code, flag")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (cancelled) return;
      if (err || !data) {
        setLoadFailed(true);
      } else {
        setCountries(data);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- close on outside click / Escape ------------------------
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.iso2.toLowerCase() === q ||
      c.dial_code.replace("+", "").startsWith(q.replace("+", ""))
    );
  }, [countries, search]);

  useEffect(() => { setCursor(0); }, [search]);

  // keep the highlighted row scrolled into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const row = listRef.current.children[cursor];
    if (row) row.scrollIntoView({ block: "nearest" });
  }, [cursor, open]);

  function pick(c) {
    onChange({
      iso2: c.iso2,
      name: c.name,
      dial: c.dial_code,
      national: value?.national || "",
    });
    setOpen(false);
    setSearch("");
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[cursor]) pick(filtered[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const selected = value?.iso2 ? value : null;
  const borderColor = error ? "#ef4444" : "#e2e8f0";

  // If the table can't be read, fall back to plain text inputs so the
  // form still submits. Better a typed country than a lost enquiry.
  if (loadFailed) {
    return (
      <>
        <div>
          <label style={LABEL}>Country *</label>
          <input
            style={FIELD}
            placeholder="United States"
            value={value?.name || ""}
            onChange={e => onChange({ ...value, name: e.target.value, iso2: null })}
          />
        </div>
        <div>
          <label style={LABEL}>Phone *</label>
          <input
            style={FIELD}
            placeholder="+1 234 567 8900"
            value={value?.national || ""}
            onChange={e => onChange({ ...value, national: e.target.value })}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* ---------------- Country ---------------- */}
      <div ref={boxRef} style={{ position: "relative" }}>
        <label style={LABEL}>Country *</label>

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          disabled={loading}
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{
            ...FIELD,
            border: `1px solid ${borderColor}`,
            textAlign: "left", cursor: loading ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
            color: selected ? "#0f172a" : "#94a3b8",
          }}
        >
          {selected
            ? <><span>{countries.find(c => c.iso2 === selected.iso2)?.flag}</span><span>{selected.name}</span></>
            : <span>{loading ? "Loading…" : "Select country"}</span>}
          <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 10 }}>▾</span>
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
            marginTop: 4, background: "white", border: "1px solid #e2e8f0",
            borderRadius: 8, boxShadow: "0 8px 24px rgba(13,31,60,0.12)",
            overflow: "hidden",
          }}>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search country or code"
              style={{
                width: "100%", border: "none", borderBottom: "1px solid #f1f5f9",
                padding: "10px 12px", fontSize: 13, outline: "none",
                fontFamily: "DM Sans, sans-serif",
              }}
            />
            <div ref={listRef} role="listbox" style={{ maxHeight: 240, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ padding: "12px", fontSize: 12, color: "#94a3b8" }}>
                  No match. Try the country name or dial code.
                </div>
              )}
              {filtered.map((c, i) => (
                <div
                  key={c.iso2}
                  role="option"
                  aria-selected={selected?.iso2 === c.iso2}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => pick(c)}
                  style={{
                    padding: "8px 12px", fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    background: i === cursor ? "#f1f5f9" : "white",
                  }}
                >
                  <span>{c.flag}</span>
                  <span style={{ flex: 1, color: "#0f172a" }}>{c.name}</span>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>{c.dial_code}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------------- Phone ---------------- */}
      <div>
        <label style={LABEL}>Phone *</label>
        <div style={{
          display: "flex", alignItems: "center",
          border: `1px solid ${borderColor}`, borderRadius: 8,
          background: "white", overflow: "hidden",
        }}>
          <span style={{
            padding: "10px 10px 10px 12px", fontSize: 13,
            color: selected ? "#475569" : "#cbd5e1",
            borderRight: "1px solid #f1f5f9", whiteSpace: "nowrap",
          }}>
            {selected?.dial || "+—"}
          </span>
          <input
            type="tel"
            inputMode="tel"
            value={value?.national || ""}
            onChange={e => onChange({ ...value, national: e.target.value.replace(/[^\d\s-]/g, "") })}
            placeholder={selected ? "234 567 8900" : "Select country first"}
            style={{
              flex: 1, border: "none", padding: "10px 12px",
              fontSize: 13, outline: "none", fontFamily: "DM Sans, sans-serif",
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{ gridColumn: "span 2", fontSize: 12, color: "#ef4444", marginTop: -6 }}>
          {error}
        </div>
      )}
    </>
  );
}
