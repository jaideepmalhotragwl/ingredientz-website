import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { SEO, generateProductSEO } from "../components/SEO.jsx";

export default function ProductDetail({ onAddToCart, cart }) {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    supabase.from("products").select("*,product_categories(name,slug)").eq("slug",slug).eq("status","active").single()
      .then(({ data }) => {
        setProduct(data);
        setLoading(false);
        if (data?.category_id) {
          supabase.from("products").select("*,product_categories(name)").eq("category_id",data.category_id).eq("status","active").neq("id",data.id).limit(4)
            .then(({ data:r }) => setRelated(r||[]));
        }
      });
  }, [slug]);

  const inCart = cart.some(p => p.id === product?.id);

  if (loading) return <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8" }}>Loading…</div>;
  if (!product) return (
    <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:48, color:"#e2e8f0" }}>404</div>
      <div style={{ color:"#64748b" }}>Product not found</div>
      <Link to="/products" style={{ color:"#1877F2", fontSize:13 }}>← Back to products</Link>
    </div>
  );

  const images = Array.isArray(product.images)&&product.images.length>0 ? product.images : [];
  const specs = product.specifications && Object.keys(product.specifications).length>0 ? Object.entries(product.specifications) : [];
  const tags = Array.isArray(product.tags) ? product.tags : [];

  return (
    <div style={{ minHeight:"70vh" }}>
      {product && <SEO {...generateProductSEO(product)} product={product}/>}
      {/* Breadcrumb */}
      <div style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0", padding:"12px 0" }}>
        <div className="container" style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, color:"#94a3b8" }}>
          <Link to="/" style={{ color:"#64748b", textDecoration:"none" }}>Home</Link>
          <span>›</span>
          <Link to="/products" style={{ color:"#64748b", textDecoration:"none" }}>Products</Link>
          {product.product_categories && <>
            <span>›</span>
            <Link to={`/products?cat=${product.product_categories.slug}`} style={{ color:"#64748b", textDecoration:"none" }}>{product.product_categories.name}</Link>
          </>}
          <span>›</span>
          <span style={{ color:"#0D1F3C" }}>{product.name}</span>
        </div>
      </div>

      <div className="container" style={{ padding:"40px 32px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, marginBottom:48 }}>

          {/* Images */}
          <div>
            <div style={{ background:"#f8fafc", borderRadius:14, overflow:"hidden", marginBottom:10, aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {images.length>0
                ?<img src={images[activeImg]} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                :<div style={{ textAlign:"center", color:"#94a3b8" }}>
                  <div style={{ fontSize:48, marginBottom:8 }}>🧪</div>
                  <div style={{ fontSize:12 }}>{product.product_categories?.name}</div>
                </div>
              }
            </div>
            {images.length>1&&(
              <div style={{ display:"flex", gap:8 }}>
                {images.map((img,i)=>(
                  <img key={i} src={img} alt="" onClick={()=>setActiveImg(i)}
                    style={{ width:60, height:60, objectFit:"cover", borderRadius:8, cursor:"pointer", border:activeImg===i?"2px solid #1877F2":"1px solid #e2e8f0" }}/>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{ fontSize:10, fontWeight:600, color:"#1877F2", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
              {product.product_categories?.name}
            </div>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:32, color:"#0D1F3C", fontWeight:400, letterSpacing:-0.5, marginBottom:12, lineHeight:1.2 }}>{product.name}</h1>

            {product.short_description&&(
              <p style={{ fontSize:14, color:"#64748b", lineHeight:1.7, marginBottom:20 }}>{product.short_description}</p>
            )}

            {tags.length>0&&(
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
                {tags.map(t=>(
                  <span key={t} style={{ background:"#EEF4FF", color:"#1d4ed8", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:500 }}>{t}</span>
                ))}
              </div>
            )}

            {/* Key details */}
            <div style={{ background:"#f8fafc", borderRadius:10, padding:16, marginBottom:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  ["MOQ", product.min_order_qty?`${product.min_order_qty} ${product.unit||"kg"}`:"Not specified"],
                  ["Unit", product.unit||"kg"],
                  ["CAS Number", product.cas_number||"—"],
                  ["HSN Code", product.hsn_code||"—"],
                ].map(([k,v])=>(
                  <div key={k}>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:13, color:"#0D1F3C", fontWeight:500 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={()=>onAddToCart(product)}
              style={{ width:"100%", background:inCart?"#22c55e":"#0D1F3C", color:"white", border:"none", borderRadius:8, padding:"13px", fontSize:14, fontWeight:500, cursor:"pointer", marginBottom:10, transition:"background 0.2s" }}>
              {inCart?"✓ Added to Enquiry":"Request Quote"}
            </button>
            {inCart&&(
              <Link to="/enquiry">
                <button style={{ width:"100%", background:"none", border:"1px solid #0D1F3C", color:"#0D1F3C", borderRadius:8, padding:"11px", fontSize:13, fontWeight:500, cursor:"pointer" }}>
                  View Enquiry →
                </button>
              </Link>
            )}
            <p style={{ fontSize:11, color:"#94a3b8", textAlign:"center", marginTop:10 }}>
              Commercial quotation provided within 48 hours
            </p>
          </div>
        </div>

        {/* Description + Specs */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, marginBottom:48 }}>
          {product.description&&(
            <div>
              <h2 style={{ fontSize:18, fontWeight:600, color:"#0D1F3C", marginBottom:14 }}>Description</h2>
              <p style={{ fontSize:13, color:"#64748b", lineHeight:1.8 }}>{product.description}</p>
            </div>
          )}
          {specs.length>0&&(
            <div>
              <h2 style={{ fontSize:18, fontWeight:600, color:"#0D1F3C", marginBottom:14 }}>Specifications</h2>
              <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
                {specs.map(([k,v],i)=>(
                  <div key={k} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:i%2===0?"#f8fafc":"white", borderBottom:i<specs.length-1?"1px solid #e2e8f0":"none" }}>
                    <div style={{ padding:"10px 14px", fontSize:12, fontWeight:600, color:"#475569" }}>{k}</div>
                    <div style={{ padding:"10px 14px", fontSize:12, color:"#0D1F3C" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related products */}
        {related.length>0&&(
          <div>
            <h2 style={{ fontSize:22, fontWeight:600, color:"#0D1F3C", marginBottom:20 }}>Related Products</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
              {related.map(p=>{
                const img=Array.isArray(p.images)&&p.images.length>0?p.images[0]:null;
                return(
                  <Link key={p.id} to={`/products/${p.slug}`} style={{ textDecoration:"none" }}>
                    <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden", transition:"all 0.15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#1877F2";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";}}>
                      {img?<img src={img} alt={p.name} style={{ width:"100%", height:100, objectFit:"cover" }}/>
                        :<div style={{ height:100, background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#94a3b8" }}>{p.product_categories?.name}</div>}
                      <div style={{ padding:"10px 12px" }}>
                        <div style={{ fontSize:11, fontWeight:600, color:"#0D1F3C", lineHeight:1.3 }}>{p.name}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
