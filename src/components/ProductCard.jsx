import { Link } from "react-router-dom";

const CAT_COLORS = {
  "Botanical Extracts":     ["#E6F4EA","#2d6a4f"],
  "Herbal Powders":         ["#F0FDF4","#166534"],
  "Mushroom Extracts":      ["#FDF4FF","#6b21a8"],
  "Vitamins & Minerals":    ["#EFF6FF","#1d4ed8"],
  "Greens & Superfoods":    ["#F0FDF4","#15803d"],
  "Enzymes":                ["#FEFCE8","#a16207"],
  "Probiotics & Prebiotics":["#F0FDF4","#15803d"],
  "Proteins & Amino Acids": ["#FFF7ED","#c2410c"],
  "Fatty Acids & Oils":     ["#FFFBEB","#b45309"],
  "Animal & Marine":        ["#EFF6FF","#0369a1"],
  "Cosmeceuticals":         ["#FDF4FF","#7e22ce"],
  "Sports Nutrition":       ["#FFF1F2","#be123c"],
  "Food Ingredients":       ["#FFF7ED","#ea580c"],
  "Pharmaceutical":         ["#F0F9FF","#0369a1"],
  "Dairy Ingredients":      ["#FFFBEB","#d97706"],
};

export function ProductCard({ product, onAddToEnquiry, inCart }) {
  const catName = product.product_categories?.name || "";
  const [bg, textColor] = CAT_COLORS[catName] || ["#F1F5F9","#475569"];
  const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
  const tags = Array.isArray(product.tags) ? product.tags : [];

  return (
    <div style={{
      background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
      overflow: "hidden", display: "flex", flexDirection: "column",
      transition: "all 0.2s", cursor: "pointer"
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#c7d8f8"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(24,119,242,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>

      {/* Image */}
      <Link to={`/products/${product.slug}`}>
        {image ? (
          <img src={image} alt={product.name} style={{ width: "100%", height: 160, objectFit: "cover" }}/>
        ) : (
          <div style={{ width: "100%", height: 160, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: textColor, opacity: 0.6 }}>
              {product.name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
            </span>
            <span style={{ fontSize: 10, color: textColor, opacity: 0.5 }}>{catName.split(" ")[0]}</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: "#1877F2", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>{catName}</div>
        <Link to={`/products/${product.slug}`}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4, lineHeight: 1.3 }}>{product.name}</div>
        </Link>
        {product.short_description && (
          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, marginBottom: 10, flex: 1 }}>{product.short_description}</div>
        )}

        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
            {tags.slice(0,3).map(t => (
              <span key={t} style={{ background: "#EEF4FF", color: "#1d4ed8", borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f1f5f9", marginTop: "auto" }}>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>
            {product.min_order_qty ? `MOQ: ${product.min_order_qty} ${product.unit || "kg"}` : "No MOQ"}
          </span>
          <button onClick={() => onAddToEnquiry(product)}
            style={{
              background: inCart ? "#22c55e" : "#0D1F3C",
              color: "white", border: "none", borderRadius: 5,
              padding: "6px 12px", fontSize: 10, fontWeight: 500,
              transition: "background 0.2s"
            }}>
            {inCart ? "✓ Added" : "Request Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}
