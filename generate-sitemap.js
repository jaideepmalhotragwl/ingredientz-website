// generate-sitemap.js
// Run: node generate-sitemap.js
// Fetches all products and categories from Supabase and generates sitemap.xml

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const supabase = createClient(
  "https://eytoryygkxjslfvsqanl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dG9yeXlna3hqc2xmdnNxYW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDA5MTUsImV4cCI6MjA5MDMxNjkxNX0.txYTl0Q06mKSfWGmWc8cOTmCN46tLcxF9_7RhBUHBRY"
);

const SITE_URL = "https://www.ingredientz.co";
const today = new Date().toISOString().split("T")[0];

async function generateSitemap() {
  console.log("Fetching products...");
  const { data: products } = await supabase
    .from("products")
    .select("slug,updated_at")
    .eq("status", "active")
    .order("name");

  console.log("Fetching categories...");
  const { data: cats } = await supabase
    .from("product_categories")
    .select("slug")
    .eq("active", true);

  // Static pages
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "weekly" },
    { url: "/products", priority: "0.9", changefreq: "daily" },
    { url: "/categories", priority: "0.8", changefreq: "weekly" },
    { url: "/about", priority: "0.6", changefreq: "monthly" },
    { url: "/contact", priority: "0.6", changefreq: "monthly" },
  ];

  // Category pages
  const catPages = (cats || []).map(c => ({
    url: `/products?cat=${c.slug}`,
    priority: "0.8",
    changefreq: "weekly"
  }));

  // Product pages
  const productPages = (products || []).map(p => ({
    url: `/products/${p.slug}`,
    priority: "0.7",
    changefreq: "weekly",
    lastmod: p.updated_at ? p.updated_at.split("T")[0] : today
  }));

  const allPages = [...staticPages, ...catPages, ...productPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allPages.map(p => `  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <lastmod>${p.lastmod || today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${p.url}"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${SITE_URL}${p.url}"/>
    <xhtml:link rel="alternate" hreflang="de" href="${SITE_URL}${p.url}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${SITE_URL}${p.url}"/>
  </url>`).join("\n")}
</urlset>`;

  writeFileSync("public/sitemap.xml", xml);
  console.log(`✅ sitemap.xml generated with ${allPages.length} URLs`);
  console.log(`   ${staticPages.length} static pages`);
  console.log(`   ${catPages.length} category pages`);
  console.log(`   ${productPages.length} product pages`);
}

generateSitemap().catch(console.error);
