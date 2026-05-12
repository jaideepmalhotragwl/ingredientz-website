import { useEffect } from "react";

const SITE_NAME = "Ingredientz — The Nutraceutical Superfactory";
const SITE_URL = "https://www.ingredientz.co";
const DEFAULT_DESC = "Source premium nutraceutical ingredients from verified manufacturers across USA, Europe, India and China. Wholesale botanical extracts, vitamins, probiotics, enzymes and more. 48h quotations.";
const DEFAULT_KEYWORDS = "nutraceutical ingredients supplier, wholesale botanical extracts, bulk vitamins minerals, probiotics supplier, enzyme manufacturer, nutraceutical ingredients USA, nutraceutical ingredients Europe, B2B ingredients platform, ashwagandha extract bulk, colostrum supplier";

// ── SET META TAG ──────────────────────────────────────────────────────────────
function setMeta(name, content, isProperty = false) {
  if (!content) return;
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data) {
  let el = document.querySelector('script[type="application/ld+json"]');
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// ── MAIN SEO COMPONENT ────────────────────────────────────────────────────────
export function SEO({ title, description, keywords, image, url, type = "website", product, category }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Ingredientz` : SITE_NAME;
    const desc = description || DEFAULT_DESC;
    const kw = keywords || DEFAULT_KEYWORDS;
    const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL;
    const img = image || `${SITE_URL}/logo.png`;

    // Basic meta
    document.title = fullTitle;
    setMeta("description", desc);
    setMeta("keywords", kw);
    setMeta("author", "Ingredientz Inc");
    setMeta("robots", "index, follow");
    setMeta("language", "English");

    // Geo targeting
    setMeta("geo.region", "US, GB, DE, FR, ES, CA");
    setMeta("geo.placename", "Global");

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", desc, true);
    setMeta("og:image", img, true);
    setMeta("og:url", pageUrl, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", "Ingredientz", true);
    setMeta("og:locale", "en_US", true);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", img);

    // Canonical
    setLink("canonical", pageUrl);

    // Structured data
    if (product) {
      // Product schema
      setJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.short_description || desc,
        "image": Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : img,
        "brand": { "@type": "Brand", "name": "Ingredientz" },
        "category": product.product_categories?.name || "Nutraceutical Ingredients",
        "offers": {
          "@type": "Offer",
          "availability": "https://schema.org/InStock",
          "priceCurrency": "USD",
          "seller": {
            "@type": "Organization",
            "name": "Ingredientz Inc",
            "url": SITE_URL
          }
        },
        ...(product.cas_number && { "identifier": product.cas_number }),
        ...(product.tags && { "keywords": product.tags.join(", ") }),
      });
    } else if (category) {
      // Category schema
      setJsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${category.name} — Ingredientz`,
        "description": `Browse wholesale ${category.name.toLowerCase()} from verified global manufacturers. B2B pricing, 48h quotations.`,
        "url": pageUrl,
        "provider": {
          "@type": "Organization",
          "name": "Ingredientz Inc",
          "url": SITE_URL
        }
      });
    } else {
      // Organisation schema for homepage/other pages
      setJsonLd({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Ingredientz Inc",
        "alternateName": "The Nutraceutical Superfactory",
        "url": SITE_URL,
        "logo": `${SITE_URL}/logo.png`,
        "description": DEFAULT_DESC,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "8 The Green, Suite A",
          "addressLocality": "Dover",
          "addressRegion": "DE",
          "postalCode": "19901",
          "addressCountry": "US"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1-270-721-5321",
          "contactType": "sales",
          "email": "sales@ingredientz.co",
          "availableLanguage": ["English", "French", "German", "Spanish"]
        },
        "sameAs": [],
        "areaServed": ["US", "CA", "GB", "DE", "FR", "ES", "IN", "HK"]
      });
    }
  }, [title, description, url, product, category]);

  return null;
}

