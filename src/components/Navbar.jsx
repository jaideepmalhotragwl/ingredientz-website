import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const LANGS = ["EN","FR","DE","ES"];
const T = {
  EN: { ingredients:"Ingredients", products:"Products", categories:"Categories", about:"About", contact:"Contact", blog:"Blog", login:"Login", quote:"Request Quote" },
  FR: { ingredients:"Ingrédients", products:"Produits", categories:"Catégories", about:"À propos", contact:"Contact", blog:"Blog", login:"Connexion", quote:"Demander un devis" },
  DE: { ingredients:"Inhaltsstoffe", products:"Produkte", categories:"Kategorien", about:"Über uns", contact:"Kontakt", blog:"Blog", login:"Anmelden", quote:"Angebot anfordern" },
  ES: { ingredients:"Ingredientes", products:"Productos", categories:"Categorías", about:"Acerca de", contact:"Contacto", blog:"Blog", login:"Iniciar sesión", quote:"Solicitar cotización" },
};

// Maps the current site language to the correct static ingredients hub URL.
// EN -> /ingredients, others -> /<lang>/ingredients
const INGREDIENTS_HREF = { EN:"/ingredients", FR:"/fr/ingredients", DE:"/de/ingredients", ES:"/es/ingredients" };

export function Navbar({ lang, setLang, cartCount }) {
  const [showLogin, setShowLogin] = useState(false);
  const t = T[lang] || T.EN;
  const ingredientsHref = INGREDIENTS_HREF[lang] || INGREDIENTS_HREF.EN;

  return (
    <>
      {/* Language bar */}
      <div style={{ background:"#0D1F3C", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"5px 0" }}>
        <div className="container" style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:4 }}>
          {LANGS.map((l,i) => (
            <span key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              {i>0 && <span style={{ color:"rgba(255,255,255,0.15)", fontSize:10 }}>|</span>}
              <button onClick={()=>setLang(l)} style={{ background:lang===l?"rgba(255,255,255,0.12)":"none", border:"none", color:lang===l?"white":"rgba(255,255,255,0.4)", fontSize:10, fontWeight:lang===l?500:400, padding:"2px 8px", borderRadius:3, cursor:"pointer", letterSpacing:1 }}>{l}</button>
            </span>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ background:"white", borderBottom:"1px solid #e2e8f0", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="container" style={{ height:64, display:"flex", alignItems:"center", gap:24 }}>
          <Link to="/" style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
            <img src="/logo.png" alt="Ingredientz" style={{ height:36, width:"auto", objectFit:"contain" }}/>
          </Link>
          <div style={{ display:"flex", gap:2, marginLeft:8 }}>
            {/* Ingredients is a STATIC page (not a React route) — must use a plain <a> so the
                browser does a full server navigation and hits the Amplify rewrite rule. */}
            <a href={ingredientsHref} style={{ color:"#64748b", fontSize:13, padding:"6px 12px", borderRadius:6, textDecoration:"none" }}
              onMouseEnter={e=>{e.target.style.color="#0D1F3C";e.target.style.background="#f8fafc";}}
              onMouseLeave={e=>{e.target.style.color="#64748b";e.target.style.background="transparent";}}>
              {t.ingredients}
            </a>
            {/* These are real React routes — keep as <Link> for client-side routing. */}
            {[["products","/products"],["categories","/categories"],["about","/about"],["contact","/contact"],["blog","/blog"]].map(([key,href])=>(
              <Link key={key} to={href} style={{ color:"#64748b", fontSize:13, padding:"6px 12px", borderRadius:6, textDecoration:"none" }}
                onMouseEnter={e=>{e.target.style.color="#0D1F3C";e.target.style.background="#f8fafc";}}
                onMouseLeave={e=>{e.target.style.color="#64748b";e.target.style.background="transparent";}}>
                {t[key]}
              </Link>
            ))}
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            {cartCount>0&&(
              <Link to="/enquiry" style={{ display:"flex", alignItems:"center", gap:6, background:"#EEF4FF", color:"#1877F2", borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:600, textDecoration:"none" }}>
                <span style={{ background:"#1877F2", color:"white", borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>{cartCount}</span>
                View Enquiry
              </Link>
            )}
            <button onClick={()=>setShowLogin(true)} style={{ background:"none", border:"1px solid #e2e8f0", color:"#0D1F3C", borderRadius:6, padding:"7px 16px", fontSize:12, cursor:"pointer" }}>{t.login}</button>
            <Link to="/enquiry">
              <button style={{ background:"#0D1F3C", border:"none", color:"white", borderRadius:6, padding:"8px 18px", fontSize:12, fontWeight:500, cursor:"pointer" }}>{t.quote}</button>
            </Link>
          </div>
        </div>
      </nav>
      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)}/>}
    </>
  );
}

