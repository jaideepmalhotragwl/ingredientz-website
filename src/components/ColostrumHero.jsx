import { useState } from "react";
import { Helmet } from "react-helmet-async";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — matching the Ingredientz design system
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  blue: "#1877F2",
  blueDark: "#166FE5",
  blueLight: "#E7F0FE",
  ink: "#1C1E21",
  body: "#3A3B3C",
  muted: "#65676B",
  border: "#DADDE1",
  card: "#FFFFFF",
  bg: "#F0F2F5",
  green: "#42B72A",
  amber: "#F5A623",
};

const FONT = {
  display: '"Inter Tight", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const R = { sm: 6, md: 10, lg: 16, pill: 100 };

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD structured data for SEO
// ─────────────────────────────────────────────────────────────────────────────
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Bovine Colostrum Powder",
  "description": "Wholesale bovine colostrum powder in 10%, 20%, 30%, 40% IgG concentrations. Grass-fed, hormone-free, dual-origin sourcing from US and India. MOQ from 25kg.",
  "image": "https://www.ingredientz.co/logo.png",
  "brand": {
    "@type": "Brand",
    "name": "Ingredientz"
  },
  "manufacturer": {
    "@type": "Organization",
    "name": "Ingredientz Inc",
    "url": "https://www.ingredientz.co"
  },
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/InStock",
    "priceCurrency": "USD",
    "priceSpecification": {
      "@type": "PriceSpecification",
      "description": "Price on application. Minimum order 25kg.",
    },
    "seller": {
      "@type": "Organization",
      "name": "Ingredientz Inc"
    }
  },
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "IgG Concentrations", "value": "10%, 20%, 30%, 40%" },
    { "@type": "PropertyValue", "name": "Origin", "value": "United States, India" },
    { "@type": "PropertyValue", "name": "Form", "value": "Spray-dried powder" },
    { "@type": "PropertyValue", "name": "MOQ", "value": "25 kg" },
    { "@type": "PropertyValue", "name": "Lead Time", "value": "3-5 weeks" },
    { "@type": "PropertyValue", "name": "Shelf Life", "value": "24 months" }
  ]
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What's the difference between first-milking colostrum and whole colostrum?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "First-milking colostrum is collected only from the cow's first milking after calving, where bioactive concentration is highest. Whole colostrum aggregates milkings from the first 48 hours and offers a more cost-efficient profile. First-milking sourcing typically commands a 30-60% price premium. We supply both."
      }
    },
    {
      "@type": "Question",
      "name": "Is your colostrum grass-fed, hormone-free, and antibiotic-free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our US-origin colostrum is sourced from herds that meet grass-fed and hormone-free standards. Antibiotic-free designation is verifiable through batch documentation. Indian-origin colostrum meets antibiotic-free and hormone-free standards but is typically not grass-fed certified."
      }
    },
    {
      "@type": "Question",
      "name": "What's your minimum order quantity?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MOQ is 25 kg for in-stock specifications. Smaller sample quantities (250g - 1kg) are available for evaluation. For custom IgG percentages or special certifications, MOQ may be higher."
      }
    },
    {
      "@type": "Question",
      "name": "How is IgG measured and standardised?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We use HPLC (high-performance liquid chromatography) for IgG quantification, which is the industry standard for nutraceutical applications. Standardisation of higher IgG concentrations (30% and 40%) is achieved through controlled fractionation processes that preserve the structural integrity of the immunoglobulin molecules."
      }
    },
    {
      "@type": "Question",
      "name": "What's the shelf life of your colostrum powder?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "24 months from manufacture date in original sealed packaging, stored in cool dry conditions below 25°C. Once opened, recommended use within 6 months."
      }
    }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ColostrumHero() {
  return (
    <>
      <Helmet>
        <title>Bovine Colostrum Bulk Supplier — IgG 10/20/30/40% | India & US Origin | Ingredientz</title>
        <meta name="description" content="Wholesale bovine colostrum powder in 10%, 20%, 30%, 40% IgG concentrations. Grass-fed, hormone-free, dual-origin sourcing from US and India. MOQ from 25kg. Request quote in 48 hours." />
        <meta name="keywords" content="bovine colostrum supplier, wholesale colostrum, bulk colostrum powder, colostrum IgG 20%, colostrum IgG 40%, grass-fed colostrum bulk, USA colostrum manufacturer, India colostrum supplier, nutraceutical colostrum, colostrum CDMO" />
        <link rel="canonical" href="https://www.ingredientz.co/ingredients/colostrum" />

        {/* Open Graph */}
        <meta property="og:title" content="Bovine Colostrum Bulk Supplier — Ingredientz" />
        <meta property="og:description" content="Wholesale bovine colostrum powder. IgG 10/20/30/40%. US and India sourcing. 25kg MOQ. 48h quotation." />
        <meta property="og:url" content="https://www.ingredientz.co/ingredients/colostrum" />
        <meta property="og:type" content="product" />
        <meta property="og:image" content="https://www.ingredientz.co/logo.png" />
        <meta property="og:site_name" content="Ingredientz" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bovine Colostrum Bulk Supplier — Ingredientz" />
        <meta name="twitter:description" content="Wholesale bovine colostrum powder. IgG 10/20/30/40%. 25kg MOQ. 48h quotation." />

        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <article style={{
        fontFamily: FONT.body,
        color: C.body,
        background: C.card,
        minHeight: "100vh",
        lineHeight: 1.6,
      }}>
        <Breadcrumbs />
        <Hero />
        <SpecCard />
        <Section title="What is Bovine Colostrum?">
          <p>Bovine colostrum is the first milk secreted by dairy cows in the 48 hours following calving. It is biologically distinct from regular milk: rather than a basic nutritive function, colostrum is designed to transfer immunity from cow to calf in a single, concentrated feed.</p>
          <p>For the nutraceutical industry, this concentration is the entire commercial proposition. A gram of colostrum powder contains roughly the same volume of immunoglobulins (IgG, IgA, IgM), growth factors (IGF-1, TGF-β), lactoferrin, and bioactive peptides that would otherwise require litres of mature milk to extract.</p>
          <p>End-consumer demand has accelerated sharply since 2023, driven by gut-health and immune-support positioning across DTC supplement brands. For B2B procurement teams, the strategic question has shifted from <em>"should we add colostrum to our portfolio?"</em> to <em>"which IgG specification and sourcing model fits our retail price point and regulatory market?"</em></p>
          <p>Ingredientz answers the second question. We supply colostrum across the full range of commercial IgG concentrations, from cost-sensitive private-label SKUs to premium high-potency formulations, with dual-origin flexibility between US and Indian dairies.</p>
        </Section>

        <IgGConcentrations />
        <SourcingComparison />
        <Applications />
        <Regulatory />
        <QualityControl />
        <ShippingLogistics />
        <FAQ />
        <WhyIngredientz />
        <QuoteForm />
        <RelatedIngredients />
      </article>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────────

function Breadcrumbs() {
  return (
    <nav aria-label="Breadcrumb" style={{
      maxWidth: 1100, margin: "0 auto", padding: "20px 24px 0",
      fontSize: 13, color: C.muted,
    }}>
      <a href="/" style={{ color: C.muted, textDecoration: "none" }}>Home</a>
      <span style={{ margin: "0 8px" }}>/</span>
      <a href="/ingredients" style={{ color: C.muted, textDecoration: "none" }}>Ingredients</a>
      <span style={{ margin: "0 8px" }}>/</span>
      <span style={{ color: C.ink }}>Colostrum</span>
    </nav>
  );
}

function Hero() {
  return (
    <header style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 32px" }}>
      <div style={{
        display: "inline-block", background: C.blueLight, color: C.blue,
        padding: "4px 12px", borderRadius: R.pill, fontSize: 12, fontWeight: 600,
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 18,
      }}>
        Ingredient · Animal-Origin Bioactives
      </div>
      <h1 style={{
        fontFamily: FONT.display,
        fontSize: "clamp(32px, 5vw, 48px)",
        fontWeight: 700,
        lineHeight: 1.15,
        color: C.ink,
        margin: "0 0 20px",
        letterSpacing: -0.5,
      }}>
        Bovine Colostrum — Bulk Supplier with Flexible IgG Specifications
      </h1>
      <p style={{
        fontSize: "clamp(16px, 2vw, 19px)",
        lineHeight: 1.55,
        color: C.body,
        margin: "0 0 28px",
        maxWidth: 820,
      }}>
        Wholesale supply of premium bovine colostrum powder for the global nutraceutical industry. Available in 10%, 20%, 30%, and 40% IgG concentrations, sourced from grass-fed dairy herds in the United States and India. MOQ from 25 kg. Quotation within 48 hours.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="#quote" style={{
          background: C.blue, color: "white", textDecoration: "none",
          padding: "13px 26px", borderRadius: R.md, fontWeight: 600, fontSize: 14,
          display: "inline-block",
        }}>Request a quote</a>
        <a href="#spec" style={{
          background: "transparent", color: C.ink, textDecoration: "none",
          padding: "13px 26px", borderRadius: R.md, fontWeight: 600, fontSize: 14,
          border: `1px solid ${C.border}`, display: "inline-block",
        }}>View specifications</a>
      </div>
    </header>
  );
}

function SpecCard() {
  const rows = [
    ["Common name", "Bovine Colostrum Powder"],
    ["IgG concentrations", "10%, 20%, 30%, 40%"],
    ["Form", "Spray-dried powder, free-flowing"],
    ["Origin", "United States (USDA Grade A) / India"],
    ["Collection", "First-milking and whole colostrum options"],
    ["Minimum order", "25 kg"],
    ["Lead time", "3–5 weeks from PO confirmation"],
    ["Standard packaging", "25 kg multi-layer bags inside fibre drums"],
    ["Shelf life", "24 months in original packaging"],
    ["Certifications", "cGMP, ISO 22000, Halal, Kosher; USDA Organic available"],
    ["Applications", "Capsules, tablets, gummies, beverages, sports nutrition"],
  ];
  return (
    <section id="spec" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 48px" }}>
      <div style={{
        background: C.bg, borderRadius: R.lg, padding: 28,
        border: `1px solid ${C.border}`,
      }}>
        <h2 style={{
          fontFamily: FONT.display, fontSize: 14, fontWeight: 700,
          color: C.muted, textTransform: "uppercase", letterSpacing: 1.2,
          margin: "0 0 18px",
        }}>Specifications at a glance</h2>
        <dl style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "14px 32px",
          margin: 0,
        }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <dt style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>{k}</dt>
              <dd style={{ fontSize: 15, color: C.ink, margin: 0, fontFamily: k === "IgG concentrations" ? FONT.mono : FONT.body }}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Section({ title, children, id }) {
  return (
    <section id={id} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 48px" }}>
      <h2 style={{
        fontFamily: FONT.display,
        fontSize: "clamp(24px, 3vw, 32px)",
        fontWeight: 700,
        color: C.ink,
        margin: "0 0 18px",
        letterSpacing: -0.3,
      }}>{title}</h2>
      <div style={{ maxWidth: 820, fontSize: 16, lineHeight: 1.65 }}>
        {children}
      </div>
    </section>
  );
}

function IgGConcentrations() {
  const tiers = [
    {
      name: "10% IgG",
      label: "Natural, Cost-Efficient",
      desc: "Whole bovine colostrum powder, minimally processed. IgG content reflects what occurs naturally in the source material without concentration steps.",
      uses: ["Daily-dose general wellness", "Cost-sensitive private label", "Animal nutrition and pet supplements", "Bulk dairy and beverage applications"],
      tone: C.muted,
    },
    {
      name: "20% IgG",
      label: "Industry Standard",
      desc: "The most widely traded specification in commercial nutraceuticals. Produced from first-milking colostrum without aggressive fractionation, preserving the full spectrum of bioactives.",
      uses: ["Mainstream colostrum capsule and tablet brands", "Sports nutrition and recovery formulations", "Functional beverages and powders"],
      tone: C.blue,
      featured: true,
    },
    {
      name: "30% IgG",
      label: "Premium Positioning",
      desc: "Higher concentration achieved through controlled fractionation. Targets premium retail brands and clinical-format supplements.",
      uses: ["Premium DTC supplement brands", "Clinical-grade gut health formulations", "Higher-dose immunity products"],
      tone: C.amber,
    },
    {
      name: "40% IgG",
      label: "High-Potency / Clinical",
      desc: "The highest commercially available concentration in standardised bovine colostrum. Some bioactive growth factors are reduced in exchange for substantially higher immunoglobulin payload per dose.",
      uses: ["Clinical and medical-nutrition", "Concentrated dosage formats", "B2B ingredient blending"],
      tone: C.green,
    },
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 56px" }}>
      <h2 style={{
        fontFamily: FONT.display, fontSize: "clamp(24px, 3vw, 32px)",
        fontWeight: 700, color: C.ink, margin: "0 0 12px", letterSpacing: -0.3,
      }}>IgG Concentrations Explained — and How to Choose</h2>
      <p style={{ fontSize: 16, lineHeight: 1.65, color: C.body, margin: "0 0 28px", maxWidth: 820 }}>
        The IgG percentage is the single most important variable in colostrum procurement. It determines the active dose your formulation can deliver, your unit cost, and ultimately the retail price point your brand can support.
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
      }}>
        {tiers.map(t => (
          <div key={t.name} style={{
            background: C.card,
            border: t.featured ? `2px solid ${t.tone}` : `1px solid ${C.border}`,
            borderRadius: R.lg,
            padding: 22,
            position: "relative",
          }}>
            {t.featured && (
              <div style={{
                position: "absolute", top: -10, right: 18,
                background: t.tone, color: "white", padding: "3px 10px",
                borderRadius: R.pill, fontSize: 10, fontWeight: 700,
                letterSpacing: 0.6, textTransform: "uppercase",
              }}>Most popular</div>
            )}
            <div style={{
              display: "inline-block", background: `${t.tone}1A`, color: t.tone,
              padding: "3px 10px", borderRadius: R.sm, fontSize: 11,
              fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6,
              marginBottom: 10,
            }}>{t.label}</div>
            <h3 style={{
              fontFamily: FONT.mono, fontSize: 26, fontWeight: 700,
              color: C.ink, margin: "0 0 10px",
            }}>{t.name}</h3>
            <p style={{ fontSize: 14, color: C.body, lineHeight: 1.55, margin: "0 0 14px" }}>{t.desc}</p>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Best suited to</div>
            <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 13, color: C.body }}>
              {t.uses.map(u => <li key={u} style={{ marginBottom: 4 }}>{u}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function SourcingComparison() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 56px" }}>
      <h2 style={{
        fontFamily: FONT.display, fontSize: "clamp(24px, 3vw, 32px)",
        fontWeight: 700, color: C.ink, margin: "0 0 12px", letterSpacing: -0.3,
      }}>Sourcing — US and India Origins Compared</h2>
      <p style={{ fontSize: 16, lineHeight: 1.65, color: C.body, margin: "0 0 28px", maxWidth: 820 }}>
        Ingredientz operates a dual-origin model. Both source streams meet our quality standards, but they serve different commercial profiles.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        <SourcingCard
          flag="🇺🇸"
          title="United States — USDA Grade A Dairies"
          intro="US-origin colostrum is collected from USDA-inspected Grade A dairy farms, predominantly in Wisconsin, Minnesota, and the Midwest dairy belt. Herds are managed to meet US federal dairy standards: routine veterinary oversight, traceability from farm to processing, and chain-of-custody documentation."
          whenLabel="When to choose US origin"
          when={[
            "Retail brand storytelling emphasising 'USA-sourced'",
            "Premium price points where origin is a marketing asset",
            "US natural channel where origin labelling drives shelf decisions",
            "Regulatory documentation for FDA dossiers",
          ]}
        />
        <SourcingCard
          flag="🇮🇳"
          title="India — Lower Cost Base, Strong Compliance"
          intro="Indian dairy herds, particularly in Punjab, Haryana, and Gujarat, produce colostrum at lower cost per kilogram while meeting international compliance standards. Ingredientz works with processors holding FSSAI, US FDA registration, EU export certification, and Halal/Kosher accreditations."
          whenLabel="When to choose Indian origin"
          when={[
            "Margin pressure on private-label SKUs",
            "Volume contracts where unit cost compounds",
            "Markets where origin is not a primary differentiator",
            "Middle East, South Asia, and African export markets",
          ]}
        />
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: C.muted, marginTop: 22, maxWidth: 820 }}>
        We provide full Certificate of Analysis documentation for both origins on every shipment. Buyers can specify origin per order or per SKU.
      </p>
    </section>
  );
}

function SourcingCard({ flag, title, intro, whenLabel, when }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: R.lg, padding: 24,
    }}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>{flag}</div>
      <h3 style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.body, lineHeight: 1.6, margin: "0 0 16px" }}>{intro}</p>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{whenLabel}</div>
      <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 14, color: C.body, lineHeight: 1.6 }}>
        {when.map(w => <li key={w} style={{ marginBottom: 4 }}>{w}</li>)}
      </ul>
    </div>
  );
}