// ── PAGE-SPECIFIC SEO CONFIGS ─────────────────────────────────────────────────
export const PAGE_SEO = {
  home: {
    title: "Premium Nutraceutical Ingredients Sourced from the World's Best Factories",
    description: "Ingredientz — The Nutraceutical Superfactory. Source wholesale botanical extracts, vitamins, probiotics, enzymes and more from verified manufacturers in USA, Europe, India and China. 48h quotations for B2B buyers.",
    keywords: "nutraceutical ingredients supplier, wholesale botanical extracts, bulk vitamins minerals, probiotics supplier wholesale, nutraceutical ingredients USA, nutraceutical ingredients Europe, B2B nutraceutical platform, ashwagandha extract bulk buy, colostrum supplier wholesale, herbal extract manufacturer",
    url: "/"
  },
  products: {
    title: "Browse 500+ Premium Nutraceutical Ingredients — Wholesale B2B",
    description: "Shop 500+ nutraceutical ingredients including botanical extracts, vitamins, minerals, probiotics, enzymes and more. Verified global manufacturers. Request a wholesale quote in 48 hours.",
    keywords: "buy nutraceutical ingredients bulk, wholesale supplement ingredients, botanical extracts supplier, vitamins minerals wholesale, probiotics bulk supplier, enzyme supplier wholesale, nutraceutical raw materials",
    url: "/products"
  },
  categories: {
    title: "Nutraceutical Ingredient Categories — Botanical, Vitamins, Probiotics & More",
    description: "Browse nutraceutical ingredients by category — botanical extracts, mushroom extracts, vitamins & minerals, probiotics, proteins, enzymes, greens and more. B2B wholesale pricing.",
    keywords: "nutraceutical categories, botanical extracts wholesale, mushroom extracts supplier, vitamins minerals bulk, probiotics prebiotics supplier, protein amino acids wholesale",
    url: "/categories"
  },
  about: {
    title: "About Ingredientz — The Nutraceutical Superfactory",
    description: "Ingredientz is a tech-enabled B2B nutraceutical ingredients platform connecting global buyers with verified manufacturers across India, China, Europe and North America.",
    keywords: "Ingredientz nutraceutical supplier, nutraceutical ingredients company, B2B nutraceutical platform, nutraceutical superfactory",
    url: "/about"
  },
  contact: {
    title: "Contact Ingredientz — Global Nutraceutical Ingredients Supplier",
    description: "Contact our global sales team for nutraceutical ingredient enquiries. Offices in USA, Germany, India and Hong Kong. Email sales@ingredientz.co or call +1 270 721 5321.",
    keywords: "nutraceutical supplier contact, ingredients supplier USA, nutraceutical company Germany, herbal extract supplier India",
    url: "/contact"
  }
};

// ── PRODUCT SEO GENERATOR ─────────────────────────────────────────────────────
export function generateProductSEO(product) {
  const catName = product.product_categories?.name || "Nutraceutical";
  const tags = Array.isArray(product.tags) ? product.tags.join(", ") : "";

  return {
    title: `${product.name} — Wholesale B2B Supplier | Ingredientz`,
    description: product.short_description
      ? `${product.short_description} Available in bulk wholesale quantities. ${product.min_order_qty ? `MOQ: ${product.min_order_qty} ${product.unit || "kg"}.` : ""} Request a quote within 48 hours from Ingredientz.`
      : `Buy ${product.name} wholesale from verified manufacturers. ${catName} category. B2B pricing, CoA & TDS available. 48h quotation from Ingredientz — The Nutraceutical Superfactory.`,
    keywords: `${product.name}, ${product.name} wholesale, ${product.name} bulk supplier, ${product.name} manufacturer, ${catName.toLowerCase()} supplier, ${tags}, nutraceutical ingredients wholesale`,
    url: `/products/${product.slug}`
  };
}

// ── CATEGORY SEO GENERATOR ────────────────────────────────────────────────────
export function generateCategorySEO(catName, productCount) {
  return {
    title: `${catName} — Wholesale Supplier | ${productCount}+ Products | Ingredientz`,
    description: `Source wholesale ${catName.toLowerCase()} from verified global manufacturers. ${productCount}+ products available. B2B pricing, CoA & TDS provided. Request quotes within 48 hours.`,
    keywords: `${catName.toLowerCase()} wholesale, ${catName.toLowerCase()} supplier, ${catName.toLowerCase()} bulk, ${catName.toLowerCase()} manufacturer, buy ${catName.toLowerCase()} B2B`,
    url: `/products?cat=${catName.toLowerCase().replace(/\s+/g, "-")}`
  };
}
