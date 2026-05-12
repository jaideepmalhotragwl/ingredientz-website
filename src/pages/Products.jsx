import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { ProductCard } from "../components/ProductCard.jsx";
import { SEO, PAGE_SEO } from "../components/SEO.jsx";

export default function Products({ lang, cart, onAddToCart }) {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState(searchParams.get("q") || "");
  const [filterCat, setFilterCat] = useState(searchParams.get("cat") || "");
  const [page, setPage]         = useState(1);
  const PER_PAGE = 12;

  useEffect(() => {
    supabase.from("product_categories").select("*").eq("active",true).order("sort_order").then(({ data }) => setCats(data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from("products").select("*,product_categories(name,slug)").eq("status","active");
    if (filterCat) q = q.eq("product_categories.slug", filterCat);
    q.order("name").then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, [filterCat]);

  const filtered = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.cas_number||"").includes(search) ||
    (p.short_description||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.tags||[]).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const paginated = filtered.slice(0, page * PER_PAGE);
  const cartIds = new Set(cart.map(p => p.id));
  const activeCat = cats.find(c => c.slug === filterCat);

  return (
    <div style={{ minHeight: "70vh" }}>
      <SEO {...PAGE_SEO.products}/>
      <div style={{ background: "#0D1F3C", padding: "36px 0" }}>
        <div className="container">
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "white", fontWeight: 400, letterSpacing: -0.5, marginBottom: 6 }}>
            {activeCat ? activeCat.name : "All Products"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {filtered.length} products {activeCat ? `in ${activeCat.name}` : "across all categories"}
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: "32px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 32 }}>

          {/* Sidebar filters */}
          <div>
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, position: "sticky", top: 80 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#0D1F3C", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Categories</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={() => { setFilterCat(""); setPage(1); }}
                  style={{ textAlign: "left", background: !filterCat ? "#EEF4FF" : "none", color: !filterCat ? "#1877F2" : "#475569", border: "none", borderRadius: 6, padding: "7px 10px", fontSize: 12, cursor: "pointer", fontWeight: !filterCat ? 600 : 400 }}>
                  All Categories
                </button>
                {cats.map(c => (
                  <button key={c.id} onClick={() => { setFilterCat(c.slug); setPage(1); }}
                    style={{ textAlign: "left", background: filterCat === c.slug ? "#EEF4FF" : "none", color: filterCat === c.slug ? "#1877F2" : "#475569", border: "none", borderRadius: 6, padding: "7px 10px", fontSize: 12, cursor: "pointer", fontWeight: filterCat === c.slug ? 600 : 400 }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products grid */}
          <div>
            {/* Search bar */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search products, CAS number, tags…"
                style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 13, outline: "none" }}/>
              {search && (
                <button onClick={() => setSearch("")} style={{ border: "1px solid #e2e8f0", background: "none", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#64748b", cursor: "pointer" }}>Clear</button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading products…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#0D1F3C", marginBottom: 8 }}>No products found</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Try a different search or browse all categories</div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                  {paginated.map(p => (
                    <ProductCard key={p.id} product={p} onAddToEnquiry={onAddToCart} inCart={cartIds.has(p.id)}/>
                  ))}
                </div>
                {paginated.length < filtered.length && (
                  <div style={{ textAlign: "center", marginTop: 32 }}>
                    <button onClick={() => setPage(p => p + 1)}
                      style={{ background: "#0D1F3C", color: "white", border: "none", borderRadius: 8, padding: "10px 32px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      Load more ({filtered.length - paginated.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
