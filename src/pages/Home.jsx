import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { ProductCard } from "../components/ProductCard.jsx";
import { SEO, PAGE_SEO } from "../components/SEO.jsx";


const CAT_ICONS = {
  "Botanical Extracts":"🌿","Herbal Powders":"🌱","Fruit Powders":"🍊",
  "Mushroom Extracts":"🍄","Vitamins & Minerals":"⚗️","Greens & Superfoods":"🥬",
  "Enzymes":"🧬","Probiotics & Prebiotics":"🦠","Proteins & Amino Acids":"💪",
  "Fatty Acids & Oils":"🫙","Animal & Marine":"🐟","Cosmeceuticals":"✨",
  "Sports Nutrition":"🏋️","Food Ingredients":"🌾","Chemical":"🧪",
  "Premixes & Blends":"⚖️","Pharmaceutical":"💊","Dairy Ingredients":"🥛",
  "Feed":"🌾","Pet Food":"🐾",
};


const T = {
  EN: {
    eyebrow: "⚡ The Nutraceutical Superfactory",
    h1a: "Premium Nutraceutical Ingredients",
    h1b: "Sourced from the World's",
    h1c: "Best Factories",
    sub: "From Ashwagandha in India to Colostrum in New Zealand — we source, verify and deliver. One platform, 500+ ingredients, 6 regions. 200+ brands trust us.",
    search: "Search by ingredient name, CAS number or category…",
    searchBtn: "Search",
    trust1: "North America & Europe", trust2: "Middle East & Africa", trust3: "India & China", trust4: "48h Quote Turnaround",
    sfTitle: "Why brands call us their Superfactory",
    sfSub: "One platform. 500+ ingredients. 6 regions.",
    sfDesc: "We consolidate sourcing from India, China, Europe, North America, Middle East and Africa — so you don't have to chase multiple suppliers, negotiate separately, or worry about documentation.",
    sf1: "Single point of contact", sf1d: "One team handles sourcing, documentation and logistics across all regions.",
    sf2: "Verified factories only", sf2d: "Every supplier is pre-vetted. CoA, TDS and MSDS always provided.",
    sf3: "48h quotations", sf3d: "Submit an enquiry today and receive a competitive commercial quotation within 48 hours.",
    sf4: "6 global regions", sf4d: "North America, Europe, Middle East, Africa, India and China — all covered.",
    cats: "Browse by Category", catSub: "20 categories · 500+ active ingredients", viewAll: "View all →",
    featured: "Featured Products", featSub: "Live from our catalogue",
    how: "How It Works", howSub: "From discovery to delivery in four simple steps",
    step1t: "Browse & Discover", step1d: "Search 500+ premium ingredients across 20 nutraceutical categories.",
    step2t: "Add to Enquiry", step2d: "Select products and quantities, or type a custom requirement.",
    step3t: "Get Quoted in 48h", step3d: "We source from verified manufacturers and send a competitive quotation.",
    step4t: "Track & Order", step4d: "Login with OTP to view your quotation and confirm your order.",
    ctaH: "Can't find what you're looking for?",
    ctaP: "Submit your requirement directly. Our sourcing team will respond within 48 hours.",
    ctaCompany: "Your company", ctaProduct: "Product / requirement", ctaEmail: "Business email",
    ctaBtn: "Submit Enquiry →",
    f1: "Auto-account creation", f2: "OTP login to track", f3: "Reply within 48 hours",
  },
  FR: {
    eyebrow: "⚡ La Superfactory Nutraceutique",
    h1a: "Ingrédients Nutraceutiques Premium",
    h1b: "Sourcés dans les Meilleures",
    h1c: "Usines du Monde",
    sub: "De l'Ashwagandha en Inde au Colostrum en Nouvelle-Zélande — nous sourceons, vérifions et livrons. Une plateforme, 500+ ingrédients, 6 régions.",
    search: "Rechercher par nom, numéro CAS ou catégorie…",
    searchBtn: "Rechercher",
    trust1: "Amérique du Nord & Europe", trust2: "Moyen-Orient & Afrique", trust3: "Inde & Chine", trust4: "Devis en 48h",
    sfTitle: "Pourquoi les marques nous appellent leur Superfactory",
    sfSub: "Une plateforme. 500+ ingrédients. 6 régions.",
    sfDesc: "Nous consolidons l'approvisionnement depuis l'Inde, la Chine, l'Europe, l'Amérique du Nord, le Moyen-Orient et l'Afrique.",
    sf1: "Point de contact unique", sf1d: "Une équipe gère l'approvisionnement, la documentation et la logistique.",
    sf2: "Usines vérifiées uniquement", sf2d: "Chaque fournisseur est pré-vérifié. CoA, TDS et MSDS toujours fournis.",
    sf3: "Devis en 48h", sf3d: "Soumettez une demande aujourd'hui et recevez un devis dans les 48 heures.",
    sf4: "6 régions mondiales", sf4d: "Amérique du Nord, Europe, Moyen-Orient, Afrique, Inde et Chine.",
    cats: "Parcourir par catégorie", catSub: "20 catégories · 500+ ingrédients actifs", viewAll: "Voir tout →",
    featured: "Produits en vedette", featSub: "En direct de notre catalogue",
    how: "Comment ça marche", howSub: "De la découverte à la livraison en quatre étapes",
    step1t: "Parcourir", step1d: "Recherchez 500+ ingrédients premium dans 20 catégories.",
    step2t: "Ajouter à la demande", step2d: "Sélectionnez les produits et les quantités.",
    step3t: "Devis en 48h", step3d: "Nous sourceons auprès de fabricants vérifiés.",
    step4t: "Suivre et commander", step4d: "Connectez-vous avec OTP pour voir votre devis.",
    ctaH: "Vous ne trouvez pas ce que vous cherchez?",
    ctaP: "Soumettez votre besoin directement. Notre équipe répondra dans les 48 heures.",
    ctaCompany: "Votre entreprise", ctaProduct: "Produit / besoin", ctaEmail: "Email professionnel",
    ctaBtn: "Soumettre la demande →",
    f1: "Création de compte automatique", f2: "Connexion OTP", f3: "Réponse en 48h",
  },
  DE: {
    eyebrow: "⚡ Die Nutraceutische Superfactory",
    h1a: "Premium Nutraceutische Zutaten",
    h1b: "Aus den Besten Fabriken",
    h1c: "der Welt",
    sub: "Von Ashwagandha in Indien bis Kolostrum in Neuseeland — wir sourcen, verifizieren und liefern. Eine Plattform, 500+ Zutaten, 6 Regionen.",
    search: "Suche nach Zutat, CAS-Nummer oder Kategorie…",
    searchBtn: "Suchen",
    trust1: "Nordamerika & Europa", trust2: "Naher Osten & Afrika", trust3: "Indien & China", trust4: "Angebot in 48h",
    sfTitle: "Warum Marken uns ihre Superfactory nennen",
    sfSub: "Eine Plattform. 500+ Zutaten. 6 Regionen.",
    sfDesc: "Wir konsolidieren die Beschaffung aus Indien, China, Europa, Nordamerika, dem Nahen Osten und Afrika.",
    sf1: "Einziger Ansprechpartner", sf1d: "Ein Team kümmert sich um Beschaffung, Dokumentation und Logistik.",
    sf2: "Nur verifizierte Fabriken", sf2d: "Jeder Lieferant wird vorab geprüft. CoA, TDS und MSDS immer bereitgestellt.",
    sf3: "Angebot in 48h", sf3d: "Stellen Sie noch heute eine Anfrage und erhalten Sie ein Angebot innerhalb von 48 Stunden.",
    sf4: "6 globale Regionen", sf4d: "Nordamerika, Europa, Naher Osten, Afrika, Indien und China.",
    cats: "Nach Kategorie suchen", catSub: "20 Kategorien · 500+ Zutaten", viewAll: "Alle anzeigen →",
    featured: "Empfohlene Produkte", featSub: "Live aus unserem Katalog",
    how: "So funktioniert es", howSub: "Von der Entdeckung bis zur Lieferung",
    step1t: "Entdecken", step1d: "Suche in 500+ Premium-Zutaten.",
    step2t: "Anfrage hinzufügen", step2d: "Produkte und Mengen auswählen.",
    step3t: "Angebot in 48h", step3d: "Wir sourcen von verifizierten Herstellern.",
    step4t: "Verfolgen & Bestellen", step4d: "Mit OTP einloggen und Angebot bestätigen.",
    ctaH: "Nicht gefunden was Sie suchen?",
    ctaP: "Senden Sie Ihre Anforderung direkt. Unser Team antwortet innerhalb von 48 Stunden.",
    ctaCompany: "Ihr Unternehmen", ctaProduct: "Produkt / Anforderung", ctaEmail: "Geschäftliche E-Mail",
    ctaBtn: "Anfrage senden →",
    f1: "Automatische Kontoerstellung", f2: "OTP-Login", f3: "Antwort in 48h",
  },
  ES: {
    eyebrow: "⚡ La Superfactory Nutracéutica",
    h1a: "Ingredientes Nutracéuticos Premium",
    h1b: "Obtenidos de las Mejores",
    h1c: "Fábricas del Mundo",
    sub: "De Ashwagandha en India al Calostro en Nueva Zelanda — obtenemos, verificamos y entregamos. Una plataforma, 500+ ingredientes, 6 regiones.",
    search: "Buscar por nombre, número CAS o categoría…",
    searchBtn: "Buscar",
    trust1: "Norteamérica & Europa", trust2: "Oriente Medio & África", trust3: "India & China", trust4: "Cotización en 48h",
    sfTitle: "Por qué las marcas nos llaman su Superfactory",
    sfSub: "Una plataforma. 500+ ingredientes. 6 regiones.",
    sfDesc: "Consolidamos el abastecimiento desde India, China, Europa, Norteamérica, Oriente Medio y África.",
    sf1: "Punto de contacto único", sf1d: "Un equipo gestiona el abastecimiento, documentación y logística.",
    sf2: "Solo fábricas verificadas", sf2d: "Cada proveedor está pre-verificado. CoA, TDS y MSDS siempre disponibles.",
    sf3: "Cotización en 48h", sf3d: "Envíe una consulta hoy y reciba una cotización comercial en 48 horas.",
    sf4: "6 regiones globales", sf4d: "Norteamérica, Europa, Oriente Medio, África, India y China.",
    cats: "Navegar por categoría", catSub: "20 categorías · 500+ ingredientes activos", viewAll: "Ver todo →",
    featured: "Productos destacados", featSub: "En vivo desde nuestro catálogo",
    how: "Cómo funciona", howSub: "Del descubrimiento a la entrega en cuatro pasos",
    step1t: "Descubrir", step1d: "Busque 500+ ingredientes premium.",
    step2t: "Agregar a consulta", step2d: "Seleccione productos y cantidades.",
    step3t: "Cotización en 48h", step3d: "Obtenemos de fabricantes verificados.",
    step4t: "Rastrear y ordenar", step4d: "Inicie sesión con OTP para confirmar.",
    ctaH: "¿No encuentra lo que busca?",
    ctaP: "Envíe su requisito directamente. Nuestro equipo responderá en 48 horas.",
    ctaCompany: "Su empresa", ctaProduct: "Producto / requisito", ctaEmail: "Correo empresarial",
    ctaBtn: "Enviar consulta →",
    f1: "Creación automática de cuenta", f2: "Inicio de sesión OTP", f3: "Respuesta en 48h",
  }
};