function Applications() {
  const groups = [
    {
      title: "Human nutraceuticals",
      items: ["Immune support capsules and tablets", "Gut health and intestinal permeability formulations", "Sports recovery powders (often blended with whey)", "Beauty-from-within (skin elasticity, hair regrowth)", "Pediatric and senior nutrition (regulatory-dependent)"],
    },
    {
      title: "Functional foods and beverages",
      items: ["Protein-fortified beverages", "Functional yoghurt and kefir", "Premium infant nutrition (regulatory-dependent)", "Bone broth and gut-support powders"],
    },
    {
      title: "Sports nutrition",
      items: ["Recovery formulations leveraging IGF-1 and growth factors", "Endurance performance blends", "Post-exercise immune-support stacks"],
    },
    {
      title: "Animal nutrition",
      items: ["Calf colostrum replacers (species-matched pools)", "Companion animal gut and immune support", "Equine and livestock supplementation"],
    },
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 56px" }}>
      <h2 style={{
        fontFamily: FONT.display, fontSize: "clamp(24px, 3vw, 32px)",
        fontWeight: 700, color: C.ink, margin: "0 0 12px", letterSpacing: -0.3,
      }}>Applications</h2>
      <p style={{ fontSize: 16, lineHeight: 1.65, color: C.body, margin: "0 0 28px", maxWidth: 820 }}>
        Colostrum's bioactive profile makes it functional across a wider range of finished products than most ingredient categories. The same lot can serve human supplements, beverages, and animal nutrition with no reformulation.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {groups.map(g => (
          <div key={g.title} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: R.md, padding: 20,
          }}>
            <h3 style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>{g.title}</h3>
            <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 13, color: C.body, lineHeight: 1.6 }}>
              {g.items.map(it => <li key={it} style={{ marginBottom: 4 }}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Regulatory() {
  return (
    <Section title="Regulatory and Certifications">
      <p>Colostrum is classified as a food ingredient in most major markets, though regulatory treatment differs for human versus animal end-use, and for general supplement versus infant nutrition applications.</p>
      <p style={{ fontWeight: 600, color: C.ink }}>Standard certifications available across our colostrum range:</p>
      <ul>
        <li>cGMP-compliant processing</li>
        <li>ISO 22000 food safety management</li>
        <li>Halal and Kosher certification</li>
        <li>HACCP documentation</li>
        <li>US FDA facility registration (origin-dependent)</li>
        <li>EU food contact and import documentation</li>
        <li>USDA Organic (premium SKUs, US-origin)</li>
      </ul>
      <p style={{ fontWeight: 600, color: C.ink }}>For specific applications we can provide:</p>
      <ul>
        <li>Heavy metal and microbiological reports (per shipment)</li>
        <li>IgG potency verification (third-party tested)</li>
        <li>Allergen statements and BSE/TSE-free declarations</li>
        <li>Country-specific compliance documentation for export</li>
      </ul>
      <p>We do not currently supply ingredients for infant formula applications where regulatory approval requires manufacturer pre-registration in specific markets. For most other applications, we can provide the documentation pack standard buyers require for new ingredient onboarding.</p>
    </Section>
  );
}

function QualityControl() {
  return (
    <Section title="Quality Control and CoA Process">
      <p>Every batch shipped by Ingredientz includes a Certificate of Analysis covering:</p>
      <ul>
        <li>IgG potency (HPLC method)</li>
        <li>Protein content (Kjeldahl)</li>
        <li>Fat, moisture, ash</li>
        <li>Microbiological profile (total plate count, yeast & mould, coliforms, <em>E. coli</em>, <em>Salmonella</em>, <em>Listeria</em>)</li>
        <li>Heavy metals (lead, cadmium, mercury, arsenic) where applicable</li>
        <li>Foreign matter and physical appearance</li>
        <li>Particle size and bulk density</li>
      </ul>
      <p>CoA samples can be reviewed before order placement. Independent third-party retesting can be arranged at the buyer's lab of choice on request.</p>
    </Section>
  );
}

function ShippingLogistics() {
  return (
    <Section title="Shipping, Packaging, and Lead Times">
      <p><strong style={{ color: C.ink }}>Standard packaging:</strong> 25 kg net weight per unit, in food-grade multi-layer bags inside fibre drums. Custom packaging (smaller bags, IBC totes) available on request for orders above 500 kg.</p>
      <p><strong style={{ color: C.ink }}>Lead time:</strong> 3–5 weeks from purchase order confirmation for in-stock specifications. Custom IgG percentages or USDA Organic requirements may extend lead time to 6–8 weeks.</p>
      <p><strong style={{ color: C.ink }}>Shipping:</strong></p>
      <ul>
        <li>North America: 18–25 days door-to-door from origin (ocean freight)</li>
        <li>European Union: 22–28 days door-to-door (ocean freight)</li>
        <li>Air freight available for sample shipments and time-critical orders</li>
      </ul>
      <p><strong style={{ color: C.ink }}>Incoterms:</strong> EXW, FOB, CIF, DAP, DDP available. We handle export documentation, fumigation certificates, phytosanitary requirements, and origin-specific compliance paperwork.</p>
      <p>Sample quantities (250g – 1kg) are available for new buyers and ship within 5 business days from the nearest warehouse.</p>
    </Section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "What's the difference between first-milking colostrum and whole colostrum?",
      a: "First-milking colostrum is collected only from the cow's first milking after calving, where bioactive concentration is highest. Whole colostrum aggregates milkings from the first 48 hours and offers a more cost-efficient profile. First-milking sourcing typically commands a 30–60% price premium. We supply both."
    },
    {
      q: "Is your colostrum grass-fed, hormone-free, and antibiotic-free?",
      a: "Our US-origin colostrum is sourced from herds that meet grass-fed and hormone-free standards. Antibiotic-free designation is verifiable through batch documentation. Indian-origin colostrum meets antibiotic-free and hormone-free standards but is typically not grass-fed certified."
    },
    {
      q: "Do you offer freeze-dried colostrum?",
      a: "Our standard process is spray drying, which is the commercial standard for industrial nutraceutical applications. Freeze-dried colostrum is available on request for premium applications but commands a 2–3x price premium and longer lead times."
    },
    {
      q: "What's your minimum order quantity?",
      a: "MOQ is 25 kg for in-stock specifications. Smaller sample quantities (250g – 1kg) are available for evaluation. For custom IgG percentages or special certifications, MOQ may be higher."
    },
    {
      q: "How is IgG measured and standardised?",
      a: "We use HPLC (high-performance liquid chromatography) for IgG quantification, which is the industry standard for nutraceutical applications. Standardisation of higher IgG concentrations (30% and 40%) is achieved through controlled fractionation processes that preserve the structural integrity of the immunoglobulin molecules."
    },
    {
      q: "Can you provide private label or custom blends?",
      a: "We supply colostrum as a raw ingredient. We do not currently offer finished-product private labelling. We can supply pre-blended ingredients (colostrum + whey, colostrum + probiotic combinations) for buyers who require these as a single SKU."
    },
    {
      q: "What's the shelf life of your colostrum powder?",
      a: "24 months from manufacture date in original sealed packaging, stored in cool dry conditions below 25°C. Once opened, recommended use within 6 months."
    },
    {
      q: "Do you ship to my country?",
      a: "We ship to all major nutraceutical markets globally. We have active customers in North America, the European Union, the United Kingdom, Australia, and the Middle East. For new geographies, we will confirm export documentation requirements before quoting."
    },
    {
      q: "Can I visit your processing facility?",
      a: "For confirmed orders above 1,000 kg, facility audits can be arranged at our US or Indian processing partners. For routine documentation, we provide full GMP certification, audit reports, and process flow diagrams under NDA."
    },
    {
      q: "What documentation do you provide with each shipment?",
      a: "Certificate of Analysis, Certificate of Origin, Phytosanitary Certificate (where applicable), Halal/Kosher certification (where requested), MSDS, allergen statement, BSE/TSE-free declaration, packing list, and commercial invoice."
    },
    {
      q: "How do I get a sample?",
      a: "Submit a request through the form below or email sales@ingredientz.co. Samples (up to 1 kg) ship within 5 business days. For lab evaluation samples, no cost is charged for established buyers; for new accounts, a refundable sample fee may apply."
    },
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 56px" }}>
      <h2 style={{
        fontFamily: FONT.display, fontSize: "clamp(24px, 3vw, 32px)",
        fontWeight: 700, color: C.ink, margin: "0 0 24px", letterSpacing: -0.3,
      }}>Frequently Asked Questions</h2>
      <div style={{ maxWidth: 820 }}>
        {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
      </div>
    </section>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <details open={open} onToggle={(e) => setOpen(e.target.open)} style={{
      borderBottom: `1px solid ${C.border}`,
      padding: "16px 0",
    }}>
      <summary style={{
        cursor: "pointer",
        fontSize: 16, fontWeight: 600, color: C.ink,
        listStyle: "none", display: "flex", justifyContent: "space-between",
        alignItems: "center", gap: 12,
      }}>
        <span>{q}</span>
        <span style={{ fontSize: 22, color: C.blue, fontWeight: 400, lineHeight: 1, flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </summary>
      <p style={{ fontSize: 15, color: C.body, lineHeight: 1.65, margin: "12px 0 0" }}>{a}</p>
    </details>
  );
}

function WhyIngredientz() {
  const points = [
    { title: "Dual-origin flexibility", body: "US-sourced premium colostrum and India-sourced cost-efficient colostrum, both meeting the same quality standards. Buyers can match origin to retail price point on a per-SKU basis." },
    { title: "Full IgG spectrum", body: "10%, 20%, 30%, and 40% concentrations supplied from a single account. No need to onboard separate suppliers for different product tiers." },
    { title: "48-hour quotation turnaround", body: "Every enquiry receives a formal quotation within two business days, including pricing, lead time, certification confirmation, and shipping options." },
    { title: "Documentation depth", body: "Full CoA, certifications, and regulatory documents provided per shipment. We support buyers in regulated markets (EU, US) with complete pre-import dossiers." },
    { title: "Direct manufacturer access", body: "We work with processing partners, not traders. CoA documentation traces to the manufacturing line, not a re-blended pool." },
    { title: "Single point of contact", body: "One account manager for both origins, simplifying procurement and reducing supplier overhead." },
  ];
  return (
    <section style={{ background: C.bg, padding: "56px 0", marginTop: 8 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <h2 style={{
          fontFamily: FONT.display, fontSize: "clamp(24px, 3vw, 32px)",
          fontWeight: 700, color: C.ink, margin: "0 0 28px", letterSpacing: -0.3,
        }}>Why Source Colostrum from Ingredientz</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {points.map(p => (
            <div key={p.title} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: R.lg, padding: 22,
            }}>
              <h3 style={{ fontFamily: FONT.display, fontSize: 17, fontWeight: 700, color: C.blue, margin: "0 0 10px" }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: C.body, lineHeight: 1.6, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteForm() {
  const [form, setForm] = useState({
    company: "", contact: "", email: "", country: "",
    igg: "", volume: "", origin: "", application: "", comments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.company || !form.contact || !form.email) {
      setError("Please fill in company, contact, and email.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // TODO: Replace with your actual enquiry endpoint
      // e.g. await fetch('/api/enquiry', { method: 'POST', body: JSON.stringify({...form, product: 'Bovine Colostrum'}) })
      console.log("Enquiry submitted:", { ...form, product: "Bovine Colostrum", source: "ingredients/colostrum hero page" });
      await new Promise(r => setTimeout(r, 800)); // simulate network
      setSubmitted(true);
    } catch (err) {
      setError("Submission failed. Please email sales@ingredientz.co directly.");
    } finally {
      setSubmitting(false);
    }
  }

  const input = {
    width: "100%", padding: "11px 13px", border: `1px solid ${C.border}`,
    borderRadius: R.md, fontSize: 14, fontFamily: "inherit",
    background: C.card, color: C.ink, boxSizing: "border-box",
  };
  const label = { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };

  if (submitted) {
    return (
      <section id="quote" style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{
          background: "#E7F8E7", border: `1px solid ${C.green}`,
          borderRadius: R.lg, padding: 32, textAlign: "center", maxWidth: 600, margin: "0 auto",
        }}>
          <h2 style={{ fontFamily: FONT.display, fontSize: 24, color: C.ink, margin: "0 0 10px" }}>✓ Enquiry received</h2>
          <p style={{ fontSize: 15, color: C.body, margin: 0 }}>
            Thank you. Our team will respond with a formal quotation within 48 business hours. 
            For urgent requests, email <a href="mailto:sales@ingredientz.co" style={{ color: C.blue }}>sales@ingredientz.co</a>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="quote" style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
      <div style={{
        background: C.card, border: `2px solid ${C.blue}`,
        borderRadius: R.lg, padding: "32px 28px",
      }}>
        <h2 style={{
          fontFamily: FONT.display, fontSize: "clamp(22px, 2.5vw, 28px)",
          fontWeight: 700, color: C.ink, margin: "0 0 8px",
        }}>Request a Colostrum Quote</h2>
        <p style={{ fontSize: 15, color: C.body, margin: "0 0 22px" }}>
          Formal quotation within 48 business hours including pricing, lead time, certifications, and shipping.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <div>
              <label style={label}>Company *</label>
              <input style={input} value={form.company} onChange={e => update("company", e.target.value)} placeholder="Your company name" />
            </div>
            <div>
              <label style={label}>Contact name *</label>
              <input style={input} value={form.contact} onChange={e => update("contact", e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label style={label}>Email *</label>
              <input style={input} type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <label style={label}>Country</label>
              <input style={input} value={form.country} onChange={e => update("country", e.target.value)} placeholder="e.g. United States" />
            </div>
            <div>
              <label style={label}>IgG specification</label>
              <select style={input} value={form.igg} onChange={e => update("igg", e.target.value)}>
                <option value="">Select…</option>
                <option>10% IgG</option>
                <option>20% IgG</option>
                <option>30% IgG</option>
                <option>40% IgG</option>
                <option>Other / Custom</option>
              </select>
            </div>
            <div>
              <label style={label}>Estimated annual volume</label>
              <select style={input} value={form.volume} onChange={e => update("volume", e.target.value)}>
                <option value="">Select…</option>
                <option>25–100 kg</option>
                <option>100–500 kg</option>
                <option>500–2,000 kg</option>
                <option>2,000+ kg</option>
              </select>
            </div>
            <div>
              <label style={label}>Origin preference</label>
              <select style={input} value={form.origin} onChange={e => update("origin", e.target.value)}>
                <option value="">No preference</option>
                <option>United States</option>
                <option>India</option>
              </select>
            </div>
            <div>
              <label style={label}>Application</label>
              <input style={input} value={form.application} onChange={e => update("application", e.target.value)} placeholder="e.g. Capsules, sports nutrition" />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={label}>Additional comments</label>
            <textarea style={{ ...input, minHeight: 80, resize: "vertical" }}
                      value={form.comments} onChange={e => update("comments", e.target.value)}
                      placeholder="Specific certifications, packaging, or delivery requirements" />
          </div>
          {error && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#FEE", color: "#FA3E3E", borderRadius: R.sm, fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}
          <button type="submit" disabled={submitting} style={{
            marginTop: 18, background: C.blue, color: "white", border: 0,
            padding: "13px 28px", borderRadius: R.md, fontSize: 15,
            fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}>
            {submitting ? "Submitting…" : "Submit enquiry"}
          </button>
          <p style={{ fontSize: 12, color: C.muted, margin: "12px 0 0" }}>
            By submitting, you agree to be contacted by Ingredientz regarding this enquiry. We do not share contact details with third parties.
          </p>
        </form>
      </div>
    </section>
  );
}

function RelatedIngredients() {
  const items = [
    { name: "Lactoferrin", slug: "lactoferrin" },
    { name: "Bovine Collagen", slug: "bovine-collagen" },
    { name: "Whey Protein Isolate", slug: "whey-protein-isolate" },
    { name: "Milk Protein Concentrate", slug: "milk-protein-concentrate" },
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px" }}>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
        <h3 style={{ fontFamily: FONT.display, fontSize: 14, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px" }}>
          Related ingredients
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {items.map(i => (
            <a key={i.slug} href={`/ingredients/${i.slug}`} style={{
              background: C.bg, color: C.ink, textDecoration: "none",
              padding: "8px 16px", borderRadius: R.pill, fontSize: 13,
              border: `1px solid ${C.border}`,
            }}>{i.name}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <a href="/products" style={{ color: C.blue, fontSize: 14, textDecoration: "none", fontWeight: 600 }}>Browse full catalog →</a>
          <a href="/contact" style={{ color: C.blue, fontSize: 14, textDecoration: "none", fontWeight: 600 }}>Talk to our sourcing team →</a>
        </div>
      </div>
    </section>
  );
}
