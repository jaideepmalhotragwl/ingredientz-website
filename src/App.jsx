import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar.jsx";
import { Footer } from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import Enquiry from "./pages/Enquiry.jsx";
import "./index.css";

export default function App() {
  const [lang, setLang] = useState("EN");
  const [cart, setCart] = useState([]);

  function addToCart(product) {
    setCart(prev => prev.find(p => p.id === product.id) ? prev : [...prev, product]);
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(p => p.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Cart indicator */}
        {cart.length > 0 && (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200 }}>
            <a href="/enquiry" style={{ display: "flex", alignItems: "center", gap: 8, background: "#0D1F3C", color: "white", borderRadius: 40, padding: "12px 20px", fontSize: 13, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 20px rgba(13,31,60,0.3)" }}>
              <span style={{ background: "#1877F2", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{cart.length}</span>
              View Enquiry
            </a>
          </div>
        )}

        <Navbar lang={lang} setLang={setLang}/>

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home lang={lang} cart={cart} onAddToCart={addToCart}/>}/>
            <Route path="/products" element={<Products lang={lang} cart={cart} onAddToCart={addToCart}/>}/>
            <Route path="/enquiry" element={<Enquiry lang={lang} cart={cart} onRemoveFromCart={removeFromCart} onClearCart={clearCart}/>}/>
            <Route path="*" element={
              <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: "#e2e8f0" }}>404</div>
                <a href="/" style={{ color: "#1877F2", fontSize: 13 }}>← Back to home</a>
              </div>
            }/>
          </Routes>
        </main>

        <Footer/>
      </div>
    </BrowserRouter>
  );
}