export default function Home({ lang, cart, onAddToCart }) {
  const [products, setProducts]     = useState([]);
  const [cats, setCats]             = useState([]);
  const [search, setSearch]         = useState("");
  const [ctaForm, setCtaForm]       = useState({ company:"", product:"", email:"" });
  const [ctaSubmitting, setCtaSubmitting] = useState(false);
  const [ctaDone, setCtaDone]       = useState(false);
  const t = T[lang] || T.EN;


  useEffect(() => {
    supabase.from("products").select("*,product_categories(name)").eq("status","active").eq("featured",true).order("name").limit(6).then(({ data }) => setProducts(data || []));
    supabase.from("product_categories").select("*").eq("active",true).order("sort_order").then(({ data }) => setCats(data || []));
  }, []);


  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) window.location.href = `/products?q=${encodeURIComponent(search)}`;
  }


  async function submitCta(e) {
    e.preventDefault();
    if (!ctaForm.email || !ctaForm.product) return;
    setCtaSubmitting(true);
    try {
      await supabase.from("enquiries").insert({
        customer_name: ctaForm.company || ctaForm.email,
        contact_person: ctaForm.company,
        stage: "New Enquiry",
        priority: "Medium",
        source: "Website",
        products: [{ name: ctaForm.product, qty: "", unit: "kg" }],
        notes: `Website CTA enquiry from ${ctaForm.email}`,
        created_by: "Website"
      });
      setCtaDone(true);
    } catch(e) { console.error(e); }
    finally { setCtaSubmitting(false); }
  }


  const cartIds = new Set(cart.map(p => p.id));


  return (
    <div>
      <SEO {...PAGE_SEO.home}/>
      {/* HERO */}
      <section style={{ background: "#0D1F3C", padding: "72px 0 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,160,0.1) 0%, transparent 70%)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: -80, left: "25%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(24,119,242,0.08) 0%, transparent 70%)", pointerEvents: "none" }}/>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(14,165,160,0.1)", border: "1px solid rgba(14,165,160,0.25)", color: "#2dd4bf", fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", padding: "5px 14px", borderRadius: 20, marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2dd4bf", display: "inline-block" }}/>
            {t.eyebrow}
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, fontWeight: 400, color: "white", lineHeight: 1.1, letterSpacing: -1, marginBottom: 16 }}>
            {t.h1a}<br/>
            <em style={{ color: "#2dd4bf", fontStyle: "italic" }}>{t.h1b}</em><br/>
            {t.h1c}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.7, maxWidth: 520, marginBottom: 28, fontWeight: 300 }}>{t.sub}</p>


          <form onSubmit={handleSearch} style={{ display: "flex", maxWidth: 540, marginBottom: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 13, padding: "13px 16px" }}/>
            <button type="submit" style={{ background: "#0EA5A0", border: "none", color: "white", padding: "13px 24px", fontSize: 12, fontWeight: 500 }}>{t.searchBtn}</button>
          </form>

          {/* Label to Ingredients — scanning-label CTA */}
          <style>{`
            @keyframes ingScan { 0%,100%{ top:30%; } 50%{ top:70%; } }
            @media (prefers-reduced-motion: reduce) { .ing-scan { animation: none !important; top: 50% !important; } }
          `}</style>
          <Link to="/formula" style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "stretch", background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(14,165,160,0.06))", border: "1px solid rgba(201,168,76,0.38)", borderRadius: 14, overflow: "hidden", width: "100%", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.65)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.38)"; e.currentTarget.style.transform = "none"; }}>
              {/* scanning label graphic */}
              <div style={{ width: 100, background: "rgba(255,255,255,0.06)", borderRight: "1px solid rgba(201,168,76,0.22)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 56, height: 72, background: "#fff", borderRadius: 5, padding: "8px 7px", boxShadow: "0 6px 16px rgba(0,0,0,0.35)" }}>
                  <div style={{ height: 4.5, background: "#0D1F3C", borderRadius: 2, width: "72%", marginBottom: 5 }} />
                  <div style={{ height: 2.5, background: "#cbd5e1", borderRadius: 2, marginBottom: 3.5 }} />
                  <div style={{ height: 2.5, background: "#cbd5e1", borderRadius: 2, marginBottom: 3.5, width: "58%" }} />
                  <div style={{ height: 2.5, background: "#cbd5e1", borderRadius: 2, marginBottom: 3.5 }} />
                  <div style={{ height: 2.5, background: "#cbd5e1", borderRadius: 2, marginBottom: 3.5, width: "58%" }} />
                  <div style={{ height: 2.5, background: "#C9A84C", borderRadius: 2, width: "45%" }} />
                </div>
                <div className="ing-scan" style={{ position: "absolute", left: 24, right: 24, height: 2, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)", boxShadow: "0 0 10px #C9A84C", top: "30%", animation: "ingScan 2.4s ease-in-out infinite" }} />
              </div>
              {/* text */}
              <div style={{ padding: "20px 26px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#fff", lineHeight: 1.18, letterSpacing: "-0.01em" }}>Turn your label into a quote</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6, lineHeight: 1.5 }}>We read every ingredient and calculate your quantities.</div>
                <span style={{ display: "inline-block", background: "#0EA5A0", color: "#fff", fontSize: 14, fontWeight: 600, padding: "11px 22px", borderRadius: 9, marginTop: 16, alignSelf: "flex-start" }}>Upload your label →</span>
              </div>
            </div>
          </Link>


          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 36 }}>
            {[t.trust1, t.trust2, t.trust3, t.trust4].map(item => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0EA5A0", display: "inline-block" }}/>
                {item}
              </span>
            ))}
          </div>


          <div style={{ display: "flex", gap: 40, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {[["500+","Products"],["10+","Countries"],["200+","Brands Served"],["48h","Quote Turnaround"]].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: "white", letterSpacing: -1 }}>{v}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* SUPERFACTORY SECTION */}
      <section style={{ padding:"56px 0", background:"white", borderBottom:"1px solid #f1f5f9" }}>
        <div className="container">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }}>
            <div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#FFF7ED", border:"1px solid #fed7aa", color:"#c2410c", fontSize:10, fontWeight:600, letterSpacing:2, textTransform:"uppercase", padding:"4px 12px", borderRadius:20, marginBottom:16 }}>
                ⚡ The Nutraceutical Superfactory
              </div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, color:"#0D1F3C", fontWeight:400, letterSpacing:-0.5, marginBottom:14, lineHeight:1.2 }}>{t.sfTitle}</h2>
              <p style={{ fontSize:13, color:"#64748b", lineHeight:1.8, marginBottom:24, fontWeight:300 }}>{t.sfDesc}</p>
              <div style={{ display:"flex", gap:8 }}>
                <Link to="/products">
                  <button style={{ background:"#0D1F3C", color:"white", border:"none", borderRadius:6, padding:"9px 20px", fontSize:12, fontWeight:500, cursor:"pointer" }}>Browse Catalogue</button>
                </Link>
                <Link to="/enquiry">
                  <button style={{ background:"none", border:"1px solid #0D1F3C", color:"#0D1F3C", borderRadius:6, padding:"9px 20px", fontSize:12, cursor:"pointer" }}>Submit Enquiry</button>
                </Link>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[[t.sf1,t.sf1d,"🤝"],[t.sf2,t.sf2d,"✅"],[t.sf3,t.sf3d,"⚡"],[t.sf4,t.sf4d,"🌍"]].map(([title,desc,icon])=>(
                <div key={title} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:18 }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#0D1F3C", marginBottom:5 }}>{title}</div>
                  <div style={{ fontSize:11, color:"#64748b", lineHeight:1.55 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* CATEGORIES */}
      <section style={{ padding: "56px 0", background: "#FAF8F3" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#0D1F3C", fontWeight: 400, letterSpacing: -0.5 }}>{t.cats}</h2>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{t.catSub}</p>
            </div>
            <Link to="/categories" style={{ fontSize: 12, color: "#1877F2" }}>{t.viewAll}</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
            {cats.slice(0,10).map(cat => (
              <Link key={cat.id} to={`/products?cat=${cat.slug}`}
                style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 12px", textAlign: "center", textDecoration: "none", transition: "all 0.15s", display: "block" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#1877F2"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{CAT_ICONS[cat.name] || "🌿"}</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#475569", lineHeight: 1.3 }}>{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* FEATURED PRODUCTS */}
      <section style={{ padding: "56px 0" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#0D1F3C", fontWeight: 400, letterSpacing: -0.5 }}>{t.featured}</h2>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{t.featSub}</p>
            </div>
            <Link to="/products" style={{ fontSize: 12, color: "#1877F2" }}>{t.viewAll}</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {products.map(p => (
              <ProductCard key={p.id} product={p} onAddToEnquiry={onAddToCart} inCart={cartIds.has(p.id)}/>
            ))}
          </div>
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section style={{ padding: "56px 0", background: "#FAF8F3" }}>
        <div className="container">
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#0D1F3C", fontWeight: 400, letterSpacing: -0.5, marginBottom: 6 }}>{t.how}</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 28 }}>{t.howSub}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[[t.step1t,t.step1d],[t.step2t,t.step2d],[t.step3t,t.step3d],[t.step4t,t.step4d]].map(([title, desc], i) => (
              <div key={i} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0D1F3C", color: "white", fontFamily: "'DM Serif Display', serif", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{i+1}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1F3C", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section style={{ padding: "0 0 56px" }}>
        <div className="container">
          <div style={{ background: "#0D1F3C", borderRadius: 16, padding: "40px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: "white", fontWeight: 400, letterSpacing: -0.5, marginBottom: 10 }}>{t.ctaH}</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>{t.ctaP}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[t.f1, t.f2, t.f3].map(f => (
                  <span key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0EA5A0", display: "inline-block" }}/>
                    {f}
                  </span>
                ))}
              </div>
            </div>


            {ctaDone ? (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ color: "white", fontWeight: 600, fontSize: 15 }}>Enquiry submitted!</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 6 }}>We'll respond within 48 hours.</div>
              </div>
            ) : (
              <form onSubmit={submitCta} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 24 }}>
                {[[t.ctaCompany,"company","text","Company name"],[t.ctaProduct,"product","text","e.g. Ashwagandha Extract 5%"],[t.ctaEmail,"email","email","you@company.com"]].map(([label,key,type,ph]) => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                    <input type={type} placeholder={ph} value={ctaForm[key]} onChange={e => setCtaForm(f => ({...f,[key]:e.target.value}))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 12px", color: "white", fontSize: 12, outline: "none" }}/>
                  </div>
                ))}
                <button type="submit" disabled={ctaSubmitting}
                  style={{ width: "100%", background: "#0EA5A0", border: "none", color: "white", borderRadius: 6, padding: 10, fontSize: 12, fontWeight: 500, marginTop: 4, opacity: ctaSubmitting ? 0.7 : 1 }}>
                  {ctaSubmitting ? "Submitting…" : t.ctaBtn}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}