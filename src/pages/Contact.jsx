import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.js";

const RESEND_KEY = "re_5zF5tNDR_759Q9NboE6v88NoCmRiDQtdY";

const LOCATIONS = [
  { id:"dover",    name:"Dover, DE",      sub:"Registered Office", lon:-75.5,  lat:39.2,  type:"main", flag:"🇺🇸" },
  { id:"grenoaks", name:"Green Oaks, IL", sub:"Warehouse",         lon:-87.8,  lat:42.3,  type:"sec",  flag:"🇺🇸" },
  { id:"cologne",  name:"Cologne",        sub:"Europe Office",     lon:6.96,   lat:50.94, type:"main", flag:"🇩🇪" },
  { id:"mumbai",   name:"Mumbai",         sub:"India HQ",          lon:72.88,  lat:19.08, type:"main", flag:"🇮🇳" },
  { id:"indore",   name:"Indore",         sub:"India",             lon:75.86,  lat:22.72, type:"sec",  flag:"🇮🇳" },
  { id:"haridwar", name:"Haridwar",       sub:"India",             lon:78.16,  lat:29.95, type:"sec",  flag:"🇮🇳" },
  { id:"dubai",    name:"Dubai",          sub:"Middle East",       lon:55.30,  lat:25.20, type:"sec",  flag:"🇦🇪" },
  { id:"egypt",    name:"Egypt",          sub:"Africa",            lon:31.24,  lat:30.06, type:"sec",  flag:"🇪🇬" },
  { id:"hk",       name:"Hong Kong",      sub:"Asia Pacific",      lon:114.18, lat:22.32, type:"main", flag:"🇭🇰" },
];