export function LoginModal({ onClose }) {
  const [email,setEmail]=useState("");
  const [otp,setOtp]=useState("");
  const [step,setStep]=useState("email");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const navigate=useNavigate();

  async function sendOtp(){
    if(!email.trim()){setError("Please enter your email");return;}
    setLoading(true);setError("");
    try{
      const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true}});
      if(error)throw error;
      setStep("otp");
    }catch(e){setError(e.message);}
    finally{setLoading(false);}
  }

  async function verifyOtp(){
    if(!otp.trim()){setError("Please enter the OTP");return;}
    setLoading(true);setError("");
    try{
      const {error}=await supabase.auth.verifyOtp({email,token:otp,type:"email"});
      if(error)throw error;
      setStep("done");
      setTimeout(()=>{onClose();navigate("/account");},1200);
    }catch(e){setError(e.message);}
    finally{setLoading(false);}
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"white",borderRadius:16,padding:32,width:"100%",maxWidth:400,position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:20,color:"#94a3b8",cursor:"pointer"}}>×</button>
        <div style={{textAlign:"center",marginBottom:20}}>
          <img src="/logo.png" alt="Ingredientz" style={{height:32,objectFit:"contain"}}/>
        </div>
        {step==="done"?(
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>✓</div>
            <div style={{fontSize:16,fontWeight:600,color:"#0D1F3C"}}>Login successful</div>
            <div style={{fontSize:13,color:"#64748b",marginTop:6}}>Redirecting to your account…</div>
          </div>
        ):(
          <>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#0D1F3C",marginBottom:6}}>{step==="email"?"Login to your account":step==="otp"?"Enter your OTP":"Check your email"}</div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:24}}>{step==="email"?"Enter your business email. We'll send a login link or code.":step==="otp"?`We sent a 6-digit code to ${email}`:`We sent a login link to ${email}. Click it to sign in — or enter the code below if you received one.`}</div>
            {step==="email"
              ?<input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendOtp()} type="email" placeholder="you@company.com" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px",fontSize:14,outline:"none",marginBottom:12}}/>
              :<div>
                <input value={otp} onChange={e=>setOtp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verifyOtp()} type="text" placeholder="123456" maxLength={8} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px",fontSize:24,letterSpacing:8,outline:"none",marginBottom:12,textAlign:"center"}}/>
                <p style={{fontSize:11,color:"#94a3b8",textAlign:"center",marginBottom:12}}>No code? Check your email for a magic link instead.</p>
              </div>
            }
            {error&&<div style={{fontSize:12,color:"#ef4444",marginBottom:10}}>{error}</div>}
            <button onClick={step==="email"?sendOtp:verifyOtp} disabled={loading} style={{width:"100%",background:"#0D1F3C",color:"white",border:"none",borderRadius:8,padding:11,fontSize:13,fontWeight:500,cursor:"pointer",opacity:loading?0.7:1}}>
              {loading?"Please wait…":step==="email"?"Send Login Link →":"Verify Code →"}
            </button>
            {step==="otp"&&<button onClick={()=>{setStep("email");setOtp("");}} style={{width:"100%",background:"none",border:"none",color:"#64748b",fontSize:12,marginTop:10,cursor:"pointer"}}>← Use a different email</button>}
          </>
        )}
      </div>
    </div>
  );
}
