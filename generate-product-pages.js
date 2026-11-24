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
//
// SEO content files (optional, one per product):  seo-content/<slug>.json
// When a product has one, its page gets the richer layout: custom title and
// description, sections, a spec table, FAQs and FAQ markup. Products without a
// file keep the standard layout. See seo-content/README.md for the format.

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from "fs";

const supabase = createClient(
  "https://eytoryygkxjslfvsqanl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dG9yeXlna3hqc2xmdnNxYW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDA5MTUsImV4cCI6MjA5MDMxNjkxNX0.txYTl0Q06mKSfWGmWc8cOTmCN46tLcxF9_7RhBUHBRY"
);

const SITE_URL = "https://www.ingredientz.co";
const OUT_DIR = "public/products";
const SEO_DIR = "seo-content";
const RELATED_COUNT = 6;

// ── SEO content files ─────────────────────────────────────────────────────────
// Returns { "<slug>": { ...content } }. A file that cannot be read is skipped
// with a warning, so one bad file never breaks the build.
export function loadSeoContent(dir = SEO_DIR) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const data = JSON.parse(readFileSync(`${dir}/${file}`, "utf8"));
      const slug = data.slug || file.replace(/\.json$/, "");
      out[slug] = data;
    } catch (e) {
      console.warn(`  ⚠ skipped SEO content file ${file}: ${e.message}`);
    }
  }
  return out;
}