function WorldMap() {
  const svgRef = useRef(null);

  useEffect(() => {
    // Load D3 and TopoJSON dynamically
    const loadScripts = async () => {
      if (!window.d3) {
        await new Promise(resolve => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js";
          s.onload = resolve;
          document.head.appendChild(s);
        });
      }
      if (!window.topojson) {
        await new Promise(resolve => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/topojson@3/dist/topojson.min.js";
          s.onload = resolve;
          document.head.appendChild(s);
        });
      }
      drawMap();
    };
    loadScripts();
  }, []);

  function drawMap() {
    const d3 = window.d3;
    const topojson = window.topojson;
    const el = svgRef.current;
    if (!el) return;

    const width = 960, height = 480;
    const svg = d3.select(el).attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "#0a1e35");

    const projection = d3.geoNaturalEarth1().scale(153).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(world => {
        // Countries
        svg.append("g").selectAll("path")
          .data(topojson.feature(world, world.objects.countries).features)
          .join("path")
          .attr("fill", "#1e3a5f")
          .attr("stroke", "#0D1F3C")
          .attr("stroke-width", 0.4)
          .attr("d", path);

        // Borders
        svg.append("path")
          .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
          .attr("fill", "none").attr("stroke", "#0D1F3C").attr("stroke-width", 0.5).attr("d", path);

        // Connection lines between main offices
        const main = LOCATIONS.filter(l => l.type === "main");
        for (let i = 0; i < main.length - 1; i++) {
          const a = main[i], b = main[i + 1];
          const pa = projection([a.lon, a.lat]), pb = projection([b.lon, b.lat]);
          const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2 - 40;
          svg.append("path")
            .attr("d", `M${pa[0]},${pa[1]} Q${mx},${my} ${pb[0]},${pb[1]}`)
            .attr("fill", "none").attr("stroke", "#0EA5A0")
            .attr("stroke-width", 0.8).attr("stroke-dasharray", "4,5").attr("opacity", 0.3);
        }

        // Pins
        LOCATIONS.forEach(loc => {
          const [x, y] = projection([loc.lon, loc.lat]);
          const g = svg.append("g");

          if (loc.type === "main") {
            // Pulse ring
            const pulse = g.append("circle").attr("cx", x).attr("cy", y).attr("r", 5)
              .attr("fill", "none").attr("stroke", "#0EA5A0").attr("stroke-width", 1.5).attr("opacity", 0.5);

            function animatePulse() {
              pulse.attr("r", 5).attr("opacity", 0.6)
                .transition().duration(2000)
                .attr("r", 18).attr("opacity", 0)
                .on("end", animatePulse);
            }
            animatePulse();

            g.append("circle").attr("cx", x).attr("cy", y).attr("r", 5)
              .attr("fill", "#0EA5A0").attr("stroke", "white").attr("stroke-width", 1.5);

            // Smart label position
            const lx = x > 700 ? x - 85 : x + 10;
            const ly = y < 80 ? y + 14 : y - 28;
            const lw = loc.name.length * 6.5 + 20;

            g.append("rect").attr("x", lx).attr("y", ly).attr("width", lw).attr("height", 28).attr("rx", 4)
              .attr("fill", "#0D1F3C").attr("stroke", "rgba(14,165,160,0.5)").attr("stroke-width", 0.8);
            g.append("text").attr("x", lx + 7).attr("y", ly + 11)
              .attr("fill", "white").attr("font-family", "DM Sans,sans-serif").attr("font-size", "9px").attr("font-weight", "500")
              .text(`${loc.flag} ${loc.name}`);
            g.append("text").attr("x", lx + 7).attr("y", ly + 21)
              .attr("fill", "rgba(255,255,255,0.45)").attr("font-family", "DM Sans,sans-serif").attr("font-size", "7.5px")
              .text(loc.sub);
          } else {
            g.append("circle").attr("cx", x).attr("cy", y).attr("r", 3.5)
              .attr("fill", "#1877F2").attr("stroke", "white").attr("stroke-width", 1);
            const lx2 = x + 7, ly2 = y + 4;
            const lw2 = loc.name.length * 5.5 + 14;
            g.append("rect").attr("x", lx2).attr("y", ly2 - 10).attr("width", lw2).attr("height", 16).attr("rx", 3)
              .attr("fill", "rgba(13,31,60,0.9)").attr("stroke", "rgba(24,119,242,0.4)").attr("stroke-width", 0.6);
            g.append("text").attr("x", lx2 + 5).attr("y", ly2 + 1)
              .attr("fill", "rgba(255,255,255,0.7)").attr("font-family", "DM Sans,sans-serif").attr("font-size", "7.5px")
              .text(loc.name);
          }
        });
      });
  }

  return (
    <div style={{ background:"#0D1F3C", borderRadius:16, padding:24 }}>
      <svg ref={svgRef} style={{ width:"100%", height:"auto", display:"block" }}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginTop:16 }}>
        {[
          ["🇺🇸","United States","Dover, DE — HQ\nGreen Oaks, IL — Warehouse"],
          ["🇩🇪","Europe","Cologne, Germany"],
          ["🇮🇳","India","Mumbai · Indore · Haridwar"],
          ["🇦🇪🇪🇬","Middle East & Africa","Dubai, UAE · Egypt"],
          ["🇭🇰","Asia Pacific","Hong Kong"],
        ].map(([flag, region, cities]) => (
          <div key={region} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:16, marginBottom:5 }}>{flag}</div>
            <div style={{ fontSize:10, fontWeight:600, color:"white", marginBottom:3 }}>{region}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", lineHeight:1.6, whiteSpace:"pre-line" }}>{cities}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Contact() {
  const [form, setForm]     = useState({ name:"", company:"", email:"", phone:"", country:"", subject:"", message:"" });
  const [sending, setSending] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.email || !form.message) { setError("Email and message are required"); return; }
    setSending(true); setError("");
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Ingredientz Website <sales@mail.ingredientz.co>",
          to: "sales@ingredientz.co",
          reply_to: form.email,
          subject: `Website Contact: ${form.subject || "General Enquiry"} — ${form.name || form.email}`,
          html: `
            <p><b>From:</b> ${form.name} (${form.company})<br/>
            <b>Email:</b> ${form.email}<br/>
            <b>Phone:</b> ${form.phone || "—"}<br/>
            <b>Country:</b> ${form.country || "—"}<br/>
            <b>Subject:</b> ${form.subject || "—"}</p>
            <p><b>Message:</b><br/>${form.message}</p>
          `
        })
      });
      setDone(true);
    } catch(e) {
      setError("Failed to send. Please email us directly at sales@ingredientz.co");
    } finally {
      setSending(false);
    }
  }

  const inp = { width:"100%", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, outline:"none", fontFamily:"DM Sans,sans-serif", transition:"border 0.15s" };

  return (
    <div style={{ minHeight:"70vh" }}>
      {/* Header */}
      <div style={{ background:"#0D1F3C", padding:"48px 0" }}>
        <div className="container">
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:42, color:"white", fontWeight:400, letterSpacing:-1, marginBottom:10 }}>Contact Us</h1>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>Our global team is here to help. We respond within 24 hours.</p>
        </div>
      </div>

      {/* Form + Info */}
      <div style={{ padding:"56px 0", background:"white" }}>
        <div className="container">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, marginBottom:56 }}>

            {/* FORM */}
            <div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:"#0D1F3C", fontWeight:400, marginBottom:24 }}>Send us a message</h2>
              {done ? (
                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:32, textAlign:"center" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
                  <div style={{ fontSize:16, fontWeight:600, color:"#166534", marginBottom:8 }}>Message sent!</div>
                  <div style={{ fontSize:13, color:"#4ade80" }}>We'll get back to you within 24 hours.</div>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    {[
                      ["Full Name","name","text","John Smith"],
                      ["Company","company","text","Acme Nutrition Ltd"],
                      ["Business Email *","email","email","john@acmenutrition.com"],
                      ["Phone","phone","tel","+1 234 567 8900"],
                      ["Country","country","text","United States"],
                      ["Subject","subject","text","Product Enquiry"],
                    ].map(([label, key, type, ph]) => (
                      <div key={key} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <label style={{ fontSize:11, fontWeight:600, color:"#475569", letterSpacing:0.5 }}>{label}</label>
                        <input type={type} value={form[key]} onChange={e => setF(key, e.target.value)} placeholder={ph} style={inp}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:16 }}>
                    <label style={{ fontSize:11, fontWeight:600, color:"#475569", letterSpacing:0.5 }}>Message *</label>
                    <textarea value={form.message} onChange={e => setF("message", e.target.value)}
                      rows={5} placeholder="Tell us about your requirement…"
                      style={{ ...inp, resize:"vertical" }}/>
                  </div>
                  {error && <div style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>{error}</div>}
                  <button type="submit" disabled={sending}
                    style={{ background:"#0D1F3C", color:"white", border:"none", borderRadius:8, padding:"11px 28px", fontSize:13, fontWeight:500, cursor:"pointer", opacity:sending ? 0.7 : 1 }}>
                    {sending ? "Sending…" : "Send Message →"}
                  </button>
                  <p style={{ fontSize:11, color:"#94a3b8", marginTop:10 }}>
                    For urgent enquiries call <strong>+1 270 721 5321</strong>
                  </p>
                </form>
              )}
            </div>

            {/* INFO */}
            <div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:"#0D1F3C", fontWeight:400, marginBottom:20 }}>Get in touch</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                {[
                  ["✉️","Sales Enquiries","sales@ingredientz.co","For product enquiries and quotations"],
                  ["📩","General Contact","contact@ingredientz.co","For general queries and partnerships"],
                  ["📞","Phone — USA","+1 270 721 5321","Mon–Fri, 9am–6pm CT"],
                  ["🏢","Registered Office","8 The Green, Ste A, Dover, DE 19901, USA","Ingredientz Inc."],
                  ["🏭","Warehouse — USA","13825 W Business Center Dr, Suite B, Green Oaks, IL 60045","United States"],
                ].map(([icon, title, value, desc]) => (
                  <div key={title} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"12px 14px", display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:"#EEF4FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:600, color:"#94a3b8", letterSpacing:1, textTransform:"uppercase", marginBottom:2 }}>{title}</div>
                      <div style={{ fontSize:13, fontWeight:500, color:"#0D1F3C", marginBottom:2 }}>{value}</div>
                      <div style={{ fontSize:11, color:"#64748b" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Regional teams */}
              <h4 style={{ fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Regional Sales Teams</h4>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                {[["🇺🇸","North America","Sidd"],["🇬🇧","United Kingdom","Shruti"],["🇩🇪","Germany / EU","Ayushi"],["🇫🇷","France","Param"]].map(([flag, region, name]) => (
                  <div key={region} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:16, marginBottom:4 }}>{flag}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#0D1F3C" }}>{region}</div>
                    <div style={{ fontSize:11, color:"#64748b", marginTop:1 }}>{name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* World Map */}
          <div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:"#0D1F3C", fontWeight:400, marginBottom:6 }}>Our Global Presence</h2>
            <p style={{ fontSize:13, color:"#64748b", marginBottom:24 }}>Offices, warehouses and sourcing networks across 6 regions worldwide</p>
            <WorldMap/>
          </div>
        </div>
      </div>
    </div>
  );
}
