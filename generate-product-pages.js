// generate-product-pages.js
// Run: node generate-product-pages.js   (also runs automatically inside `npm run build`)
//
// Reads every ACTIVE product from Supabase and writes a real, fully-formed
// static HTML file to  public/products/<slug>/index.html  — each with its OWN
// canonical, meta, Open Graph, and Product JSON-LD. Vite copies public/ into the
// build, so Amplify serves these as real files (just like /ingredients/ hero pages),
// and Google can index them.
//
// This does NOT touch your 5 hero pages, your React app, or the database.

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";

const supabase = createClient(
  "https://eytoryygkxjslfvsqanl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dG9yeXlna3hqc2xmdnNxYW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDA5MTUsImV4cCI6MjA5MDMxNjkxNX0.txYTl0Q06mKSfWGmWc8cOTmCN46tLcxF9_7RhBUHBRY"
);

const SITE_URL = "https://www.ingredientz.co";
const OUT_DIR = "public/products";

// ── small helpers ─────────────────────────────────────────────────────────────
// Escape text destined for HTML body / attributes.
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Safe slug for a folder name (slugs are already URL-safe; this just guards edge cases).
function safeSlug(slug) {
  return String(slug || "").trim().replace(/[^a-zA-Z0-9._-]/g, "");
}

// JSON-LD must not contain a literal </script>; escaping "<" prevents that.
function jsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

