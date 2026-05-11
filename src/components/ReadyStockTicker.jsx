import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

export function ReadyStockTicker() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("name,stock_qty,stock_unit,unit")
      .eq("status", "active")
      .eq("ready_stock", true)
      .order("name")
      .then(({ data }) => setProducts(data || []));
  }, []);

  if (!products.length) return null;

  // Duplicate for seamless infinite scroll
  const items = [...products, ...products, ...products];

  return (
    <>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .ticker-track {
          animation: tickerScroll ${Math.max(products.length * 5, 30)}s linear infinite;
          display: flex;
          width: max-content;
        }
        .ticker-track:hover { animation-play-state: paused; }
        @media (max-width: 768px) {
          .ticker-label-text { display: none; }
          .ticker-bar { height: 36px !important; }
          .ticker-item-text { font-size: 11px !important; }
          .ticker-qty-text { font-size: 11px !important; }
        }
      `}</style>

      {/* Fixed bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#0D1F3C",
        borderTop: "1px solid rgba(14,165,160,0.3)",
        height: 40, display: "flex", alignItems: "center",
        zIndex: 999, overflow: "hidden",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.3)"
      }} className="ticker-bar">

        {/* Label */}
        <div style={{
          background: "#0EA5A0", height: "100%",
          display: "flex", alignItems: "center",
          padding: "0 14px", flexShrink: 0,
          position: "relative", zIndex: 2
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "white", letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }} className="ticker-label-text">
            📦 Ready Stock
          </span>
          <span style={{ fontSize: 14 }}>📦</span>
          {/* Arrow */}
          <div style={{
            position: "absolute", right: -10, top: 0,
            width: 0, height: 0,
            borderTop: "20px solid transparent",
            borderBottom: "20px solid transparent",
            borderLeft: "10px solid #0EA5A0"
          }}/>
        </div>

        {/* Scrolling items */}
        <div style={{ overflow: "hidden", flex: 1, paddingLeft: 8 }}>
          <div className="ticker-track">
            {items.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                gap: 8, padding: "0 20px",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#22c55e", display: "inline-block", flexShrink: 0
                }}/>
                <span className="ticker-item-text" style={{
                  fontSize: 12, color: "white", fontWeight: 500, whiteSpace: "nowrap"
                }}>{p.name}</span>
                <span className="ticker-qty-text" style={{
                  fontSize: 11, color: "#0EA5A0", fontWeight: 600, whiteSpace: "nowrap"
                }}>
                  {p.stock_qty} {p.stock_unit || p.unit || "kg"}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
                  available
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: CTA */}
        <a href="/enquiry" style={{
          background: "#1877F2", color: "white",
          fontSize: 10, fontWeight: 600,
          padding: "0 14px", height: "100%",
          display: "flex", alignItems: "center",
          whiteSpace: "nowrap", textDecoration: "none",
          letterSpacing: 0.5, flexShrink: 0
        }}>
          Order Now →
        </a>
      </div>

      {/* Spacer so content doesn't hide behind ticker */}
      <div style={{ height: 40 }}/>
    </>
  );
}
