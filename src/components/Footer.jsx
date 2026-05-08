import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer>
      <div style={{ background:"#0D1F3C", padding:"48px 0 0" }}>
        <div className="container">
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:40, paddingBottom:40, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            <div>
              {/* Logo on dark — white filter to make it visible */}
              <div style={{ marginBottom:14 }}>
                <img src="/logo.png" alt="Ingredientz" style={{ height:32, objectFit:"contain", filter:"brightness(0) invert(1)", opacity:0.85 }}/>
              </div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, lineHeight:1.7, maxWidth:280 }}>
                Tech-enabled B2B nutraceutical ingredients distribution platform connecting global buyers with verified manufacturers across India, China and the EU.
              </p>
              <div style={{ marginTop:16, fontSize:11, color:"rgba(255,255,255,0.25)" }}>8 The Green, Suite A, Dover, DE 19901, USA</div>
            </div>
            {[
              { title:"Products", links:[["Botanical Extracts","/products?cat=botanical-extracts"],["Mushroom Extracts","/products?cat=mushroom-extracts"],["Vitamins & Minerals","/products?cat=vitamins-minerals"],["Probiotics","/products?cat=probiotics-prebiotics"],["All Categories","/categories"]] },
              { title:"Company", links:[["About Us","/about"],["Our Suppliers","/suppliers"],["Contact","/contact"],["Careers","#"]] },
              { title:"Account", links:[["Login with OTP","#"],["Submit Enquiry","/enquiry"],["Track Orders","/account"],["Privacy Policy","/privacy"]] },
            ].map(col=>(
              <div key={col.title}>
                <h4 style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>{col.title}</h4>
                {col.links.map(([label,href])=>(
                  <Link key={label} to={href} style={{ display:"block", color:"rgba(255,255,255,0.4)", fontSize:12, marginBottom:10, textDecoration:"none" }}
                    onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.8)"}
                    onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.4)"}>
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0" }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>© 2026 Ingredientz Inc. All rights reserved.</span>
            <div style={{ display:"flex", gap:16 }}>
              {["Privacy","Terms","Cookies"].map(l=>(
                <Link key={l} to={`/${l.toLowerCase()}`} style={{ fontSize:11, color:"rgba(255,255,255,0.25)", textDecoration:"none" }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
