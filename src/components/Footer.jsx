import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer>
      <div style={{ background:"#0D1F3C", padding:"56px 0 0" }}>
        <div className="container">
          <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1fr 1fr 1fr", gap:40, paddingBottom:40, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>

            {/* Brand col */}
            <div>
              <div style={{ marginBottom:12 }}>
                <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:"white", letterSpacing:-0.5 }}>Ingredientz</span>
              </div>
              <div style={{ color:"#2dd4bf", fontSize:10, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
                ⚡ The Nutraceutical Superfactory
              </div>
              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:12, lineHeight:1.75, marginBottom:20 }}>
                Your single point of contact for high-purity ingredients including plant extracts, enzymes, probiotics, prebiotics, minerals and functional botanicals. Sourced from verified factories across 6 global regions. By ensuring quality, safety and traceability across our supply chain, we simplify global nutraceutical trade. Delivered to 200+ brands worldwide.
              </p>

              {/* Offices */}
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                {[
                  ["🇺🇸","Registered Office","Ingredientz Inc, 8 The Green, Ste A, Dover, DE 19901, USA"],
                  ["🇺🇸","Warehouse","13825 W Business Center Drive, Suite B, Green Oaks, IL 60045, USA"],
                  ["🇮🇳","India","Mumbai · Indore · Haridwar"],
                  ["🇩🇪","Europe","Cologne, Germany"],
                  ["🇭🇰","Asia","Hong Kong"],
                ].map(([flag, label, value]) => (
                  <div key={label} style={{ display:"flex", gap:8 }}>
                    <span style={{ fontSize:13, flexShrink:0, marginTop:1 }}>{flag}</span>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", lineHeight:1.5 }}>
                      <span style={{ color:"rgba(255,255,255,0.6)", fontWeight:600, fontSize:10, display:"block", marginBottom:1 }}>{label}</span>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div style={{ display:"flex", flexDirection:"column", gap:5, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                {[
                  ["📞","+1 270 721 5321"],
                  ["✉️","sales@ingredientz.co"],
                  ["✉️","contact@ingredientz.co"],
                ].map(([icon, val]) => (
                  <div key={val} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"rgba(255,255,255,0.4)" }}>
                    <span>{icon}</span><span>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>Products</h4>
              {[["Botanical Extracts","/products?cat=botanical-extracts"],["Mushroom Extracts","/products?cat=mushroom-extracts"],["Vitamins & Minerals","/products?cat=vitamins-minerals"],["Probiotics","/products?cat=probiotics-prebiotics"],["All Categories","/categories"]].map(([label,href]) => (
                <Link key={label} to={href} style={{ display:"block", color:"rgba(255,255,255,0.4)", fontSize:12, marginBottom:10, textDecoration:"none" }}
                  onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.8)"}
                  onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.4)"}>
                  {label}
                </Link>
              ))}
            </div>

            {/* Company */}
            <div>
              <h4 style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>Company</h4>
              {[["About Us","/about"],["Our Suppliers","/suppliers"],["Contact","/contact"],["Careers","#"]].map(([label,href]) => (
                <Link key={label} to={href} style={{ display:"block", color:"rgba(255,255,255,0.4)", fontSize:12, marginBottom:10, textDecoration:"none" }}
                  onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.8)"}
                  onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.4)"}>
                  {label}
                </Link>
              ))}
            </div>

            {/* Account */}
            <div>
              <h4 style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>Account</h4>
              {[["Login with OTP","#"],["Submit Enquiry","/enquiry"],["Track Orders","/account"],["Privacy Policy","/privacy"]].map(([label,href]) => (
                <Link key={label} to={href} style={{ display:"block", color:"rgba(255,255,255,0.4)", fontSize:12, marginBottom:10, textDecoration:"none" }}
                  onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.8)"}
                  onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.4)"}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0" }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>© 2026 Ingredientz Inc. All rights reserved.</span>
            <div style={{ display:"flex", gap:16 }}>
              {["Privacy","Terms","Cookies"].map(l => (
                <Link key={l} to={`/${l.toLowerCase()}`} style={{ fontSize:11, color:"rgba(255,255,255,0.25)", textDecoration:"none" }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
