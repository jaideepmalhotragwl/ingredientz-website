import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const CAT_ICONS = {
  "Botanical Extracts":"🌿","Herbal Powders":"🌱","Fruit Powders":"🍊",
  "Mushroom Extracts":"🍄","Vitamins & Minerals":"⚗️","Greens & Superfoods":"🥬",
  "Enzymes":"🧬","Probiotics & Prebiotics":"🦠","Proteins & Amino Acids":"💪",
  "Fatty Acids & Oils":"🫙","Animal & Marine":"🐟","Cosmeceuticals":"✨",
  "Sports Nutrition":"🏋️","Food Ingredients":"🌾","Chemical":"🧪",
  "Premixes & Blends":"⚖️","Pharmaceutical":"💊","Dairy Ingredients":"🥛",
  "Feed":"🌾","Pet Food":"🐾",
};

const CAT_COLORS = {
  "Botanical Extracts":["#E6F4EA","#2d6a4f"],"Herbal Powders":["#F0FDF4","#166534"],
  "Mushroom Extracts":["#FDF4FF","#6b21a8"],"Vitamins & Minerals":["#EFF6FF","#1d4ed8"],
  "Enzymes":["#FEFCE8","#a16207"],"Probiotics & Prebiotics":["#F0FDF4","#15803d"],
  "Proteins & Amino Acids":["#FFF7ED","#c2410c"],"Animal & Marine":["#EFF6FF","#0369a1"],
  "Cosmeceuticals":["#FDF4FF","#7e22ce"],"Sports Nutrition":["#FFF1F2","#be123c"],
  "Pharmaceutical":["#F0F9FF","#0369a1"],"Dairy Ingredients":["#FFFBEB","#d97706"],
};

export default function Categories() {
  const [cats, setCats]     = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("product_categories").select("*").eq("active",true).order("sort_order"),
      supabase.from("products").select("category_id,status").eq("status","active")
    ]).then(([{data:c},{data:p}]) => {
      setCats(c||[]);
      const cnt={};
      (p||[]).forEach(pr => { cnt[pr.category_id]=(cnt[pr.category_id]||0)+1; });
      setCounts(cnt);
      setLoading(false);
    });
  },[]);

  return (
    <div style={{ minHeight:"70vh" }}>
      <div style={{ background:"#0D1F3C", padding:"48px 0" }}>
        <div className="container">
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:42, color:"white", fontWeight:400, letterSpacing:-1, marginBottom:10 }}>Product Categories</h1>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>{cats.length} categories · {Object.values(counts).reduce((a,b)=>a+b,0)} active products</p>
        </div>
      </div>

      <div className="container" style={{ padding:"48px 32px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#94a3b8" }}>Loading…</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {cats.map(cat => {
              const [bg, textColor] = CAT_COLORS[cat.name]||["#F1F5F9","#475569"];
              const count = counts[cat.id]||0;
              return (
                <Link key={cat.id} to={`/products?cat=${cat.slug}`} style={{ textDecoration:"none" }}>
                  <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:14, overflow:"hidden", transition:"all 0.2s", cursor:"pointer" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#1877F2";e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(24,119,242,0.1)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    {/* Banner */}
                    <div style={{ background:bg, height:80, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>
                      {CAT_ICONS[cat.name]||"🌿"}
                    </div>
                    <div style={{ padding:"14px 16px" }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"#0D1F3C", marginBottom:4 }}>{cat.name}</div>
                      {cat.description && <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5, marginBottom:8 }}>{cat.description}</div>}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:10, color:count>0?"#1877F2":"#94a3b8", fontWeight:600 }}>{count} products</span>
                        <span style={{ fontSize:11, color:"#1877F2" }}>Browse →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
