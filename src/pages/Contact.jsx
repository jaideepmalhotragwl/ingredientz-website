import { useState } from "react";
import { supabase } from "../lib/supabase.js";

const RESEND_KEY = "re_5zF5tNDR_759Q9NboE6v88NoCmRiDQtdY";

export default function Contact() {
  const [form, setForm]   = useState({ name:"", company:"", email:"", subject:"", message:"" });
  const [sending, setSending] = useState(false);
  const [done, setDone]   = useState(false);
  const [error, setError] = useState("");

  function setF(k,v){ setForm(f=>({...f,[k]:v})); }

  async function submit(e) {
    e.preventDefault();
    if (!form.email||!form.message) { setError("Email and message are required"); return; }
    setSending(true); setError("");
    try {
      await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{"Authorization":`Bearer ${RESEND_KEY}`,"Content-Type":"application/json"},
        body:JSON.stringify({
          from:"Ingredientz Website <sales@mail.ingredientz.co>",
          to:"sales@ingredientz.co",
          reply_to:form.email,
          subject:`Website Contact: ${form.subject||"General Enquiry"} — ${form.name||form.email}`,
          html:`<p><b>From:</b> ${form.name} (${form.company})<br/><b>Email:</b> ${form.email}<br/><b>Subject:</b> ${form.subject}</p><p>${form.message}</p>`
        })
      });
      setDone(true);
    } catch(e) { setError("Failed to send. Please email us directly at sales@ingredientz.co"); }
    finally { setSending(false); }
  }

  return (
    <div style={{ minHeight:"70vh" }}>
      <div style={{ background:"#0D1F3C", padding:"48px 0" }}>
        <div className="container">
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:42, color:"white", fontWeight:400, letterSpacing:-1 }}>Contact Us</h1>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, marginTop:8 }}>Get in touch with our team. We respond within 24 hours.</p>
        </div>
      </div>

      <div className="container" style={{ padding:"48px 32px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48 }}>

          {/* Contact info */}
          <div>
            <h2 style={{ fontSize:22, fontWeight:600, color:"#0D1F3C", marginBottom:24 }}>Get in touch</h2>
            {[
              ["General Enquiries","sales@ingredientz.co","For product enquiries and quotations"],
              ["Procurement","procurement@ingredientz.co","For supplier and sourcing queries"],
              ["Headquarters","Mumbai, India","Proingredientz Connections Pvt. Ltd."],
              ["Registered Office","Dover, DE 19901, USA","Ingredientz Inc."],
            ].map(([title,value,desc])=>(
              <div key={title} style={{ marginBottom:24, paddingBottom:24, borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{title}</div>
                <div style={{ fontSize:14, fontWeight:500, color:"#0D1F3C", marginBottom:2 }}>{value}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{desc}</div>
              </div>
            ))}

            <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0D1F3C", marginBottom:6 }}>Regional Sales Teams</div>
              {[["🇺🇸 North America","Sidd"],["🇬🇧 United Kingdom","Shruti"],["🇩🇪 Germany / EU","Ayushi"],["🇫🇷 France","Param"]].map(([r,n])=>(
                <div key={r} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:6 }}>
                  <span>{r}</span><span style={{ color:"#0D1F3C", fontWeight:500 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div>
            {done ? (
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:32, textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
                <div style={{ fontSize:16, fontWeight:600, color:"#166534", marginBottom:8 }}>Message sent!</div>
                <div style={{ fontSize:13, color:"#4ade80" }}>We'll get back to you within 24 hours.</div>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h2 style={{ fontSize:22, fontWeight:600, color:"#0D1F3C", marginBottom:24 }}>Send a message</h2>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  {[["Name","name","text","Your name"],["Company","company","text","Company name"],["Email *","email","email","you@company.com"],["Subject","subject","text","What's this about?"]].map(([label,key,type,ph])=>(
                    <div key={key}>
                      <label style={{ fontSize:11, fontWeight:600, color:"#475569", display:"block", marginBottom:5 }}>{label}</label>
                      <input type={type} value={form[key]} onChange={e=>setF(key,e.target.value)} placeholder={ph}
                        style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, outline:"none" }}/>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#475569", display:"block", marginBottom:5 }}>Message *</label>
                  <textarea value={form.message} onChange={e=>setF("message",e.target.value)} rows={5} placeholder="Tell us about your requirement…"
                    style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, outline:"none", resize:"vertical" }}/>
                </div>
                {error&&<div style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>{error}</div>}
                <button type="submit" disabled={sending}
                  style={{ background:"#0D1F3C", color:"white", border:"none", borderRadius:8, padding:"11px 28px", fontSize:13, fontWeight:500, cursor:"pointer", opacity:sending?0.7:1 }}>
                  {sending?"Sending…":"Send Message →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