// Up to RELATED_COUNT other products from the same category, taken in name
// order starting just after this product, so every page links to different ones.
export function pickRelated(product, all) {
  const same = all.filter(x => x.category_id === product.category_id && x.slug);
  const i = same.findIndex(x => x.slug === product.slug);
  if (i < 0 || same.length < 2) return [];
  const picked = [];
  for (let k = 1; k < same.length && picked.length < RELATED_COUNT; k++) {
    picked.push(same[(i + k) % same.length]);
  }
  return picked;
}

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
export function renderPage(p, { seo = null, related = [] } = {}) {
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
  const dbTags    = Array.isArray(p.tags) ? p.tags.filter(Boolean) : [];
  const tags      = seo && Array.isArray(seo.tags) && seo.tags.length ? seo.tags.filter(Boolean) : dbTags;
  const h1        = (seo && seo.h1) || name;
  const lead      = (seo && seo.lead) || shortDesc;
  const faqs      = seo && Array.isArray(seo.faqs) ? seo.faqs.filter(f => f && f.q && f.a) : [];

  // Mirror generateProductSEO() from src/components/SEO.jsx
  // (a seo-content file may replace the title and description)
  const defaultTitle = `${name} — Wholesale B2B Supplier | Ingredientz`;
  const defaultMeta = shortDesc
    ? `${shortDesc} Available in bulk wholesale quantities.${moq ? ` MOQ: ${moq}.` : ""} Request a quote within 48 hours from Ingredientz.`
    : `Buy ${name} wholesale from verified manufacturers. ${cat} category. B2B pricing, CoA & TDS available. 48h quotation from Ingredientz — The Nutraceutical Superfactory.`;
  const title    = (seo && seo.seo_title) || defaultTitle;
  const metaDesc = (seo && seo.meta_description) || defaultMeta;
  const keywords = `${name}, ${name} wholesale, ${name} bulk supplier, ${name} manufacturer, ${cat.toLowerCase()} supplier${tags.length ? ", " + tags.join(", ") : ""}, nutraceutical ingredients wholesale`;

  // Product JSON-LD (mirrors the Product schema in SEO.jsx)
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": lead || metaDesc,
    "image": ogImage,
    "brand": { "@type": "Brand", "name": "Ingredientz" },
    "category": cat,
    "url": pageUrl,
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "USD",
      // Google needs a price here. It is only added when the SEO content file
      // gives a real published "from" price; it is never invented.
      ...(seo && Number(seo.price_from_usd) > 0 ? { "price": String(seo.price_from_usd), "url": pageUrl } : {}),
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

  // FAQ JSON-LD (only when the page shows FAQs)
  const faqLd = faqs.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  } : null;

  // ── body sections ──
  // Key details: a seo-content file may supply its own four boxes. Otherwise
  // MOQ and Unit always show, and CAS / HSN show only when they have a value.
  const seoDetails = seo && Array.isArray(seo.key_details)
    ? seo.key_details.filter(d => Array.isArray(d) && d[0] && d[1])
    : [];
  const keyDetails = (seoDetails.length ? seoDetails : [
    ["MOQ", moq || "Request quote"],
    ["Unit", unit],
    ...(p.cas_number ? [["CAS Number", p.cas_number]] : []),
    ...(p.hsn_code ? [["HSN Code", p.hsn_code]] : [])
  ]).map(([k, v]) => `
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

  // Rich sections from the seo-content file. Each section may carry a heading,
  // paragraphs, bullets ([label, text] pairs or plain strings) and a table.
  const renderTable = t => {
    const cols = Array.isArray(t.columns) ? t.columns : [];
    const rows = Array.isArray(t.rows) ? t.rows.filter(r => Array.isArray(r) && r.length) : [];
    if (!rows.length) return "";
    return `
        <div class="tablewrap">
        <table class="specs${cols.length ? " multi" : ""}">
          ${cols.length ? `<thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>` : ""}
          <tbody>
            ${rows.map(r => `<tr><th>${esc(r[0])}</th>${r.slice(1).map((c, i) =>
              `<td${r.length === 2 && cols.length > 2 && i === 0 ? ` colspan="${cols.length - 1}"` : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        </div>`;
  };
  const renderBullets = list => `
        <ul>
          ${list.map(b => Array.isArray(b)
            ? `<li><strong>${esc(b[0])}</strong> ${esc(b[1] ?? "")}</li>`
            : `<li>${esc(b)}</li>`).join("")}
        </ul>`;
  const seoSections = seo && Array.isArray(seo.sections) ? seo.sections : [];
  const richHtml = seo ? [
    ...(Array.isArray(seo.intro) && seo.intro.length ? [`
      <section class="block">
        ${seo.intro.map(t => `<p>${esc(t)}</p>`).join("")}
      </section>`] : []),
    ...seoSections.map(s => `
      <section class="block">
        ${s.heading ? `<h2>${esc(s.heading)}</h2>` : ""}
        ${(Array.isArray(s.paragraphs) ? s.paragraphs : []).map(t => `<p>${esc(t)}</p>`).join("")}
        ${Array.isArray(s.bullets) && s.bullets.length ? renderBullets(s.bullets) : ""}
        ${s.table ? renderTable(s.table) : ""}
      </section>`),
    ...(faqs.length ? [`
      <section class="block faq">
        <h2>Frequently asked questions</h2>
        ${faqs.map(f => `<h3>${esc(f.q)}</h3>
        <p>${esc(f.a)}</p>`).join("\n        ")}
      </section>`] : []),
    `
      <section class="block">
        <div class="cta-band">
          <p>${esc(seo.cta || `Request a quote, a sample or the spec sheet for ${name}`)}</p>
          <a class="cta" href="/enquiry">Request a Quote</a>
        </div>
      </section>`
  ].join("") : "";

  // Related products: real links between product pages, so Google can crawl
  // from one product to the next. Shown on every product page.
  const extraLinks = seo && Array.isArray(seo.related_links)
    ? seo.related_links.filter(l => l && l.href && l.label)
    : [];
  const relatedHtml = (related.length || extraLinks.length) ? `
      <section class="block">
        <h2>Related products</h2>
        <div class="related">
          ${extraLinks.map(l => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join("")}
          ${related.map(r => `<a href="/products/${esc(safeSlug(r.slug))}">${esc(r.name)}</a>`).join("")}
        </div>
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
<script type="application/ld+json">${jsonLd(breadcrumbLd)}</script>${faqLd ? `
<script type="application/ld+json">${jsonLd(faqLd)}</script>` : ""}
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
  .block p + p{margin-top:10px;}
  .block ul{margin:0;padding-left:18px;font-size:14px;color:#475569;}
  .block li{margin-bottom:8px;} .block li strong{color:var(--ink);}
  .tablewrap{overflow-x:auto;}
  table.specs.multi{min-width:520px;border-radius:0;}
  table.specs.multi th{width:auto;}
  table.specs thead th{background:var(--navy);color:#fff;}
  table.specs td{vertical-align:top;}
  .faq h3{font-size:14.5px;font-weight:600;margin:16px 0 4px;}
  .faq h2 + h3{margin-top:0;}
  .cta-band{background:var(--bg);border-radius:14px;padding:26px;text-align:center;}
  .cta-band p{font-size:15px;color:var(--ink);margin:0 0 14px;font-weight:500;}
  .related{display:flex;flex-wrap:wrap;gap:8px;}
  .related a{border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-size:13px;color:var(--ink);}
  .related a:hover{border-color:var(--blue);color:var(--blue);}
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
        <h1>${esc(h1)}</h1>
        ${lead ? `<p class="lead">${esc(lead)}</p>` : ""}
        ${tagHtml}
        <div class="kd-grid">${keyDetails}</div>
        <a class="cta" href="/enquiry">Request a Quote</a>
        <p class="note">Commercial quotation provided within 48 hours.</p>
      </div>
    </div>
    ${seo ? richHtml : `${descHtml}
    ${specsHtml}`}
    ${relatedHtml}
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

  const seoContent = loadSeoContent();
  const seoSlugs = Object.keys(seoContent);
  const known = new Set(products.map(p => safeSlug(p.slug)));
  for (const s of seoSlugs) {
    if (!known.has(s)) console.warn(`  ⚠ SEO content file for "${s}" matches no active product`);
  }

  let written = 0, skipped = 0, rich = 0;
  const seen = new Set();

  for (const p of products) {
    const slug = safeSlug(p.slug);
    if (!slug) { skipped++; console.warn(`  ⚠ skipped (no slug): ${p.name}`); continue; }
    if (seen.has(slug)) { skipped++; console.warn(`  ⚠ skipped (duplicate slug): ${slug}`); continue; }
    seen.add(slug);

    const seo = seoContent[slug] || null;
    if (seo) rich++;
    writeFileSync(`${OUT_DIR}/${slug}.html`, renderPage(p, { seo, related: pickRelated(p, products) }));
    written++;
  }

  console.log(`✅ Generated ${written} product pages in ${OUT_DIR}/`);
  console.log(`   ${rich} with SEO content from ${SEO_DIR}/`);
  if (skipped) console.log(`   ${skipped} skipped (missing or duplicate slug)`);
}

// SEO_TEST=1 lets a test import renderPage() without contacting the database.
if (!process.env.SEO_TEST) {
  generate().catch(e => { console.error(e); process.exit(1); });
}
