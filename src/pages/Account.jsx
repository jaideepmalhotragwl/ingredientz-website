import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { LoginModal } from "../components/Navbar.jsx";

const STAGE_COLORS = {
  "New Enquiry":"#64748b","Sourcing Awaited":"#1877F2","Quotation Sent":"#1877F2",
  "Price Negotiation":"#f59e0b","Awaiting PO":"#f59e0b","PO Received":"#22c55e",
  "Lost":"#ef4444","No Response":"#94a3b8","On Hold":"#9b59b6"
};

export default function Account() {
  const [session, setSession] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) loadEnquiries(session.user.email);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) loadEnquiries(session.user.email);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadEnquiries(email) {
    setLoading(true);
    const { data } = await supabase.from("enquiries").select("*").eq("email",email).order("created_at",{ascending:false});
    setEnquiries(data||[]);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setEnquiries([]);
  }

  if (!session) return (
    <div style={{ minHeight:"70vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", maxWidth:400 }}>
        <img src="/logo.png" alt="Ingredientz" style={{ height:40, objectFit:"contain", marginBottom:24 }}/>
        <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:"#0D1F3C", fontWeight:400, marginBottom:10 }}>Your Account</h1>
        <p style={{ fontSize:14, color:"#64748b", marginBottom:24, lineHeight:1.7 }}>Login with your email OTP to view your enquiries, quotations and order status.</p>
        <button onClick={()=>setShowLogin(true)}
          style={{ background:"#0D1F3C", color:"white", border:"none", borderRadius:8, padding:"11px 32px", fontSize:13, fontWeight:500, cursor:"pointer" }}>
          Login with OTP →
        </button>
        {showLogin&&<LoginModal onClose={()=>setShowLogin(false)}/>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"70vh" }}>
      {/* Header */}
      <div style={{ background:"#0D1F3C", padding:"36px 0" }}>
        <div className="container" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:32, color:"white", fontWeight:400 }}>My Account</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginTop:4 }}>{session.user.email}</p>
          </div>
          <button onClick={logout} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"white", borderRadius:6, padding:"7px 16px", fontSize:12, cursor:"pointer" }}>
            Logout
          </button>
        </div>
      </div>

      <div className="container" style={{ padding:"40px 32px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ fontSize:20, fontWeight:600, color:"#0D1F3C" }}>My Enquiries ({enquiries.length})</h2>
          <Link to="/enquiry">
            <button style={{ background:"#0D1F3C", color:"white", border:"none", borderRadius:6, padding:"8px 18px", fontSize:12, fontWeight:500, cursor:"pointer" }}>
              + New Enquiry
            </button>
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8" }}>Loading your enquiries…</div>
        ) : enquiries.length===0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
            <div style={{ fontSize:16, fontWeight:600, color:"#0D1F3C", marginBottom:8 }}>No enquiries yet</div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>Browse our catalogue and request a quote</div>
            <Link to="/products">
              <button style={{ background:"#0D1F3C", color:"white", border:"none", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:500, cursor:"pointer" }}>
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {enquiries.map(enq => {
              const products = Array.isArray(enq.products)?enq.products:[];
              const stageColor = STAGE_COLORS[enq.stage]||"#64748b";
              return (
                <div key={enq.id} style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:"18px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:"#0D1F3C" }}>ENQ-{enq.id}</span>
                        <span style={{ background:`${stageColor}18`, color:stageColor, border:`1px solid ${stageColor}33`, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:600 }}>{enq.stage}</span>
                      </div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>
                        {new Date(enq.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:"#64748b", textAlign:"right" }}>
                      {enq.assigned_to&&<div style={{ marginBottom:2 }}>Assigned to: <strong>{enq.assigned_to}</strong></div>}
                      {enq.country&&<div>{enq.country}</div>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {products.map((p,i)=>(
                      <span key={i} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, padding:"4px 10px", fontSize:11, color:"#475569" }}>
                        {p.name}{p.qty?` — ${p.qty} ${p.unit||"kg"}`:""}
                      </span>
                    ))}
                  </div>
                  {enq.notes&&<div style={{ fontSize:11, color:"#94a3b8", marginTop:8, fontStyle:"italic" }}>{enq.notes}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