// ── the page template ─────────────────────────────────────────────────────────
function renderPage(p) {
  const slug      = p.slug;
  const name      = p.name || "Nutraceutical Ingredient";
  const cat       = p.product_categories?.name || "Nutraceutical Ingredients";
  const catSlug   = p.product_categories?.slug || "";
  const pageUrl   = `${SITE_URL}/products/${slug}`;
  const firstImg  = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
  const ogImage   = firstImg || `${SITE_URL}/logo.png`;
  const unit      = p.unit || "kg";
  const moq       = p.min_order_qty ? `${p.min_order_qty} ${unit}` : null;
  const shortDesc = (p.short_description || "").trim();
  const fullDesc  = (p.description || "").trim();
  const specs     = p.specifications && typeof p.specifications === "object"
                      ? Object.entries(p.specifications).filter(([k]) => k)
                      : [];
  const tags      = Array.isArray(p.tags) ? p.tags.filter(Boolean) : [];

  // Mirror generateProductSEO() from src/components/SEO.jsx
  const title = `${name} — Wholesale B2B Supplier | Ingredientz`;
  const metaDesc = shortDesc
    ? `${shortDesc} Available in bulk wholesale quantities.${moq ? ` MOQ: ${moq}.` : ""} Request a quote within 48 hours from Ingredientz.`
    : `Buy ${name} wholesale from verified manufacturers. ${cat} category. B2B pricing, CoA & TDS available. 48h quotation from Ingredientz — The Nutraceutical Superfactory.`;
  const keywords = `${name}, ${name} wholesale, ${name} bulk supplier, ${name} manufacturer, ${cat.toLowerCase()} supplier${tags.length ? ", " + tags.join(", ") : ""}, nutraceutical ingredients wholesale`;

  // Product JSON-LD (mirrors the Product schema in SEO.jsx)
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": shortDesc || metaDesc,
    "image": ogImage,
    "brand": { "@type": "Brand", "name": "Ingredientz" },
    "category": cat,
    "url": pageUrl,
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "USD",
      "seller": { "@type": "Organization", "name": "Ingredientz Inc", "url": SITE_URL }
    },
    ...(p.cas_number ? { "identifier": p.cas_number } : {}),
    ...(tags.length ? { "keywords": tags.join(", ") } : {})
  };

  // Breadcrumb JSON-LD (helps Google render the trail)
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": `${SITE_URL}/products` },
      ...(catSlug ? [{ "@type": "ListItem", "position": 3, "name": cat, "item": `${SITE_URL}/products?cat=${catSlug}` }] : []),
      { "@type": "ListItem", "position": catSlug ? 4 : 3, "name": name, "item": pageUrl }
    ]
  };

  // ── body sections ──
  const keyDetails = [
    ["MOQ", moq || "Request quote"],
    ["Unit", unit],
    ["CAS Number", p.cas_number || "—"],
    ["HSN Code", p.hsn_code || "—"]
  ].map(([k, v]) => `
        <div class="kd">
          <div class="kd-label">${esc(k)}</div>
          <div class="kd-value">${esc(v)}</div>
        </div>`).join("");

  const tagHtml = tags.length ? `
      <div class="tags">
        ${tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}
      </div>` : "";

  const descHtml = fullDesc ? `
      <section class="block">
        <h2>About ${esc(name)}</h2>
        <p>${esc(fullDesc)}</p>
      </section>` : "";

  const specsHtml = specs.length ? `
      <section class="block">
        <h2>Specifications</h2>
        <table class="specs">
          <tbody>
            ${specs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}
          </tbody>
        </table>
      </section>` : "";

  const imageHtml = firstImg
    ? `<img class="hero-img" src="${esc(firstImg)}" alt="${esc(name)}" width="520" height="520" loading="eager"/>`
    : `<div class="hero-img placeholder"><span>🧪</span><small>${esc(cat)}</small></div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(metaDesc)}"/>
<meta name="keywords" content="${esc(keywords)}"/>
<meta name="author" content="Ingredientz Inc"/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="${esc(pageUrl)}"/>
<meta property="og:type" content="product"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(metaDesc)}"/>
<meta property="og:image" content="${esc(ogImage)}"/>
<meta property="og:url" content="${esc(pageUrl)}"/>
<meta property="og:site_name" content="Ingredientz"/>
<meta property="og:locale" content="en_US"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(metaDesc)}"/>
<meta name="twitter:image" content="${esc(ogImage)}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
<script type="application/ld+json">${jsonLd(ld)}</script>
<script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>
<style>
  :root{--navy:#0D1F3C;--teal:#6FE5C8;--ink:#0D1F3C;--muted:#64748b;--line:#e2e8f0;--bg:#f8fafc;--blue:#1877F2;}
  *{box-sizing:border-box;}
  body{margin:0;font-family:'DM Sans',system-ui,Arial,sans-serif;color:var(--ink);background:#fff;line-height:1.6;}
  a{color:var(--blue);text-decoration:none;}
  .container{max-width:1080px;margin:0 auto;padding:0 24px;}
  .topbar{background:var(--navy);}
  .topbar .container{display:flex;align-items:center;justify-content:space-between;height:60px;}
  .logo{font-family:'DM Serif Display',serif;color:#fff;font-size:22px;}
  .topbar nav a{color:rgba(255,255,255,.75);font-size:13px;margin-left:20px;}
  .crumb{background:var(--bg);border-bottom:1px solid var(--line);font-size:12px;color:var(--muted);}
  .crumb .container{padding-top:12px;padding-bottom:12px;}
  .crumb a{color:var(--muted);} .crumb span{margin:0 8px;color:#cbd5e1;}
  .hero{display:grid;grid-template-columns:1fr 1fr;gap:48px;padding:40px 0;}
  .hero-img{width:100%;height:auto;border-radius:14px;background:var(--bg);object-fit:cover;aspect-ratio:1;}
  .hero-img.placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94a3b8;}
  .hero-img.placeholder span{font-size:52px;} .hero-img.placeholder small{font-size:12px;margin-top:8px;}
  .eyebrow{font-size:10px;font-weight:600;color:var(--blue);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;}
  h1{font-family:'DM Serif Display',serif;font-size:34px;font-weight:400;letter-spacing:-.5px;line-height:1.2;margin:0 0 12px;}
  .lead{font-size:15px;color:var(--muted);margin:0 0 18px;}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;}
  .tag{background:#EEF4FF;color:#1d4ed8;border-radius:20px;padding:3px 11px;font-size:11px;font-weight:500;}
  .kd-grid{background:var(--bg);border-radius:10px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;}
  .kd-label{font-size:9px;color:#94a3b8;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;}
  .kd-value{font-size:14px;font-weight:500;}
  .cta{display:inline-block;background:var(--navy);color:#fff;border-radius:8px;padding:13px 28px;font-size:14px;font-weight:600;}
  .cta:hover{opacity:.92;}
  .note{font-size:11px;color:#94a3b8;margin-top:10px;}
  .block{padding:28px 0;border-top:1px solid var(--line);}
  .block h2{font-size:19px;font-weight:600;margin:0 0 12px;}
  .block p{font-size:14px;color:#475569;margin:0;}
  table.specs{width:100%;border-collapse:collapse;border:1px solid var(--line);border-radius:10px;overflow:hidden;}
  table.specs th{text-align:left;width:42%;background:var(--bg);padding:10px 14px;font-size:13px;color:#475569;font-weight:600;border-bottom:1px solid var(--line);}
  table.specs td{padding:10px 14px;font-size:13px;border-bottom:1px solid var(--line);}
  table.specs tr:last-child th,table.specs tr:last-child td{border-bottom:none;}
  footer{background:var(--navy);color:rgba(255,255,255,.6);font-size:12px;margin-top:40px;}
  footer .container{padding:28px 24px;}
  footer a{color:rgba(255,255,255,.8);}
  @media(max-width:760px){.hero{grid-template-columns:1fr;gap:24px;padding:24px 0;}h1{font-size:27px;}}
</style>
</head>
<body>
  <header class="topbar">
    <div class="container">
      <a class="logo" href="/">Ingredientz</a>
      <nav>
        <a href="/products">All Products</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </div>
  </header>

  <div class="crumb">
    <div class="container">
      <a href="/">Home</a><span>›</span><a href="/products">Products</a>${catSlug ? `<span>›</span><a href="/products?cat=${esc(catSlug)}">${esc(cat)}</a>` : ""}<span>›</span>${esc(name)}
    </div>
  </div>

  <main class="container">
    <div class="hero">
      <div>${imageHtml}</div>
      <div>
        <div class="eyebrow">${esc(cat)}</div>
        <h1>${esc(name)}</h1>
        ${shortDesc ? `<p class="lead">${esc(shortDesc)}</p>` : ""}
        ${tagHtml}
        <div class="kd-grid">${keyDetails}</div>
        <a class="cta" href="/enquiry">Request a Quote</a>
        <p class="note">Commercial quotation provided within 48 hours.</p>
      </div>
    </div>
    ${descHtml}
    ${specsHtml}
  </main>

  <footer>
    <div class="container">
      Ingredientz Inc · 8 The Green, Suite A, Dover, DE 19901 · <a href="mailto:sales@ingredientz.co">sales@ingredientz.co</a><br/>
      Premium nutraceutical ingredients sourced from verified manufacturers worldwide.
    </div>
  </footer>
</body>
</html>`;
}

// ── main ────────────────────────────────────────────────────────────────────
async function generate() {
  console.log("Fetching active products…");
  const { data: products, error } = await supabase
    .from("products")
    .select("*,product_categories(name,slug)")
    .eq("status", "active")
    .order("name");

  if (error) { console.error("Supabase error:", error.message); process.exit(1); }
  if (!products || products.length === 0) { console.error("No active products found."); process.exit(1); }

  mkdirSync(OUT_DIR, { recursive: true });

  let written = 0, skipped = 0;
  const seen = new Set();

  for (const p of products) {
    const slug = safeSlug(p.slug);
    if (!slug) { skipped++; console.warn(`  ⚠ skipped (no slug): ${p.name}`); continue; }
    if (seen.has(slug)) { skipped++; console.warn(`  ⚠ skipped (duplicate slug): ${slug}`); continue; }
    seen.add(slug);

    writeFileSync(`${OUT_DIR}/${slug}.html`, renderPage(p));
    written++;
  }

  console.log(`✅ Generated ${written} product pages in ${OUT_DIR}/`);
  if (skipped) console.log(`   ${skipped} skipped (missing or duplicate slug)`);
}

generate().catch(e => { console.error(e); process.exit(1); });
