import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { SEO } from "../components/SEO.jsx";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
        if (data?.theme) {
          supabase.from("blog_posts")
            .select("id,title,slug,excerpt,theme,published_at")
            .eq("status", "published")
            .eq("theme", data.theme)
            .neq("slug", slug)
            .limit(3)
            .then(({ data: rel }) => setRelated(rel || []));
        }
      });
  }, [slug]);

  const THEME_LABELS = {
    buyers_guide: "Buyer's Guide", science: "Science & Benefits",
    sourcing: "Wholesale Sourcing", market_trends: "Market Trends",
    formulation: "Formulation Tips", supplier: "Supplier Guide",
  };

  if (loading) return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Loading…</div>;

  if (!post) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 40 }}>📄</div>
      <div style={{ color: "#64748b" }}>Article not found</div>
      <Link to="/blog" style={{ color: "#1877F2", fontSize: 13 }}>← Back to Blog</Link>
    </div>
  );

  return (
    <div style={{ minHeight: "70vh" }}>
      <SEO
        title={post.title}
        description={post.meta_description}
        keywords={post.keywords?.join(", ")}
        url={`/blog/${post.slug}`}
        type="article"
      />

      {/* Header */}
      <div style={{ background: "#0D1F3C", padding: "48px 0" }}>
        <div className="container">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Link to="/" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Home</Link>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>→</span>
            <Link to="/blog" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Blog</Link>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>→</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{THEME_LABELS[post.theme] || "Article"}</span>
          </div>
          <div style={{ display: "inline-block", background: "rgba(24,119,242,0.2)", border: "1px solid rgba(24,119,242,0.3)", color: "#60a5fa", fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", padding: "3px 12px", borderRadius: 20, marginBottom: 14 }}>
            {THEME_LABELS[post.theme] || "Article"}
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(26px,4vw,40px)", fontWeight: 400, color: "white", lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 14, maxWidth: 700 }}>
            {post.title}
          </h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              By Ingredientz Editorial
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              {post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}
            </span>
            {post.product_name && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                {post.product_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "56px 0", background: "white" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 48, alignItems: "start" }}>

            {/* Article body */}
            <article>
              {post.excerpt && (
                <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.9, marginBottom: 32, fontWeight: 300, borderLeft: "3px solid #1877F2", paddingLeft: 20 }}>
                  {post.excerpt}
                </p>
              )}
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.9, fontWeight: 300 }}
                dangerouslySetInnerHTML={{ __html: post.content }}/>

              {/* Keywords */}
              {post.keywords?.length > 0 && (
                <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Topics</div>
                  {post.keywords.map(k => (
                    <span key={k} style={{ display: "inline-block", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 4, padding: "3px 10px", fontSize: 11, color: "#64748b", marginRight: 6, marginBottom: 6 }}>{k}</span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div style={{ background: "#0D1F3C", borderRadius: 14, padding: "28px 32px", marginTop: 40, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: "white", marginBottom: 6 }}>Source {post.product_name || "this ingredient"} from Ingredientz</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>Global manufacturer network · 48h quotations · CoA & TDS included</div>
                </div>
                <Link to="/enquiry">
                  <button style={{ background: "#1877F2", border: "none", color: "white", borderRadius: 8, padding: "11px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                    Request Quote →
                  </button>
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside style={{ position: "sticky", top: 80 }}>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#1877F2", marginBottom: 14 }}>Quick Links</div>
                {[
                  ["Browse all products →", "/products"],
                  ["Submit an enquiry →", "/enquiry"],
                  ["Contact our team →", "/contact"],
                ].map(([label, to]) => (
                  <Link key={label} to={to} style={{ display: "block", fontSize: 13, color: "#1877F2", marginBottom: 10, fontWeight: 500 }}>{label}</Link>
                ))}
              </div>

              {related.length > 0 && (
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#94a3b8", marginBottom: 14 }}>Related Articles</div>
                  {related.map(r => (
                    <Link key={r.id} to={`/blog/${r.slug}`} style={{ display: "block", marginBottom: 14, textDecoration: "none" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#0D1F3C", marginBottom: 3, lineHeight: 1.4 }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {r.published_at ? new Date(r.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Back to blog */}
      <div style={{ background: "#f8fafc", padding: "24px 0", borderTop: "1px solid #e2e8f0" }}>
        <div className="container">
          <Link to="/blog" style={{ fontSize: 13, color: "#1877F2", fontWeight: 500 }}>← Back to all articles</Link>
        </div>
      </div>

      <style>{`
        article h2 { font-family: 'DM Serif Display',serif; font-size: 24px; font-weight: 400; color: #0D1F3C; margin: 32px 0 12px; letter-spacing: -0.3px; }
        article h3 { font-size: 16px; font-weight: 600; color: #0D1F3C; margin: 24px 0 10px; }
        article p { margin-bottom: 16px; }
        article ul, article ol { padding-left: 20px; margin-bottom: 16px; }
        article li { margin-bottom: 6px; }
        article strong { font-weight: 600; color: #1c1e21; }
      `}</style>
    </div>
  );
}
