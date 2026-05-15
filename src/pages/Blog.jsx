import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { SEO } from "../components/SEO.jsx";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,product_name,theme,keywords,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  const THEME_COLORS = {
    buyers_guide: { bg: "#EEF4FF", color: "#1877F2", label: "Buyer's Guide" },
    science: { bg: "#F0FDF4", color: "#166534", label: "Science" },
    sourcing: { bg: "#FFF7ED", color: "#c2410c", label: "Sourcing Guide" },
    market_trends: { bg: "#FDF4FF", color: "#7c3aed", label: "Market Trends" },
    formulation: { bg: "#F0FDFA", color: "#0f766e", label: "Formulation" },
    supplier: { bg: "#FFF1F2", color: "#be123c", label: "Supplier Guide" },
  };

  return (
    <div style={{ minHeight: "70vh" }}>
      <SEO
        title="Nutraceutical Ingredients Blog — Sourcing Guides, Trends & Science"
        description="Expert articles on nutraceutical ingredient sourcing, B2B wholesale guides, market trends and formulation tips from Ingredientz — The Nutraceutical Superfactory."
        keywords="nutraceutical ingredients blog, supplement ingredient sourcing guide, wholesale nutraceutical trends, B2B ingredient articles"
        url="/blog"
      />

      {/* Header */}
      <div style={{ background: "#0D1F3C", padding: "48px 0" }}>
        <div className="container">
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>Resources</div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 40, fontWeight: 400, color: "white", letterSpacing: -0.5, marginBottom: 10 }}>
            Ingredientz Blog
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, maxWidth: 500 }}>
            Sourcing guides, market trends, science deep-dives and formulation tips for nutraceutical brands worldwide.
          </p>
        </div>
      </div>

      {/* Posts */}
      <div style={{ padding: "56px 0", background: "#f8fafc" }}>
        <div className="container">
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading articles…</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <div>Articles coming soon.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 20 }}>
              {posts.map(post => {
                const theme = THEME_COLORS[post.theme] || THEME_COLORS.buyers_guide;
                return (
                  <Link key={post.id} to={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", height: "100%", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#1877F2"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(24,119,242,0.08)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}>

                      {/* Card header */}
                      <div style={{ background: "#0D1F3C", padding: "20px 20px 16px" }}>
                        <span style={{ background: theme.bg, color: theme.color, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600 }}>
                          {theme.label}
                        </span>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: "16px 20px 20px" }}>
                        <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, fontWeight: 400, color: "#0D1F3C", lineHeight: 1.3, marginBottom: 10 }}>
                          {post.title}
                        </h2>
                        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7, marginBottom: 14 }}>
                          {post.excerpt}
                        </p>
                        {post.keywords?.slice(0, 3).map(k => (
                          <span key={k} style={{ display: "inline-block", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: "#64748b", marginRight: 5, marginBottom: 5 }}>{k}</span>
                        ))}
                        <div style={{ paddingTop: 12, marginTop: 8, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            {post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                          </span>
                          <span style={{ fontSize: 12, color: "#1877F2", fontWeight: 500 }}>Read article →</span>
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
    </div>
  );
}
