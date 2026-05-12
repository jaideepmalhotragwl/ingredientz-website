import { Link } from "react-router-dom";
import { SEO, PAGE_SEO } from "../components/SEO.jsx";

export default function About() {
  return (
    <div style={{ minHeight:"70vh" }}>
      <SEO {...PAGE_SEO.about}/>
      <div style={{ background:"#0D1F3C", padding:"64px 0" }}>
        <div className="container" style={{ maxWidth:680 }}>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:48, color:"white", fontWeight:400, letterSpacing:-1, marginBottom:16 }}>
            Connecting the world's<br/><em style={{ color:"#2dd4bf", fontStyle:"italic" }}>nutraceutical supply chain</em>
          </h1>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:15, lineHeight:1.7, fontWeight:300 }}>
            Ingredientz is a tech-enabled B2B distribution platform that makes it easy for nutraceutical brands, formulators and manufacturers to source premium ingredients globally.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding:"64px 32px" }}>
        {/* Mission */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, marginBottom:64, alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10, fontWeight:600, color:"#1877F2", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Our Mission</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:32, color:"#0D1F3C", fontWeight:400, letterSpacing:-0.5, marginBottom:16 }}>Enabling small manufacturers to access international markets</h2>
            <p style={{ fontSize:14, color:"#64748b", lineHeight:1.8, marginBottom:16 }}>
              We built Ingredientz because we saw a clear problem — quality ingredient manufacturers in India, China and the EU struggled to reach global buyers, while brands spent weeks sourcing ingredients through fragmented networks.
            </p>
            <p style={{ fontSize:14, color:"#64748b", lineHeight:1.8 }}>
              Our platform sits in the middle, bringing transparency, speed and trust to every transaction. We handle sourcing, documentation and logistics coordination so you can focus on building great products.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["500+","Premium Ingredients"],["10+","Countries Served"],["200+","Brands Trust Us"],["48h","Quote Turnaround"]].map(([v,l])=>(
              <div key={l} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"20px 16px", textAlign:"center" }}>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:36, color:"#0D1F3C", letterSpacing:-1 }}>{v}</div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div style={{ marginBottom:64 }}>
          <div style={{ fontSize:10, fontWeight:600, color:"#1877F2", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Our Values</div>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:32, color:"#0D1F3C", fontWeight:400, letterSpacing:-0.5, marginBottom:28 }}>How we operate</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {[
              ["Transparency","Every quotation includes supplier details, lead times and documentation requirements. No hidden markups or surprise costs."],
              ["Speed","We respond to enquiries within 48 hours. Our network of verified suppliers means we can source most ingredients within days."],
              ["Quality","All our suppliers are pre-vetted with verified certifications. We never compromise on quality documentation — CoA, TDS and MSDS always provided."],
              ["Global reach","We source from India, China, Europe and North America. Wherever the best ingredient comes from, we can get it to you."],
              ["Tech-first","Our platform automates the tedious parts — RFQs, follow-ups, quotation tracking — so our team can focus on what matters."],
              ["Partnership","We're not just a marketplace. We build long-term relationships with both buyers and suppliers. Your success is our success."],
            ].map(([t,d])=>(
              <div key={t} style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:20 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#0D1F3C", marginBottom:8 }}>{t}</div>
                <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team regions */}
        <div style={{ background:"#0D1F3C", borderRadius:16, padding:"40px 48px" }}>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:"white", fontWeight:400, marginBottom:8 }}>Global presence</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginBottom:28 }}>Our regional teams ensure local expertise and fast response times.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {[["🇺🇸","North America","Covering USA & Canada"],["🇬🇧","United Kingdom","UK & Ireland coverage"],["🇩🇪","Germany / EU","France, Germany, Spain & EU"],["🇮🇳","India","Headquarters & sourcing base"]].map(([flag,region,desc])=>(
              <div key={region} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:16, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{flag}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"white", marginBottom:4 }}>{region}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
